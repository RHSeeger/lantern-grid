import type { FamilyMember } from './FamilyMember';
import type { FamilyMeta } from './FamilyMeta';

/**
 * Defines the FamilyContext type: what the game knows about the family it is playing with.
 */

/**
 * What the game knows about the family it is playing with, kept up to date from Firebase.
 */
export type FamilyContext = {
    /** The family's id */
    fid: string;
    /** Its name and settings (null until they arrive) */
    meta: FamilyMeta | null;
    /** Its members, by uid */
    members: Record<string, FamilyMember>;
    /** Today's play: each player's saved data, by uid, as stored (null until it arrives) */
    data: Record<string, unknown> | null;
    /** Whether the player chose to combine everyone's work today (saved on the device) */
    combined: boolean;
};
