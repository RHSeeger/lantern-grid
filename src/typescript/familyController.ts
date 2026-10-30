import { APP_NAME } from './data/app';
import { PLAYER_COLORS } from './data/family';
import { FAMILY_PLAY_AVAILABLE } from './data/firebaseConfig';
import { dayKey, localTimeZone } from './gamelogic/dates';
import { formatInviteLink, parseInviteLink } from './gamelogic/invites';
import { getJSON, setJSON } from './gamelogic/storage';
import { session } from './session';
import type { FamilyHooks } from './types/FamilyHooks';
import type { InviteLink } from './types/InviteLink';
import type { PersonalData } from './types/PersonalData';
import type { PlayerProfile } from './types/PlayerProfile';
import { showCreateFamily, showFamilyInfo, showJoinFamily, showPlayMode } from './ui/familyScreens';
import { closeModal } from './ui/modal';
import { showToast } from './ui/toast';

/**
 * Family play: switching between local and family play, connecting to a family and following its day live, saving the
 * player's progress, combining everyone's work, creating and joining families, and signing in. Firebase itself is in
 * family/, loaded the first time family play is used. This file knows nothing about the game's rules: each player's
 * data for the day is handed to the game as it is stored (see FamilyHooks), and the game says what to save.
 */

/** The Firebase functions (family/api.ts), once loaded */
let api: typeof import('./family/api') | null = null;

/** What the game does for family play (set by initFamily()) */
let hooks: FamilyHooks;

/** Stops watching the family's name and members */
let stopFamily: (() => void) | null = null;

/** Stops watching the family's day */
let stopDay: (() => void) | null = null;

/** Stops watching the player's own data */
let stopPersonal: (() => void) | null = null;

/** Whose data is being watched */
let personalUid: string | null = null;

/** Whether the connection is being watched */
let watchingConnection = false;

/** Show the welcome screen when the family's day first arrives */
let splashOnFirstData = false;

/** Waiting for the family's name and members to arrive */
let readyCallbacks: (() => void)[] = [];

/**
 * Sets up family play.
 *
 * @param h - What the game does for family play
 */
export function initFamily(h: FamilyHooks): void {
    hooks = h;
}

/**
 * Loads the Firebase functions the first time they're needed.
 *
 * @returns The functions
 */
async function loadApi(): Promise<typeof import('./family/api')> {
    if (!api) api = await import('./family/api');
    return api;
}

/**
 * Returns the name and color the player last used, or a default.
 *
 * @returns The profile
 */
function savedProfile(): PlayerProfile {
    return getJSON<PlayerProfile>('profile', { name: '', color: PLAYER_COLORS[0].id });
}

/**
 * Remembers the player's name and color, and an invite code they used (so a guest's families can be moved to a
 * Google account later).
 *
 * @param me - The name and color
 * @param link - The family and code
 */
function remember(me: PlayerProfile, link: InviteLink): void {
    setJSON('profile', me);
    setJSON('inviteCodes', { ...getJSON<Record<string, string>>('inviteCodes', {}), [link.fid]: link.code });
}

/**
 * Loads whether the player combined everyone's work in a family on a day, from the device.
 *
 * @param fid - The family
 * @param key - The day key
 * @returns True if they did
 */
function loadCombined(fid: string, key: string): boolean {
    return getJSON<Record<string, string>>('combined', {})[fid] === key;
}

/**
 * Saves whether the player combined everyone's work today (only the latest day is kept for each family).
 *
 * @param fid - The family
 * @param key - The day key
 * @param on - True if combined
 */
function saveCombined(fid: string, key: string, on: boolean): void {
    const all = getJSON<Record<string, string>>('combined', {});
    if (on) all[fid] = key;
    else delete all[fid];
    setJSON('combined', all);
}

/**
 * Starts watching the player's own data (their families), and waits for it to arrive.
 *
 * @param uid - The player
 */
async function watchPersonalData(uid: string): Promise<void> {
    if (personalUid === uid && session.personalLoaded) return;
    const a = await loadApi();
    stopPersonal?.();
    personalUid = uid;
    session.personalLoaded = false;
    await new Promise<void>((resolve) => {
        stopPersonal = a.watchPersonal(uid, (data) => {
            session.personal = data;
            session.personalLoaded = true;
            hooks.render();
            resolve();
        });
    });
}

