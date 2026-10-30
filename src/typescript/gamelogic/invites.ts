import { INVITE_CODE_LENGTH } from '../data/family';
import type { InviteLink } from '../types/InviteLink';

/**
 * Invite links: making invite codes, and writing and reading `#join=<fid>:<code>` links.
 */

/** The characters an invite code is made of */
const CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Makes an invite code from random bytes. Bytes of 248 or more are skipped (248 is the largest multiple of 62 that
 * fits in a byte), so every character is equally likely.
 *
 * @param bytes - Random bytes; more than INVITE_CODE_LENGTH, to allow for skipped ones
 * @returns The code (shorter than INVITE_CODE_LENGTH only if there weren't enough usable bytes)
 */
export function inviteCodeFromBytes(bytes: Uint8Array): string {
    let code = '';
    for (const b of bytes) {
        if (code.length === INVITE_CODE_LENGTH) break;
        if (b < 248) code += CODE_CHARS[b % CODE_CHARS.length];
    }
    return code;
}

/**
 * Makes a new random invite code (with the browser's or Node's secure random numbers).
 *
 * @returns The code
 */
export function newInviteCode(): string {
    let code = '';
    while (code.length < INVITE_CODE_LENGTH) {
        code = inviteCodeFromBytes(globalThis.crypto.getRandomValues(new Uint8Array(INVITE_CODE_LENGTH * 2)));
    }
    return code;
}

/**
 * Writes an invite link.
 *
 * @param gameUrl - The game's address (without a hash)
 * @param link - The family and code
 * @returns The link
 */
export function formatInviteLink(gameUrl: string, link: InviteLink): string {
    return `${gameUrl}#join=${link.fid}:${link.code}`;
}

/**
 * Reads an invite link (or just the part after `#`).
 *
 * @param text - The link, or its hash
 * @returns The family and code, or null if it isn't an invite link
 */
export function parseInviteLink(text: string): InviteLink | null {
    const m = /(?:^|[#&])join=([A-Za-z0-9_-]+):([A-Za-z0-9]+)/.exec(String(text).trim());
    return m ? { fid: m[1], code: m[2] } : null;
}
