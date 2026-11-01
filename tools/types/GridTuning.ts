/**
 * Defines the GridTuning type: the limits for keeping a generated grid.
 */

/**
 * The limits for keeping a generated grid, and the seed that makes the list the same every time.
 */
export type GridTuning = {
    /** The SCOWL size that counts as an everyday word (the words on a grid's List, the ones that count for rank) */
    everydaySize: number;
    /** The fewest words on a grid's List */
    minList: number;
    /** The most words on a grid's List */
    maxList: number;
    /** The fewest Spotlight words (long List words) a grid may have */
    minSpotlights: number;
    /** A square is hard if this many List words or fewer go through it */
    hardCoverage: number;
    /** The most hard squares a grid may have */
    maxHard: number;
    /** Seeds the random choices */
    seed: string;
};
