/**
 * Defines the FamilyMember type: one player in a family.
 */

/**
 * One player in a family (`families/<fid>/members/<uid>`). No email addresses are stored.
 */
export type FamilyMember = {
    /** The name they picked */
    name: string;
    /** The color they picked (a PlayerColor id) */
    color: string;
    /** When they joined (milliseconds since 1970) */
    joinedAt: number;
    /** The invite code they joined with (the security rules check it) */
    inviteCode?: string;
};
