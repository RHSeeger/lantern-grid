import { BONUS_PER_CLUE, DIMMER_FULL, MIN_WORD_LENGTH, SCHEDULE_LENGTHS } from '../data/app';
import { RANKS } from '../data/ranks';
import type { FoundPath } from '../types/FoundPath';
import type { Puzzle } from '../types/Puzzle';
import type { TraceResult } from '../types/TraceResult';
import { spell } from './grid';

/**
 * The rules of play: checking a traced path, scoring words, which squares are lit and how brightly, meter readings,
 * clues, ranks, and summing up a player's (or the family's) day.
 */

/**
 * Returns a word's points: 1 for 4 letters, 2 for 5, 3 for 6, 5 for 7, and 11 for 8 or more.
 *
 * @param word - The word
 * @returns The points
 */
export function wordPoints(word: string): number {
    const n = word.length;
    if (n < MIN_WORD_LENGTH) return 0;
    if (n === 4) return 1;
    if (n === 5) return 2;
    if (n === 6) return 3;
    if (n === 7) return 5;
    return 11;
}

/**
 * Returns the different words found that the puzzle accepts (anything else, such as a word saved for an older version
 * of the grid, is ignored).
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns The different words
 */
function acceptedWords(found: FoundPath[], puzzle: Puzzle): string[] {
    return [...new Set(found.map((f) => f.w))].filter((w) => puzzle.answerSquares.has(w));
}

/**
 * Returns all the points a puzzle's List is worth.
 *
 * @param puzzle - The puzzle
 * @returns The points
 */
export function listPoints(puzzle: Puzzle): number {
    return puzzle.list.reduce((sum, w) => sum + wordPoints(w), 0);
}

/**
 * Works out which squares are lit: every square a found word can go through, along any of its paths.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns The lit squares
 */
export function litSquares(found: FoundPath[], puzzle: Puzzle): Set<number> {
    const lit = new Set<number>();
    for (const w of acceptedWords(found, puzzle)) for (const sq of puzzle.answerSquares.get(w) ?? []) lit.add(sq);
    return lit;
}

/**
 * Works out each square's dimmer level, from the share of the List words through it that are found. A dark square is
 * 0, a lit one 1 or more (a bonus word alone gives 1), and DIMMER_FULL only when every List word through it is found.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns The level for each square
 */
export function dimmerLevels(found: FoundPath[], puzzle: Puzzle): number[] {
    const lit = litSquares(found, puzzle);
    const have = new Set(found.map((f) => f.w));
    const counts = new Array<number>(puzzle.letters.length).fill(0);
    for (const w of puzzle.list) {
        if (have.has(w)) for (const sq of puzzle.answerSquares.get(w) ?? []) counts[sq]++;
    }
    return counts.map((n, sq) => {
        if (!lit.has(sq)) return 0;
        const total = puzzle.coverage[sq];
        if (total && n === total) return DIMMER_FULL;
        return total ? 1 + Math.floor((n / total) * (DIMMER_FULL - 1)) : 1;
    });
}

/**
 * Works out which squares have a meter reading: every square a found bonus word can go through.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns The squares with a reading
 */
export function readSquares(found: FoundPath[], puzzle: Puzzle): Set<number> {
    const bonus = acceptedWords(found, puzzle).filter((w) => !puzzle.list.includes(w));
    return new Set(bonus.flatMap((w) => [...(puzzle.answerSquares.get(w) ?? [])]));
}

/**
 * Works out the meter readings: for each square with a reading, how many List words not yet found go through it, and
 * start on it. Squares without a reading show 0, as do squares with none left.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns The numbers for each square
 */
export function meterReadings(found: FoundPath[], puzzle: Puzzle): { through: number[]; starts: number[] } {
    const have = new Set(found.map((f) => f.w));
    const read = readSquares(found, puzzle);
    const through = new Array<number>(puzzle.letters.length).fill(0);
    const starts = new Array<number>(puzzle.letters.length).fill(0);
    for (const w of puzzle.list) {
        if (have.has(w)) continue;
        for (const sq of puzzle.answerSquares.get(w) ?? []) if (read.has(sq)) through[sq]++;
        for (const sq of puzzle.answerStarts.get(w) ?? []) if (read.has(sq)) starts[sq]++;
    }
    return { through, starts };
}

/**
 * Works out how many squares are cleared: squares with List words through them, all of which are found.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns How many are cleared
 */
export function clearedCount(found: FoundPath[], puzzle: Puzzle): number {
    return dimmerLevels(found, puzzle).filter((level) => level === DIMMER_FULL).length;
}

/**
 * Finds the word a square's clue is about: the shortest List word not yet found through it (the first alphabetically
 * among equals).
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @param square - The square
 * @returns The word, or null if the square has no words left
 */
export function squareClue(found: FoundPath[], puzzle: Puzzle, square: number): string | null {
    const have = new Set(found.map((f) => f.w));
    const [word] = puzzle.list
        .filter((w) => !have.has(w) && puzzle.answerSquares.get(w)?.has(square))
        .sort((a, b) => a.length - b.length || (a < b ? -1 : 1));
    return word ?? null;
}

