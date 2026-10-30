/**
 * Defines the InviteLink type: the family and code in an invite link.
 */

/**
 * The family and code in an invite link (`<game>#join=<fid>:<code>`).
 */
export type InviteLink = {
    /** The family's id */
    fid: string;
    /** The invite code (the security rules check it) */
    code: string;
};
