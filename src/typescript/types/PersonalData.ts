import type { FamilyListEntry } from './FamilyListEntry';

/**
 * Defines the PersonalData type: the player's own data in Firebase.
 */

/**
 * The player's own data in Firebase (`users/<uid>`) that this game uses: the families they belong to. The list is
 * shared with Buzz Off and the other games.
 */
export type PersonalData = {
    /** Their families, oldest first */
    families: FamilyListEntry[];
};