/**
 * Connects to the player's account, if they have one (perhaps from Buzz Off or another of the games, which share the
 * sign-in), so their families can be listed.
 */
async function connectAccount(): Promise<void> {
    if (!FAMILY_PLAY_AVAILABLE) return;
    const a = await loadApi();
    session.user = await a.currentUser();
    if (session.user) await watchPersonalData(session.user.uid);
}

/**
 * Stops following the family (its members and day).
 */
function stopWatchingFamily(): void {
    stopFamily?.();
    stopDay?.();
    stopFamily = null;
    stopDay = null;
    readyCallbacks = [];
}

/**
 * Switches to local play.
 *
 * @param message - A message to show, if any
 */
export function switchToLocal(message?: string): void {
    stopWatchingFamily();
    session.family = null;
    session.mode = { kind: 'local' };
    setJSON('mode', session.mode);
    hooks.openLocal();
    hooks.showReady();
    if (message) showToast(message);
}

/**
 * Handles the family disappearing (the player was removed, or it was deleted): takes it off their list and switches
 * to local play.
 *
 * @param fid - The family
 */
function familyGone(fid: string): void {
    if (session.family?.fid !== fid) return;
    const name = session.family.meta?.name ?? 'that family';
    if (session.user) void api?.forgetFamily(session.user.uid, fid).catch(() => {});
    switchToLocal(`You're no longer in ${name}, so you're playing on your own.`);
}

/**
 * Switches to playing with a family: connects, and follows its members and day live.
 *
 * @param fid - The family
 * @param options - Whether to show the welcome screen once the day arrives
 */
export async function enterFamily(fid: string, options: { splash: boolean }): Promise<void> {
    stopWatchingFamily();
    session.mode = { kind: 'family', fid };
    setJSON('mode', session.mode);
    session.family = { fid, meta: null, members: {}, data: null, combined: false };
    const listed = session.personal.families.find((f) => f.fid === fid)?.name;
    hooks.showConnecting(`Connecting to ${listed ?? 'your family'}…`);
    splashOnFirstData = options.splash;
    let a: typeof import('./family/api');
    try {
        a = await loadApi();
        session.user = await a.ensureUser();
        await watchPersonalData(session.user.uid);
    } catch {
        hooks.showConnecting("Couldn't connect to your family. Check your connection, or play on your own for now.");
        return;
    }
    if (session.family?.fid !== fid) return;
    if (!watchingConnection) {
        watchingConnection = true;
        a.watchConnected((online) => {
            session.online = online;
            hooks.render();
        });
    }
    stopFamily = a.watchFamily(
        fid,
        (meta, members) => {
            const fam = session.family;
            if (fam?.fid !== fid) return;
            fam.meta = meta;
            fam.members = members;
            const key = dayKey(new Date(), meta.timezone);
            if (key !== session.todayKey || !stopDay) openFamilyDay(key);
            else hooks.render();
            const waiting = readyCallbacks;
            readyCallbacks = [];
            waiting.forEach((cb) => cb());
        },
        () => familyGone(fid),
    );
}

/**
 * Returns today's date key in the family's timezone.
 *
 * @returns The day key (or the device's date, if the family's settings haven't arrived)
 */
export function familyDayKey(): string {
    return dayKey(new Date(), session.family?.meta?.timezone);
}

/**
 * Starts following one of the family's days.
 *
 * @param key - The day key
 * @param splash - Show the welcome screen when it arrives
 */
export function openFamilyDay(key: string, splash = false): void {
    const fam = session.family;
    if (!fam || !api) return;
    stopDay?.();
    session.todayKey = key;
    fam.data = null;
    fam.combined = loadCombined(fam.fid, key);
    if (splash) splashOnFirstData = true;
    const fid = fam.fid;
    stopDay = api.watchGameDay(
        fid,
        key,
        (data) => applyFamilyDay(fid, key, data),
        () => familyGone(fid),
    );
}

/**
 * Takes in a new version of the family's day, and hands it to the game.
 *
 * @param fid - The family
 * @param key - The day key
 * @param data - Each player's data, by uid
 */
function applyFamilyDay(fid: string, key: string, data: Record<string, unknown>): void {
    const fam = session.family;
    if (!fam || fam.fid !== fid || session.todayKey !== key || !session.user) return;
    const first = fam.data === null;
    fam.data = data;
    hooks.dataChanged(first);
    if (first) {
        hooks.showReady();
        if (splashOnFirstData) {
            splashOnFirstData = false;
            hooks.openSplash();
        }
    }
}

