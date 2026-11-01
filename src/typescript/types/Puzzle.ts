/**
 * Defines the Puzzle type: one day's grid and its answers.
 */

/**
 * One day's grid and its answers. Rebuilt from the puzzle list and word lists each time; never saved.
 */
export type Puzzle = {
    /** The letters, row by row (SIZE * SIZE of them) */
    letters: string[];
    /** Every word that can be traced in the grid (the ones that are accepted), sorted */
    answers: string[];
    /** The List: the answers that are everyday words, the ones that count for rank, sorted */
    list: string[];
    /** The Spotlights: the List's longest words, longest first */
    spotlights: string[];
    /** For each square, how many List words can go through it */
    coverage: number[];
    /** For each answer, the squares any of its paths can go through */
    answerSquares: Map<string, Set<number>>;
    /** For each answer, the squares any of its paths can start on */
    answerStarts: Map<string, Set<number>>;
};
