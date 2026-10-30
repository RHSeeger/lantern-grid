import type { FamilyListEntry } from '../types/FamilyListEntry';
import type { PersonalData } from '../types/PersonalData';

/**
 * The player's data saved in Firebase (`users/<uid>`): reading the part this game uses (their families). Buzz Off
 * keeps more there (its history and badges); that is left alone.
 */

/**
 * Returns a value as a plain object, or an empty one.
 *
 * @param v - The value
 * @returns The object
 */
export function asObject(v: unknown): Record<string, unknown> {
    return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

/**
 * Reads a player's data from Firebase (`users/<uid>`), skipping anything malformed.
 *
 * @param raw - The saved value (null for a new player)
 * @returns The player's data
 */
export function parsePersonalData(raw: unknown): PersonalData {
    const families: FamilyListEntry[] = Object.entries(asObject(asObject(raw).families))
        .map(([fid, v]) => {
            const f = asObject(v);
            return {
                fid,
                name: typeof f.name === 'string' ? f.name : 'Family',
                joinedAt: typeof f.joinedAt === 'number' ? f.joinedAt : 0,
            };
        })
        .sort((a, b) => a.joinedAt - b.joinedAt);
    return { families };
}
