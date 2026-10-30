import { MIN_WORD_LENGTH } from '../data/app';
import { RANKS } from '../data/ranks';
import type { FoundPath } from '../types/FoundPath';
import type { Puzzle } from '../types/Puzzle';
import type { TraceResult } from '../types/TraceResult';
import { parsePathKey, spell } from './grid';

/**
 * The rules of play: checking a traced path, scoring words, which squares are lit, ranks, and summing up a player's
 * (or the family's) day.
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
 * Works out which squares are lit: every square some found word went through.
 *
 * @param found - The words found, with their paths
 * @returns The lit squares
 */
export function litSquares(found: FoundPath[]): Set<number> {
    const lit = new Set<number>();
    for (const f of found) for (const sq of parsePathKey(f.p)) lit.add(sq);
    return lit;
}

/**
 * Works out how many found words went through each square (how brightly it glows).
 *
 * @param found - The words found, with their paths
 * @param squares - How many squares the grid has
 * @returns The count for each square
 */
export function glowCounts(found: FoundPath[], squares: number): number[] {
    const counts = new Array<number>(squares).fill(0);
    for (const f of found) for (const sq of new Set(parsePathKey(f.p))) counts[sq]++;
    return counts;
}

/**
 * Checks a traced path: it must spell an answer, and either be a new word or light at least one new square.
 *
 * @param path - The squares traced (already checked to touch, with none used twice)
 * @param puzzle - The puzzle
 * @param found - The words already found (whose squares are already lit)
 * @returns Whether it was accepted, and why or why not
 */
export function checkTrace(path: number[], puzzle: Puzzle, found: FoundPath[]): TraceResult {
    const word = spell(path, puzzle.letters);
    if (word.length < MIN_WORD_LENGTH) return { ok: false, word, error: 'short' };
    if (!puzzle.answerSquares.has(word)) return { ok: false, word, error: 'unknown' };
    const lit = litSquares(found);
    const newlyLit = new Set(path.filter((sq) => !lit.has(sq))).size;
    const newWord = !found.some((f) => f.w === word);
    if (!newWord && newlyLit === 0) return { ok: false, word, error: 'found' };
    return { ok: true, word, newWord, newlyLit, points: newWord ? wordPoints(word) : 0 };
}

/**
 * Returns the rank for a number of lit squares.
 *
 * @param lit - How many squares are lit
 * @param squares - How many squares the grid has
 * @returns The rank's index in RANKS
 */
export function rankIndexFor(lit: number, squares: number): number {
    const frac = squares ? lit / squares : 0;
    let r = 0;
    for (let i = 0; i < RANKS.length; i++) if (frac >= RANKS[i].min) r = i;
    return r;
}

/**
 * Sums up some found words: squares lit, different words, points, and the longest word.
 *
 * @param found - The words found, with their paths (one player's, or everyone's together)
 * @returns The summary
 */
export function summarize(found: FoundPath[]): { lit: number; words: number; points: number; longest: string } {
    const words = [...new Set(found.map((f) => f.w))];
    return {
        lit: litSquares(found).size,
        words: words.length,
        points: words.reduce((sum, w) => sum + wordPoints(w), 0),
        longest: words.reduce((best, w) => (w.length > best.length ? w : best), ''),
    };
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
