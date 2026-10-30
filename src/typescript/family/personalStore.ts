import { onValue, ref } from 'firebase/database';
import { parsePersonalData } from '../gamelogic/personal';
import type { PersonalData } from '../types/PersonalData';
import { database } from './firebase';

/**
 * The player's own data in Firebase (`users/<uid>`): the list of their families. Only they can read or write it.
 */

/**
 * Watches the player's data.
 *
 * @param uid - The player
 * @param onData - Called with their data on every change
 * @returns A function that stops watching
 */
export function watchPersonal(uid: string, onData: (data: PersonalData) => void): () => void {
    return onValue(
        ref(database(), `users/${uid}/families`),
        (snap) => onData(parsePersonalData({ families: snap.val() })),
        () => onData(parsePersonalData(null)),
    );
}