/**
 * Describes a clue: the word's length and first two letters.
 *
 * @param word - The word
 * @returns The description
 */
export function clueText(word: string): string {
    return `${word.length} letters, starts ${word.slice(0, 2).toUpperCase()}`;
}

/**
 * Works out a player's clue charge: one clue is earned for every BONUS_PER_CLUE of their bonus words.
 *
 * @param found - The player's own words found
 * @param puzzle - The puzzle
 * @param spent - How many clues they have paid for
 * @returns How many clues are ready, and how many bonus words count towards the next
 */
export function clueCharge(found: FoundPath[], puzzle: Puzzle, spent: number): { ready: number; progress: number } {
    const { bonus } = summarize(found, puzzle);
    return {
        ready: Math.max(0, Math.floor(bonus / BONUS_PER_CLUE) - spent),
        progress: bonus % BONUS_PER_CLUE,
    };
}

/**
 * Works out the fixture schedule: the List words not yet found, counted by first letter and length.
 *
 * @param found - The words found
 * @param puzzle - The puzzle
 * @returns A row for each first letter with words left, in order; each row's counts line up with SCHEDULE_LENGTHS
 */
export function fixtureSchedule(found: FoundPath[], puzzle: Puzzle): { letter: string; counts: number[] }[] {
    const have = new Set(found.map((f) => f.w));
    const rows = new Map<string, number[]>();
    for (const w of puzzle.list) {
        if (have.has(w)) continue;
        const counts = rows.get(w[0]) ?? SCHEDULE_LENGTHS.map(() => 0);
        const longest = SCHEDULE_LENGTHS.length - 1;
        const column = SCHEDULE_LENGTHS.findIndex((n) => n === w.length);
        counts[column < 0 ? longest : column]++;
        rows.set(w[0], counts);
    }
    return [...rows.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([letter, counts]) => ({ letter, counts }));
}

/**
 * Checks a traced path: it must spell an answer that hasn't been found yet.
 *
 * @param path - The squares traced (already checked to touch, with none used twice)
 * @param puzzle - The puzzle
 * @param found - The words already found
 * @returns Whether it was accepted, and why or why not
 */
export function checkTrace(path: number[], puzzle: Puzzle, found: FoundPath[]): TraceResult {
    const word = spell(path, puzzle.letters);
    if (word.length < MIN_WORD_LENGTH) return { ok: false, word, error: 'short' };
    if (!puzzle.answerSquares.has(word)) return { ok: false, word, error: 'unknown' };
    if (found.some((f) => f.w === word)) return { ok: false, word, error: 'found' };
    const onList = puzzle.list.includes(word);
    return {
        ok: true,
        word,
        onList,
        spotlight: puzzle.spotlights.includes(word),
        points: onList ? wordPoints(word) : 0,
    };
}

/**
 * Returns the rank for some points.
 *
 * @param points - The List's points found
 * @param total - All the List's points
 * @returns The rank's index in RANKS
 */
export function rankIndexFor(points: number, total: number): number {
    const frac = total ? points / total : 0;
    let r = 0;
    for (let i = 0; i < RANKS.length; i++) if (frac >= RANKS[i].min) r = i;
    return r;
}

/**
 * Sums up some found words: squares lit and cleared, List words, bonus words, points, and Spotlights.
 *
 * @param found - The words found (one player's, or everyone's together)
 * @param puzzle - The puzzle
 * @returns The summary
 */
export function summarize(
    found: FoundPath[],
    puzzle: Puzzle,
): { lit: number; cleared: number; words: number; bonus: number; points: number; spotlights: number } {
    const words = acceptedWords(found, puzzle);
    const listed = words.filter((w) => puzzle.list.includes(w));
    return {
        lit: litSquares(found, puzzle).size,
        cleared: clearedCount(found, puzzle),
        words: listed.length,
        bonus: words.length - listed.length,
        points: listed.reduce((sum, w) => sum + wordPoints(w), 0),
        spotlights: listed.filter((w) => puzzle.spotlights.includes(w)).length,
    };
}

/**
 * Counts, for each player, the List words that nobody else found.
 *
 * @param lists - Each player's found words
 * @param puzzle - The puzzle
 * @returns The count for each player, in the same order
 */
export function onlyFinderCounts(lists: FoundPath[][], puzzle: Puzzle): number[] {
    const finders = new Map<string, number>();
    const sets = lists.map((found) => new Set(found.map((f) => f.w)));
    for (const set of sets) for (const w of set) finders.set(w, (finders.get(w) ?? 0) + 1);
    return sets.map((set) => puzzle.list.filter((w) => set.has(w) && finders.get(w) === 1).length);
}

/**
 * Puts several players' found words together, keeping one of each path (the earliest).
 *
 * @param lists - Each player's found words, with who found them
 * @returns Everyone's found words, in the order found
 */
export function combineFound(lists: FoundPath[][]): FoundPath[] {
    const byPath = new Map<string, FoundPath>();
    for (const f of lists.flat()) {
        const prev = byPath.get(f.p);
        if (!prev || f.at < prev.at) byPath.set(f.p, f);
    }
    return [...byPath.values()].sort((a, b) => a.at - b.at);
}
