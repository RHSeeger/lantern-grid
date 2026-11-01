/**
 * Defines the TraceResult type: what happened when a traced path was submitted.
 */

/**
 * What happened when a traced path was submitted: accepted (a List word with its points, perhaps a Spotlight, or a
 * bonus word), or rejected (with why).
 */
export type TraceResult =
    | { ok: true; word: string; onList: boolean; spotlight: boolean; points: number }
    | { ok: false; word: string; error: 'short' | 'unknown' | 'found' };
