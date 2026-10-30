/**
 * Defines the Puzzle type: one day's grid and its answers.
 */

/**
 * One day's grid and its answers. Rebuilt from the puzzle list and word list each time; never saved.
 */
export type Puzzle = {
    /** The letters, row by row (SIZE * SIZE of them) */
    letters: string[];
    /** Every word that can be traced in the grid, sorted */
    answers: string[];
    /** For each square, how many answers can go through it */
    coverage: number[];
    /** For each answer, the squares any of its paths can go through */
    answerSquares: Map<string, Set<number>>;
};
