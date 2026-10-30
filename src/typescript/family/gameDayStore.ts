import { get, onValue, ref, update } from 'firebase/database';
import { GAME_KEY } from '../data/app';
import { asObject } from '../gamelogic/personal';
import { database } from './firebase';

/**
 * One day of a family's play in this game, in Firebase (`games/<game>/<fid>/<day>/<uid>`): each player's own
 * progress, under their own id. Only they can write it; every member can read everyone's (the game shows others'
 * work only once the player chooses to combine it). What each player's data holds is up to the game.
 */

/**
 * Returns the path of a family's day.
 *
 * @param fid - The family
 * @param day - The day key
 * @returns The path
 */
function dayPath(fid: string, day: string): string {
    return `games/${GAME_KEY}/${fid}/${day}`;
}

/**
 * Watches a family's day; every member's changes arrive live (and the player's own straight away, even offline).
 *
 * @param fid - The family
 * @param day - The day key
 * @param onData - Called with each player's data, by uid, on every change
 * @param onError - Called if it can't be read (the player was removed, or the family was deleted)
 * @returns A function that stops watching
 */
export function watchGameDay(
    fid: string,
    day: string,
    onData: (data: Record<string, unknown>) => void,
    onError: (e: Error) => void,
): () => void {
    return onValue(ref(database(), dayPath(fid, day)), (snap) => onData(asObject(snap.val())), onError);
}

/**
 * Reads a family's day once (e.g. yesterday's).
 *
 * @param fid - The family
 * @param day - The day key
 * @returns Each player's data, by uid
 */
export async function readGameDay(fid: string, day: string): Promise<Record<string, unknown>> {
    return asObject((await get(ref(database(), dayPath(fid, day)))).val());
}

/**
 * Saves part of the player's own data for a day, as one multi-path update.
 *
 * @param fid - The family
 * @param day - The day key
 * @param uid - The player
 * @param values - The values, by path within the player's data (e.g. `{ 'found/abc': {...} }`)
 */
export async function writeMine(fid: string, day: string, uid: string, values: Record<string, unknown>): Promise<void> {
    await update(ref(database(), `${dayPath(fid, day)}/${uid}`), values);
}