/**
 * Combines everyone's work for today (or shows only the player's own again).
 *
 * @param on - True to combine
 */
export function setCombined(on: boolean): void {
    const fam = session.family;
    if (!fam) return;
    fam.combined = on;
    saveCombined(fam.fid, session.todayKey, on);
    hooks.render();
}

/**
 * Saves part of the player's own data for today, in the family's game. The game sees the change straight away (from
 * Firebase's local copy), even offline.
 *
 * @param values - The values, by path within the player's data for the day
 */
export function saveMine(values: Record<string, unknown>): void {
    const fam = session.family;
    const user = session.user;
    if (!fam || !user || !api) return;
    api.writeMine(fam.fid, session.todayKey, user.uid, values).catch(() =>
        hooks.flash("Couldn't save that. Check your connection."),
    );
}

/**
 * Reads another of the family's days (e.g. yesterday's).
 *
 * @param key - The day key
 * @returns Each player's data, by uid
 */
export async function readFamilyDay(key: string): Promise<Record<string, unknown>> {
    const fam = session.family;
    if (!fam || !api) return {};
    return api.readGameDay(fam.fid, key);
}

/**
 * Shares an invite link: with the device's share sheet if it has one, otherwise by copying it.
 *
 * @param link - The link
 */
function shareLink(link: string): void {
    if (navigator.share) {
        navigator.share({ title: APP_NAME, text: `Join our family game of ${APP_NAME}!`, url: link }).catch(() => {});
        return;
    }
    navigator.clipboard
        .writeText(link)
        .then(() => showToast('Invite link copied.'))
        .catch(() => showToast('Copy the link from the box.'));
}

/**
 * Returns the game's address, without any `?` or `#` part (for invite links).
 *
 * @returns The address
 */
function currentGameUrl(): string {
    return location.origin + location.pathname;
}

/**
 * Opens the family's screen (members, invite link, your name and color, leaving).
 */
export function openFamilyInfo(): void {
    const fam = session.family;
    const user = session.user;
    if (!fam || !user || !api) return;
    if (!fam.meta) {
        readyCallbacks.push(openFamilyInfo);
        return;
    }
    const a = api;
    const { fid } = fam;
    const linkFor = (code: string): string => formatInviteLink(currentGameUrl(), { fid, code });
    showFamilyInfo({
        meta: fam.meta,
        members: fam.members,
        myUid: user.uid,
        inviteLink: async () => linkFor(await a.readInviteCode(fid)),
        onShare: shareLink,
        onRegenerate: async () => linkFor(await a.regenerateInviteCode(fid)),
        onRemoveMember: (uid) => a.removeMember(fid, uid),
        onSaveProfile: async (me) => {
            try {
                await a.updateMyProfile(fid, user.uid, me);
                setJSON('profile', me);
            } catch {
                return "Couldn't save. Check your connection.";
            }
        },
        onLeave: () => {
            const name = fam.meta?.name ?? 'the family';
            closeModal();
            switchToLocal(`You left ${name}.`);
            void a.leaveFamily(user.uid, fid).catch(() => showToast("Couldn't leave the family. Try again."));
        },
        onDelete: () => {
            const name = fam.meta?.name ?? 'The family';
            closeModal();
            switchToLocal(`${name} was deleted.`);
            void a.deleteFamily(user.uid, fid).catch(() => showToast("Couldn't delete the family. Try again."));
        },
    });
}

/**
 * Opens the Create a Family screen; once created, switches to it and shows its invite link.
 */
function openCreateFamily(): void {
    showCreateFamily({
        profile: savedProfile(),
        onCreate: async (familyName, me) => {
            try {
                const a = await loadApi();
                const user = await a.ensureUser();
                session.user = user;
                await watchPersonalData(user.uid);
                const link = await a.createFamily(user.uid, familyName, me, localTimeZone() ?? 'UTC');
                remember(me, link);
                closeModal();
                await enterFamily(link.fid, { splash: false });
                showToast(`${familyName} is ready. Share the invite link to bring everyone in.`);
                openFamilyInfo();
            } catch {
                return "Couldn't create the family. Check your connection (and the Firebase setup).";
            }
        },
    });
}

