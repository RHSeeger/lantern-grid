/**
 * Defines the BoardView type: what the board shows.
 */

/**
 * What the board shows: each square's dimmer level, the path being traced, who lit each square (once combined), and
 * the meter readings.
 */
export type BoardView = {
    /** For each square, its dimmer level: 0 is dark, DIMMER_FULL is every List word through it found */
    levels: number[];
    /** The squares being traced, in order */
    path: number[];
    /** For each square, the colors (PlayerColor ids) of everyone who lit it; null when not combined */
    owners: string[][] | null;
    /** For each square with a meter reading, how many List words not yet found go through it (0 shows nothing) */
    through: number[];
    /** For each square with a meter reading, how many List words not yet found start on it (0 shows nothing) */
    starts: number[];
};
