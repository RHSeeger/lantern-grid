import { get, onValue, push, ref, serverTimestamp, set, update } from 'firebase/database';
import { ALL_GAME_KEYS } from '../data/family';
import { newInviteCode } from '../gamelogic/invites';
import type { FamilyMember } from '../types/FamilyMember';
import type { FamilyMeta } from '../types/FamilyMeta';
import type { InviteLink } from '../types/InviteLink';
import { database } from './firebase';

/**
 * Families in Firebase: creating, joining, leaving and deleting them, members, and invite codes. These are the same
 * families Buzz Off uses (`families/<fid>`, `invites/<fid>`, `users/<uid>/families`), stored the same way, so a family
 * made in any of the games works in all of them. Writes that must happen together are one multi-path update, so the
 * security rules see them as one change.
 */

/**
 * Creates a family, with the creator as its owner and first member, and a new invite code.
 *
 * @param uid - The creator
 * @param familyName - The family's name
 * @param me - The creator's name and color
 * @param timezone - The family's timezone (the creator's)
 * @returns The new family's id and invite code
 */
export async function createFamily(
    uid: string,
    familyName: string,
    me: { name: string; color: string },
    timezone: string,
): Promise<InviteLink> {
    const db = database();
    const fid = push(ref(db, 'families')).key as string;
    const code = newInviteCode();
    await update(ref(db), {
        [`families/${fid}/meta`]: { name: familyName, ownerUid: uid, timezone, createdAt: serverTimestamp() },
        [`families/${fid}/members/${uid}`]: { name: me.name, color: me.color, joinedAt: serverTimestamp() },
        [`invites/${fid}`]: code,
        [`users/${uid}/families/${fid}`]: { name: familyName, joinedAt: serverTimestamp() },
    });
    return { fid, code };
}

/**
 * Reads a family's name and settings. Only members can.
 *
 * @param fid - The family
 * @returns The family's meta
 * @throws If the player isn't a member (or the family doesn't exist)
 */
export async function readFamilyMeta(fid: string): Promise<FamilyMeta> {
    const snap = await get(ref(database(), `families/${fid}/meta`));
    if (!snap.exists()) throw new Error('missing family');
    return snap.val() as FamilyMeta;
}

/**
 * Joins a family with an invite link. If the player is already a member, nothing changes.
 *
 * @param uid - The player
 * @param link - The family and invite code
 * @param me - The player's name and color
 * @returns The family's meta
 * @throws If the code is wrong (the link is old, or was mistyped)
 */
export async function joinFamily(
    uid: string,
    link: InviteLink,
    me: { name: string; color: string },
): Promise<FamilyMeta> {
    const db = database();
    let meta: FamilyMeta | null = null;
    try {
        meta = await readFamilyMeta(link.fid);
    } catch {
        // Not a member yet
    }
    if (!meta) {
        await set(ref(db, `families/${link.fid}/members/${uid}`), {
            name: me.name,
            color: me.color,
            joinedAt: serverTimestamp(),
            inviteCode: link.code,
        });
        meta = await readFamilyMeta(link.fid);
    }
    await set(ref(db, `users/${uid}/families/${link.fid}`), { name: meta.name, joinedAt: serverTimestamp() });
    return meta;
}

/**
 * Leaves a family: removes the player from its members and from their list of families (in every game).
 *
 * @param uid - The player
 * @param fid - The family
 */
export async function leaveFamily(uid: string, fid: string): Promise<void> {
    await update(ref(database()), {
        [`families/${fid}/members/${uid}`]: null,
        [`users/${uid}/families/${fid}`]: null,
    });
}

/**
 * Removes a family from the player's list only (for a family that no longer exists, or that they were removed from).
 *
 * @param uid - The player
 * @param fid - The family
 */
export async function forgetFamily(uid: string, fid: string): Promise<void> {
    await set(ref(database(), `users/${uid}/families/${fid}`), null);
}

/**
 * Deletes a family and all its play, in every game (Buzz Off's days, and each game's `games/<game>/<fid>`). Only its
 * owner can. Other members find it gone the next time they open it.
 *
 * @param uid - The owner
 * @param fid - The family
 */
export async function deleteFamily(uid: string, fid: string): Promise<void> {
    const games = Object.fromEntries(ALL_GAME_KEYS.map((g) => [`games/${g}/${fid}`, null]));
    await update(ref(database()), {
        ...games,
        [`families/${fid}/days`]: null,
        [`families/${fid}/members`]: null,
        [`families/${fid}/meta`]: null,
        [`invites/${fid}`]: null,
        [`users/${uid}/families/${fid}`]: null,
    });
}

/**
 * Removes another member from a family. Only its owner can.
 *
 * @param fid - The family
 * @param memberUid - The member to remove
 */
export async function removeMember(fid: string, memberUid: string): Promise<void> {
    await set(ref(database(), `families/${fid}/members/${memberUid}`), null);
}

/**
 * Changes the player's name and color in a family.
 *
 * @param fid - The family
 * @param uid - The player
 * @param me - The new name and color
 */
export async function updateMyProfile(fid: string, uid: string, me: { name: string; color: string }): Promise<void> {
    await update(ref(database(), `families/${fid}/members/${uid}`), { name: me.name, color: me.color });
}

/**
 * Reads a family's invite code (any member can, so anyone can invite).
 *
 * @param fid - The family
 * @returns The code
 */
export async function readInviteCode(fid: string): Promise<string> {
    const snap = await get(ref(database(), `invites/${fid}`));
    return String(snap.val() ?? '');
}

/**
 * Makes a new invite code, so old links stop working. Only the owner can.
 *
 * @param fid - The family
 * @returns The new code
 */
export async function regenerateInviteCode(fid: string): Promise<string> {
    const code = newInviteCode();
    await set(ref(database(), `invites/${fid}`), code);
    return code;
}

/**
 * Watches a family's name, settings and members.
 *
 * @param fid - The family
 * @param onChange - Called with the meta and members whenever either changes (after both have arrived)
 * @param onError - Called if they can't be read (the player was removed, or the family was deleted)
 * @returns A function that stops watching
 */
export function watchFamily(
    fid: string,
    onChange: (meta: FamilyMeta, members: Record<string, FamilyMember>) => void,
    onError: (e: Error) => void,
): () => void {
    const db = database();
    let meta: FamilyMeta | null = null;
    let members: Record<string, FamilyMember> | null = null;
    const emit = (): void => {
        if (meta && members) onChange(meta, members);
    };
    const stopMeta = onValue(
        ref(db, `families/${fid}/meta`),
        (snap) => {
            if (!snap.exists()) return onError(new Error('missing family'));
            meta = snap.val() as FamilyMeta;
            emit();
        },
        onError,
    );
    const stopMembers = onValue(
        ref(db, `families/${fid}/members`),
        (snap) => {
            members = (snap.val() ?? {}) as Record<string, FamilyMember>;
            emit();
        },
        onError,
    );
    return () => {
        stopMeta();
        stopMembers();
    };
}
