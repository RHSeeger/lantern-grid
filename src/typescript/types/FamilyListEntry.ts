/**
 * Defines the FamilyListEntry type: one of the families the player belongs to.
 */

/**
 * One of the families the player belongs to (`users/<uid>/families/<fid>`), for the list to switch between.
 */
export type FamilyListEntry = {
    /** The family's id */
    fid: string;
    /** The family's name */
    name: string;
    /** When the player joined (milliseconds since 1970) */
    joinedAt: number;
};
