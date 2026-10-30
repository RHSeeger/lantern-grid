import { pathKey } from '../../src/typescript/gamelogic/grid';
import {
    checkTrace,
    combineFound,
    glowCounts,
    litSquares,
    rankIndexFor,
    summarize,
    wordPoints,
} from '../../src/typescript/gamelogic/play';
import { hasPrefix, parseWordlist, solveGrid } from '../../src/typescript/gamelogic/solver';
import type { FoundPath } from '../../src/typescript/types/FoundPath';

/**
 * Tests for finding words in a grid, checking traced words, and scoring.
 */

// A grid with "cart" along the top row (squares 0-3), "rate" down from square 2, and filler elsewhere
const LETTERS = [...'cartxx', ...'xxaxxx', ...'xxtxxx', ...'xxexxx', ...'xxxxxx', ...'xxxxxx'];
const WORDS = parseWordlist(['cart', 'rate', 'art', 'arte', 'tear', 'zzzz'].join('\n'));
const PUZZLE = solveGrid(LETTERS, WORDS);

/**
 * Makes a found word.
 *
 * @param w - The word
 * @param path - Its squares
 * @param at - When it was found
 * @returns The found word
 */
function found(w: string, path: number[], at = 1): FoundPath {
    return { w, p: pathKey(path), at };
}

describe('the word list', () => {
    it('knows which letters start a word', () => {
        expect(hasPrefix(WORDS, 'ca')).toBe(true);
        expect(hasPrefix(WORDS, 'cart')).toBe(true);
        expect(hasPrefix(WORDS, 'cx')).toBe(false);
        expect(hasPrefix(WORDS, 'zzzzz')).toBe(false);
    });
});

describe('solveGrid', () => {
    it('finds every word of 4+ letters that can be traced, and which squares each can use', () => {
        expect(PUZZLE.answers).toEqual(['cart', 'rate']);
        expect([...(PUZZLE.answerSquares.get('cart') ?? [])].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
        // "rate" goes down from the r: squares 2, 8, 14 and 20
        expect(PUZZLE.answerSquares.get('rate')).toEqual(new Set([2, 8, 14, 20]));
        expect(PUZZLE.coverage[2]).toBe(2);
        expect(PUZZLE.coverage[35]).toBe(0);
    });
});

describe('checkTrace', () => {
    it('accepts a new word, with its points and the squares it lights', () => {
        expect(checkTrace([0, 1, 2, 3], PUZZLE, [])).toEqual({
            ok: true,
            word: 'cart',
            newWord: true,
            newlyLit: 4,
            points: 1,
        });
    });

    it('rejects short words, words not in the list, and found words that light nothing new', () => {
        expect(checkTrace([1, 2, 3], PUZZLE, [])).toMatchObject({ ok: false, error: 'short' });
        expect(checkTrace([4, 5, 11, 10], PUZZLE, [])).toMatchObject({ ok: false, error: 'unknown' });
        const have = [found('cart', [0, 1, 2, 3])];
        expect(checkTrace([0, 1, 2, 3], PUZZLE, have)).toMatchObject({ ok: false, error: 'found' });
    });

    it('accepts a found word again along squares that light something new, without more points', () => {
        // Pretend "cart" was found along a different path that missed square 3
        const have = [found('cart', [0, 1, 2, 8])];
        expect(checkTrace([0, 1, 2, 3], PUZZLE, have)).toEqual({
            ok: true,
            word: 'cart',
            newWord: false,
            newlyLit: 1,
            points: 0,
        });
    });
});

describe('scoring', () => {
    it('scores words by length', () => {
        expect([3, 4, 5, 6, 7, 8, 12].map((n) => wordPoints('a'.repeat(n)))).toEqual([0, 1, 2, 3, 5, 11, 11]);
    });

    it('lights each square a word goes through, and counts how many words light it', () => {
        const have = [found('cart', [0, 1, 2, 3]), found('rate', [2, 8, 14, 20])];
        expect(litSquares(have)).toEqual(new Set([0, 1, 2, 3, 8, 14, 20]));
        expect(glowCounts(have, 36)[2]).toBe(2);
        expect(glowCounts(have, 36)[0]).toBe(1);
    });

    it('ranks by the fraction of squares lit', () => {
        expect(rankIndexFor(0, 36)).toBe(0);
        expect(rankIndexFor(1, 36)).toBe(1);
        expect(rankIndexFor(18, 36)).toBe(3);
        expect(rankIndexFor(35, 36)).toBe(5);
        expect(rankIndexFor(36, 36)).toBe(6);
    });

    it('sums up words, points, lit squares and the longest word (counting each word once)', () => {
        const have = [found('cart', [0, 1, 2, 3]), found('cart', [0, 1, 2, 8]), found('rate', [2, 8, 14, 20])];
        expect(summarize(have)).toEqual({ lit: 7, words: 2, points: 2, longest: 'cart' });
    });
});

describe('combineFound', () => {
    it("puts players' words together, keeping the earliest of each path", () => {
        const mom = [{ ...found('cart', [0, 1, 2, 3], 5), by: 'mom' }];
        const dad = [
            { ...found('cart', [0, 1, 2, 3], 3), by: 'dad' },
            { ...found('rate', [2, 8, 14, 20], 9), by: 'dad' },
        ];
        const all = combineFound([mom, dad]);
        expect(all.map((f) => [f.w, f.by])).toEqual([
            ['cart', 'dad'],
            ['rate', 'dad'],
        ]);
    });
});
