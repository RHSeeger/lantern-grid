/**
 * Defines the FamilyMeta type: a family's name and settings.
 */

/**
 * A family's name and settings (`families/<fid>/meta`). Set once, when the family is created.
 */
export type FamilyMeta = {
    /** The family's name */
    name: string;
    /** Who created it; only they can make new invite links, remove members or delete the family */
    ownerUid: string;
    /** The family's timezone (IANA name, from the creator's device); its day changes at midnight there */
    timezone: string;
    /** When it was created (milliseconds since 1970) */
    createdAt: number;
};
