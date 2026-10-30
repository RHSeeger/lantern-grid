import { initializeApp } from 'firebase/app';
import {
    GoogleAuthProvider,
    getAuth,
    linkWithPopup,
    onAuthStateChanged,
    signInAnonymously,
    signInWithCredential,
    signInWithPopup,
    signOut,
    type Auth,
    type User,
} from 'firebase/auth';
import { getDatabase, onValue, ref, type Database } from 'firebase/database';
import { FIREBASE_CONFIG } from '../data/firebaseConfig';
import type { AuthUser } from '../types/AuthUser';

/**
 * Connecting to Firebase, and signing in: as a guest (anonymous; tied to this browser), or with Google (works on any
 * device). A guest can sign in with Google later and keep their user id. Sign-in uses a popup, not a redirect:
 * redirects are unreliable when the game isn't on Firebase's own domain (always the case on GitHub Pages).
 */

/** The Firebase services, made the first time they're needed */
let services: { auth: Auth; db: Database; ready: Promise<void> } | null = null;

/**
 * Returns the Firebase services, connecting the first time.
 *
 * @returns The auth and database services, and a promise that resolves once the saved sign-in (if any) is restored
 */
function firebase(): { auth: Auth; db: Database; ready: Promise<void> } {
    if (!services) {
        const app = initializeApp(FIREBASE_CONFIG);
        const auth = getAuth(app);
        const ready = new Promise<void>((resolve) => {
            const stop = onAuthStateChanged(auth, () => {
                stop();
                resolve();
            });
        });
        services = { auth, db: getDatabase(app), ready };
    }
    return services;
}

/**
 * Returns the database.
 *
 * @returns The Realtime Database
 */
export function database(): Database {
    return firebase().db;
}

/**
 * Watches whether the game is connected to Firebase.
 *
 * @param onChange - Called with true or false whenever it changes
 * @returns A function that stops watching
 */
export function watchConnected(onChange: (connected: boolean) => void): () => void {
    return onValue(ref(firebase().db, '.info/connected'), (snap) => onChange(snap.val() === true));
}

/**
 * Describes a Firebase user for the rest of the game.
 *
 * @param u - The Firebase user
 * @returns Who they are
 */
function toAuthUser(u: User): AuthUser {
    return { uid: u.uid, isAnonymous: u.isAnonymous, displayName: u.isAnonymous ? null : u.displayName };
}

/**
 * Returns who is signed in, once the saved sign-in (if any) has been restored.
 *
 * @returns The user, or null if nobody is signed in
 */
export async function currentUser(): Promise<AuthUser | null> {
    const { auth, ready } = firebase();
    await ready;
    return auth.currentUser ? toAuthUser(auth.currentUser) : null;
}

/**
 * Returns who is signed in, signing in as a guest if nobody is.
 *
 * @returns The user
 */
export async function ensureUser(): Promise<AuthUser> {
    const existing = await currentUser();
    if (existing) return existing;
    const cred = await signInAnonymously(firebase().auth);
    return toAuthUser(cred.user);
}

/**
 * Signs in with Google. A guest is upgraded in place (same user id, so their families and stats stay). If that Google
 * account has already been used with the game, it is signed in to instead, and the guest's user id is returned so its
 * data can be brought across.
 *
 * @returns The Google user, and the guest's user id if the account was switched
 * @throws With a Firebase error code (e.g. auth/popup-blocked) if sign-in fails or is cancelled
 */
export async function signInWithGoogle(): Promise<{ user: AuthUser; previousUid: string | null }> {
    const { auth, ready } = firebase();
    await ready;
    const provider = new GoogleAuthProvider();
    const guest = auth.currentUser;
    if (guest?.isAnonymous) {
        try {
            const linked = await linkWithPopup(guest, provider);
            return { user: toAuthUser(linked.user), previousUid: null };
        } catch (e) {
            const code = (e as { code?: string }).code;
            const credential = GoogleAuthProvider.credentialFromError(e as never);
            if (code !== 'auth/credential-already-in-use' || !credential) throw e;
            const switched = await signInWithCredential(auth, credential);
            return { user: toAuthUser(switched.user), previousUid: guest.uid };
        }
    }
    const signedIn = await signInWithPopup(auth, provider);
    return { user: toAuthUser(signedIn.user), previousUid: null };
}

/**
 * Signs out.
 */
export async function signOutUser(): Promise<void> {
    await signOut(firebase().auth);
}

/**
 * Explains a sign-in error to the player.
 *
 * @param e - The error
 * @returns What to tell them
 */
export function authErrorMessage(e: unknown): string {
    const code = (e as { code?: string }).code ?? '';
    if (code === 'auth/popup-blocked')
        return 'The sign-in window was blocked. Allow pop-ups for this site and try again.';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request')
        return 'Sign-in was cancelled.';
    if (code === 'auth/operation-not-supported-in-this-environment' || code === 'auth/web-storage-unsupported') {
        return "Sign-in doesn't work here. If you added the game to your home screen, try it in your browser instead.";
    }
    if (code === 'auth/unauthorized-domain')
        return "This site isn't on the Firebase project's list of authorized domains.";
    if (code === 'auth/operation-not-allowed') return 'That sign-in method is turned off in the Firebase project.';
    if (code === 'auth/network-request-failed') return "Couldn't reach Firebase. Check your connection.";
    return `Sign-in failed (${code || 'unknown error'}).`;
}
