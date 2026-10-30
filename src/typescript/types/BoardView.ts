/**
 * Defines the BoardView type: what the board shows.
 */

/**
 * What the board shows: the squares lit (and how brightly), the path being traced, who lit each square (once
 * combined), and the hint numbers.
 */
export type BoardView = {
    /** For each square, how many found words go through it (0 = dark) */
    glow: number[];
    /** The squares being traced, in order */
    path: number[];
    /** For each square, the colors (PlayerColor ids) of everyone who lit it; null when not combined */
    owners: string[][] | null;
    /** For each square, the number to show as a hint; null when the hints are off */
    hints: number[] | null;
};
