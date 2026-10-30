/**
 * Defines the GridTuning type: the limits for keeping a generated grid.
 */

/**
 * The limits for keeping a generated grid, and the seed that makes the list the same every time.
 */
export type GridTuning = {
    /** The fewest answers a grid may have */
    minAnswers: number;
    /** The most answers a grid may have */
    maxAnswers: number;
    /** The SCOWL size that counts as an everyday word, for finding the hard squares */
    commonSize: number;
    /** A square is hard if this many everyday words or fewer go through it (the rest are rarer words) */
    hardCoverage: number;
    /** The fewest hard squares: the ones the family will need each other for */
    minHard: number;
    /** The most hard squares */
    maxHard: number;
    /** Seeds the random choices */
    seed: string;
};
