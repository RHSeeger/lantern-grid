import { combineFound } from './gamelogic/play';
import { parsePlayerDay } from './gamelogic/day';
import type { AuthUser } from './types/AuthUser';
import type { FamilyContext } from './types/FamilyContext';
import type { FoundPath } from './types/FoundPath';
import type { PersonalData } from './types/PersonalData';
import type { PlayerDay } from './types/PlayerDay';
import type { PlayMode } from './types/PlayMode';
import type { Puzzle } from './types/Puzzle';
import type { Theme } from './types/Theme';
import type { Wordlist } from './types/Wordlist';

/**
 * The state of the current session, shared by app.ts (the game) and familyController.ts (family play), plus small
 * calculations on it. Nothing else holds game state.
 */

/** The session's state. Set up by startApp() before anything reads it */
export const session = {
    /** The word list */
    wordlist: null as unknown as Wordlist,
    /** The puzzle list (each grid's letters) */
    puzzleLines: [] as string[],
    /** Who the player is playing with */
    mode: { kind: 'local' } as PlayMode,
    /** The day being played (in the family's timezone in family play) */
    todayKey: '',
    /** The day's grid and answers */
    puzzle: null as unknown as Puzzle,
    /** The player's own play today (local play's, or theirs in the family) */
    mine: null as unknown as PlayerDay,
    /** The squares being traced */
    path: [] as number[],
    /** Whether the hint numbers are showing */
    hintsShown: false,
    /** The light/dark choice */
    theme: 'auto' as Theme,
    /** Who is signed in to Firebase (family play), once known */
    user: null as AuthUser | null,
    /** The player's data from Firebase (their families) */
    personal: { families: [] } as PersonalData,
    /** Whether the player's data has arrived from Firebase */
    personalLoaded: false,
    /** The family being played with, in family play */
    family: null as FamilyContext | null,
    /** Whether Firebase is connected (family play) */
    online: true,
};

/**
 * Returns each family member's play today (family play only), including members who haven't played yet.
 *
 * @returns Each member's day, by uid (empty in local play, or before the day arrives)
 */
export function familyDays(): Record<string, PlayerDay> {
    const fam = session.family;
    if (!fam?.data) return {};
    const out: Record<string, PlayerDay> = {};
    for (const uid of new Set([...Object.keys(fam.members), ...Object.keys(fam.data)])) {
        out[uid] = parsePlayerDay(session.todayKey, fam.data[uid]);
    }
    return out;
}

/**
 * Returns whether the player is seeing everyone's work combined (family play, once they choose to).
 *
 * @returns True when combined
 */
export function isCombined(): boolean {
    return !!session.family?.combined;
}

/**
 * Returns the words shown on the board: the player's own, or (once combined) everyone's, each with who found it.
 *
 * @returns The words, with their paths, in the order found
 */
export function shownFound(): FoundPath[] {
    if (!isCombined()) return session.mine.found;
    const days = familyDays();
    return combineFound(Object.entries(days).map(([uid, d]) => d.found.map((f) => ({ ...f, by: uid }))));
}

/**
 * Returns the name and color of a family member.
 *
 * @param uid - Their user id
 * @returns Their name and color (for someone who left, a stand-in)
 */
export function memberInfo(uid: string): { name: string; color: string } {
    const m = session.family?.members[uid];
    return m ? { name: m.name, color: m.color } : { name: 'someone who left', color: 'none' };
}

/**
 * Returns the name of the family being played with.
 *
 * @returns The name, or null in local play
 */
export function familyName(): string | null {
    if (session.mode.kind !== 'family') return null;
    const fid = session.mode.fid;
    return session.family?.meta?.name ?? session.personal.families.find((f) => f.fid === fid)?.name ?? 'your family';
}
