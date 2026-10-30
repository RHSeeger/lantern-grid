/**
 * Defines the Rank type: one of the names for how much of the grid is lit.
 */

/**
 * One of the names for how much of the grid is lit.
 */
export type Rank = {
    /** Shown to the player */
    name: string;
    /** The fraction of squares that must be lit (0 to 1) */
    min: number;
};
