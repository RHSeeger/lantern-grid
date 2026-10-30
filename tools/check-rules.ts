import { GAME_KEY } from '../src/typescript/data/app';
import { ALL_GAME_KEYS } from '../src/typescript/data/family';
import { FIREBASE_CONFIG } from '../src/typescript/data/firebaseConfig';

/**
 * Checks the security rules (database.rules.json) for this game's part of the shared database, against the real
 * Firebase project, without the emulator (so no Java is needed):
 *
 *   npm run check:rules
 *
 * It signs in three throwaway guest users (owner, member, outsider), creates a test family, tries each thing that
 * should be allowed and each thing that should be refused in `games/<this game>/`, prints what happened, then deletes
 * the test family and the three users. Run it after publishing the rules. Buzz Off's own `npm run check:rules` checks
 * the families, invites and Buzz Off's days.
 */

/** Firebase's sign-in REST API */
const AUTH_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

/** The day the test family plays (far in the past, so it can't be mistaken for real play) */
const DAY = '2000-01-02';

/** Firebase's server-timestamp placeholder, in REST form */
const NOW = { '.sv': 'timestamp' };

/** Writes this game allows a player to make in their own day (path within it, and value) */
const GOOD: [string, unknown][] = [
    ['found/0127', { w: 'cart', at: 1 }],
    ['hints', true],
];

/** Writes this game must refuse in a player's own day */
const BAD: [string, string, unknown][] = [
    ['a word that does not match its path', 'found/012', { w: 'cart', at: 1 }],
    ['a badly formed word', 'found/0127', { w: 'CA1T', at: 1 }],
    ['a word with extra fields', 'found/0128', { w: 'cart', at: 1, score: 99 }],
    ['an unknown field', 'junk', 1],
];

/**
 * Signs in a new guest user.
 *
 * @returns Their id and token
 */
async function newGuest(): Promise<{ uid: string; token: string }> {
    const res = await fetch(`${AUTH_URL}:signUp?key=${FIREBASE_CONFIG.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnSecureToken: true }),
    });
    const body = (await res.json()) as { localId?: string; idToken?: string; error?: { message: string } };
    if (!res.ok || !body.localId || !body.idToken) {
        throw new Error(`Couldn't sign in a guest (${body.error?.message ?? res.status}). Is anonymous sign-in on?`);
    }
    return { uid: body.localId, token: body.idToken };
}

/**
 * Deletes a guest user.
 *
 * @param token - Their token
 */
async function deleteGuest(token: string): Promise<void> {
    await fetch(`${AUTH_URL}:delete?key=${FIREBASE_CONFIG.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: token }),
    });
}

/**
 * Reads or writes the database as a user.
 *
 * @param token - The user's token
 * @param method - GET, PUT (set), PATCH (multi-path update) or DELETE
 * @param path - The path ('' for the root)
 * @param body - What to write
 * @returns Whether the rules allowed it
 */
async function db(
    token: string,
    method: 'GET' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
): Promise<{ ok: boolean }> {
    const base = FIREBASE_CONFIG.databaseURL.replace(/\/$/, '');
    const res = await fetch(`${base}/${path}.json?auth=${token}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    await res.json().catch(() => null);
    return { ok: res.ok };
}

/**
 * Runs the checks.
 */
export async function main(): Promise<void> {
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.databaseURL) {
        console.error('Fill in src/typescript/data/firebaseConfig.ts first (see SETUP-FIREBASE.md).');
        process.exitCode = 1;
        return;
    }
    const owner = await newGuest();
    const member = await newGuest();
    const outsider = await newGuest();
    const fid = `rules-check-${GAME_KEY}-${Date.now().toString(36)}`;
    const code = 'RulesCheckCode' + Math.random().toString(36).slice(2, 12);
    const fam = `families/${fid}`;
    const game = `games/${GAME_KEY}/${fid}`;
    const mine = (uid: string): string => `${game}/${DAY}/${uid}`;
    const results: { expected: boolean; actual: boolean }[] = [];

    /**
     * Records one check.
     *
     * @param name - What is being tried
     * @param expected - Whether it should be allowed
     * @param attempt - The attempt
     */
    const check = async (name: string, expected: boolean, attempt: Promise<{ ok: boolean }>): Promise<void> => {
        const { ok } = await attempt;
        results.push({ expected, actual: ok });
        console.log(`${ok === expected ? 'PASS' : 'FAIL'}  ${expected ? 'allowed' : 'refused'}  ${name}`);
    };

    try {
        await check(
            'Owner creates a family',
            true,
            db(owner.token, 'PATCH', '', {
                [`${fam}/meta`]: { name: 'Rules check', ownerUid: owner.uid, timezone: 'UTC', createdAt: NOW },
                [`${fam}/members/${owner.uid}`]: { name: 'Owner', color: 'red', joinedAt: NOW },
                [`invites/${fid}`]: code,
                [`users/${owner.uid}/families/${fid}`]: { name: 'Rules check', joinedAt: NOW },
            }),
        );
        await check(
            'Member joins with the right code',
            true,
            db(member.token, 'PUT', `${fam}/members/${member.uid}`, {
                name: 'Member',
                color: 'blue',
                joinedAt: NOW,
                inviteCode: code,
            }),
        );
        for (const [path, value] of GOOD) {
            await check(
                `Member saves their own ${path}`,
                true,
                db(member.token, 'PUT', `${mine(member.uid)}/${path}`, value),
            );
        }
        for (const [name, path, value] of BAD) {
            await check(`Member saves ${name}`, false, db(member.token, 'PUT', `${mine(member.uid)}/${path}`, value));
        }
        const [goodPath, goodValue] = GOOD[0];
        await check(
            "Member saves into the owner's play",
            false,
            db(member.token, 'PUT', `${mine(owner.uid)}/${goodPath}`, goodValue),
        );
        await check(
            'Member saves on a badly formed day',
            false,
            db(member.token, 'PUT', `${game}/someday/${member.uid}/${goodPath}`, goodValue),
        );
        await check('Owner reads the family’s play', true, db(owner.token, 'GET', game));
        await check('Outsider reads the family’s play', false, db(outsider.token, 'GET', game));
        await check(
            'Outsider saves play in the family',
            false,
            db(outsider.token, 'PUT', `${mine(outsider.uid)}/${goodPath}`, goodValue),
        );
        await check('Member deletes the family’s play', false, db(member.token, 'DELETE', game));
        await check(
            'Owner deletes the family (and its play in every game)',
            true,
            db(owner.token, 'PATCH', '', {
                ...Object.fromEntries(ALL_GAME_KEYS.map((g) => [`games/${g}/${fid}`, null])),
                [`${fam}/days`]: null,
                [`${fam}/members`]: null,
                [`${fam}/meta`]: null,
                [`invites/${fid}`]: null,
                [`users/${owner.uid}`]: null,
            }),
        );
    } finally {
        await Promise.all([owner, member, outsider].map((u) => deleteGuest(u.token)));
    }

    const failed = results.filter((r) => r.expected !== r.actual);
    console.log(`\n${results.length - failed.length} of ${results.length} checks passed.`);
    if (failed.length) {
        console.log('The rules allow or refuse something they should not. Check database.rules.json is published.');
        process.exitCode = 1;
    }
}
