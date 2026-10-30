/**
 * Defines the FoundPath type: a word a player traced, and the squares it went through.
 */

/**
 * A word a player traced, and the squares it went through (which it lights). The same word can be traced more than
 * once, along different squares, to light more of the grid.
 */
export type FoundPath = {
    /** The word */
    w: string;
    /** The squares, in order, as a path key (one base-36 character per square; see pathKey()) */
    p: string;
    /** When it was found (milliseconds since 1970) */
    at: number;
    /** Who found it (family play, once combined); undefined for the player's own */
    by?: string;
};
