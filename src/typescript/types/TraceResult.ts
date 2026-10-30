/**
 * Defines the TraceResult type: what happened when a traced path was submitted.
 */

/**
 * What happened when a traced path was submitted: accepted (with how many new squares it lit, and whether the word
 * was new), or rejected (with why).
 */
export type TraceResult =
    | { ok: true; word: string; newWord: boolean; newlyLit: number; points: number }
    | { ok: false; word: string; error: 'short' | 'unknown' | 'found' };
