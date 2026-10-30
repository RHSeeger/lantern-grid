/**
 * Defines the AuthUser type: who is signed in to Firebase.
 */

/**
 * Who is signed in to Firebase: a guest (anonymous, tied to this browser) or a Google account (works on any device).
 */
export type AuthUser = {
    /** Their Firebase user id */
    uid: string;
    /** True for a guest */
    isAnonymous: boolean;
    /** The Google account's name, for "Signed in as ..."; null for a guest */
    displayName: string | null;
};