/**
 * Opens the Join a Family screen for an invite link; once joined, switches to the family.
 *
 * @param link - The family and code
 */
export function openJoinFamily(link: InviteLink): void {
    if (!FAMILY_PLAY_AVAILABLE) {
        showToast("Family play isn't set up on this site yet, so the invite link can't be used.");
        return;
    }
    if (session.mode.kind === 'family' && session.mode.fid === link.fid) {
        showToast("You're already playing with this family.");
        return;
    }
    showJoinFamily({
        profile: savedProfile(),
        user: session.user,
        onJoin: async (me) => {
            let a: typeof import('./family/api');
            try {
                a = await loadApi();
                const user = await a.ensureUser();
                session.user = user;
                await watchPersonalData(user.uid);
            } catch {
                return "Couldn't connect. Check your connection and try again.";
            }
            try {
                await a.joinFamily(session.user.uid, link, me);
            } catch {
                return "This invite link doesn't work any more. Ask for a new one.";
            }
            remember(me, link);
            closeModal();
            await enterFamily(link.fid, { splash: true });
        },
        onSignInWithGoogle: signInWithGoogle,
    });
}

/**
 * Signs in with Google. A guest's families come along; if the Google account was already used with the games, the
 * guest's families are rejoined where possible (with the invite codes saved on this device).
 *
 * @returns A message saying why it failed, or nothing on success
 */
async function signInWithGoogle(): Promise<string | void> {
    const a = await loadApi();
    const guestData: PersonalData | null = session.personalLoaded ? session.personal : null;
    let previousUid: string | null;
    try {
        const result = await a.signInWithGoogle();
        session.user = result.user;
        previousUid = result.previousUid;
    } catch (e) {
        return a.authErrorMessage(e);
    }
    const user = session.user;
    personalUid = null;
    await watchPersonalData(user.uid);
    if (previousUid && guestData) {
        const codes = getJSON<Record<string, string>>('inviteCodes', {});
        const missing = guestData.families.filter((f) => !session.personal.families.some((g) => g.fid === f.fid));
        const failed: string[] = [];
        for (const f of missing) {
            const code = codes[f.fid];
            if (!code) {
                failed.push(f.name);
                continue;
            }
            await a
                .joinFamily(
                    user.uid,
                    { fid: f.fid, code },
                    savedProfile().name ? savedProfile() : { name: 'Me', color: 'red' },
                )
                .catch(() => failed.push(f.name));
        }
        if (failed.length) {
            showToast(`Ask for a new invite link to rejoin: ${failed.join(', ')}.`, { duration: 8000 });
        }
    }
    showToast(`Signed in${user.displayName ? ` as ${user.displayName}` : ''}.`);
    if (session.mode.kind === 'family') {
        const fid = session.mode.fid;
        if (session.personal.families.some((f) => f.fid === fid)) await enterFamily(fid, { splash: false });
        else switchToLocal();
    }
    hooks.render();
}

/**
 * Signs out of Google (in every game, since they share the sign-in); switches to local play.
 */
async function signOut(): Promise<void> {
    const a = await loadApi();
    if (session.mode.kind === 'family') switchToLocal();
    stopPersonal?.();
    stopPersonal = null;
    personalUid = null;
    session.personal = { families: [] };
    session.personalLoaded = false;
    await a.signOutUser().catch(() => {});
    session.user = null;
    hooks.render();
    showToast('Signed out. Sign in again any time to get your families back.');
}

/**
 * Opens the "Who are you playing with?" screen.
 */
export async function openPlayMode(): Promise<void> {
    try {
        await Promise.race([connectAccount(), new Promise((resolve) => setTimeout(resolve, 5000))]);
    } catch {
        // Offline: show what's known
    }
    showPlayMode({
        available: FAMILY_PLAY_AVAILABLE,
        user: session.user,
        families: session.personal.families,
        mode: session.mode,
        onChoose: (mode) => {
            if (mode.kind === 'local') switchToLocal('Playing on your own.');
            else void enterFamily(mode.fid, { splash: true });
        },
        onFamilyInfo: () => openFamilyInfo(),
        onCreate: openCreateFamily,
        onJoinLink: (text) => {
            const link = parseInviteLink(text);
            if (!link) return false;
            closeModal();
            openJoinFamily(link);
            return true;
        },
        onSignInWithGoogle: signInWithGoogle,
        onSignOut: () => void signOut(),
    });
}
