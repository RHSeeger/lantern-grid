/**
 * A stand-in for family/api.ts (everything that talks to Firebase), for testing family play without a network. Use it
 * with `jest.mock('../../src/typescript/family/api', () => fakeApi)`. It plays one family ("f1") with two members:
 * the player ("me") and "mom". Each player's data for the day lives in `fake.day`, and the player's own writes are
 * echoed back straight away, the way Firebase's local copy does.
 */

/** The fake family's state, which tests can read and change */
export const fake = {
    /** Each player's data for the day, by uid */
    day: {} as Record<string, Record<string, unknown>>,
    /** Calls the game's day watcher with the current data */
    push: () => {},
};

/**
 * Sets a value at a slash-separated path inside an object, making objects along the way.
 *
 * @param obj - The object (changed in place)
 * @param path - The path, e.g. "found/abc"
 * @param value - The value
 */
function setPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const parts = path.split('/');
    let at = obj;
    for (const p of parts.slice(0, -1)) {
        at[p] = (at[p] as Record<string, unknown>) ?? {};
        at = at[p] as Record<string, unknown>;
    }
    at[parts[parts.length - 1]] = value;
}

/** The fake functions, matching family/api.ts */
export const fakeApi = {
    currentUser: async () => ({ uid: 'me', isAnonymous: true, displayName: null }),
    ensureUser: async () => ({ uid: 'me', isAnonymous: true, displayName: null }),
    watchPersonal: (_uid: string, onData: (d: unknown) => void) => {
        onData({ families: [{ fid: 'f1', name: 'The Testers', joinedAt: 1 }] });
        return () => {};
    },
    watchConnected: (onChange: (c: boolean) => void) => {
        onChange(true);
        return () => {};
    },
    watchFamily: (_fid: string, onChange: (meta: unknown, members: unknown) => void) => {
        onChange(
            { name: 'The Testers', ownerUid: 'me', timezone: 'UTC', createdAt: 1 },
            { me: { name: 'Me', color: 'blue', joinedAt: 1 }, mom: { name: 'Mom', color: 'red', joinedAt: 2 } },
        );
        return () => {};
    },
    watchGameDay: (_fid: string, _day: string, onData: (d: Record<string, unknown>) => void) => {
        fake.push = () => onData(JSON.parse(JSON.stringify(fake.day)) as Record<string, unknown>);
        fake.push();
        return () => {};
    },
    readGameDay: async () => JSON.parse(JSON.stringify(fake.day)) as Record<string, unknown>,
    writeMine: async (_fid: string, _day: string, uid: string, values: Record<string, unknown>) => {
        fake.day[uid] = fake.day[uid] ?? {};
        for (const [path, value] of Object.entries(values)) setPath(fake.day[uid], path, value);
        fake.push();
    },
    forgetFamily: async () => {},
};
