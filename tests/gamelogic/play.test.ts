import { pathKey } from '../../src/typescript/gamelogic/grid';
import {
    checkTrace,
    combineFound,
    dimmerLevels,
    hintCounts,
    listPoints,
    litSquares,
    onlyFinderCounts,
    rankIndexFor,
    summarize,
    wordPoints,
} from '../../src/typescript/gamelogic/play';
import { hasPrefix, parseWordlist, pickSpotlights, solveGrid } from '../../src/typescript/gamelogic/solver';
import type { FoundPath } from '../../src/typescript/types/FoundPath';

/**
 * Tests for finding words in a grid, checking traced words, and scoring.
 */

// A grid with "cart" along the top row (squares 0-3), "rate" down from square 2, "carat" (a bonus word) from the c
// through the first r and a, and filler elsewhere
const LETTERS = [...'cartxx', ...'xxaxxx', ...'xxtxxx', ...'xxexxx', ...'xxxxxx', ...'xxxxxx'];
const WORDS = parseWordlist(['carat', 'cart', 'rate', 'art', 'arte', 'tear', 'zzzz'].join('\n'));
const EVERYDAY = new Set(['cart', 'rate', 'tear']);
const PUZZLE = solveGrid(LETTERS, WORDS, EVERYDAY);

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
        expect(PUZZLE.answers).toEqual(['carat', 'cart', 'rate']);
        expect([...(PUZZLE.answerSquares.get('cart') ?? [])].sort((a, b) => a - b)).toEqual([0, 1, 2, 3]);
        // "rate" goes down from the r: squares 2, 8, 14 and 20
        expect(PUZZLE.answerSquares.get('rate')).toEqual(new Set([2, 8, 14, 20]));
        expect(PUZZLE.answerStarts.get('rate')).toEqual(new Set([2]));
    });

    it('puts only the everyday words on the List, and covers the grid with those', () => {
        expect(PUZZLE.list).toEqual(['cart', 'rate']);
        // Square 8 has "rate" through it; "carat" goes there too, but isn't on the List
        expect(PUZZLE.coverage[8]).toBe(1);
        expect(PUZZLE.coverage[2]).toBe(2);
        expect(PUZZLE.coverage[35]).toBe(0);
    });
});

describe('pickSpotlights', () => {
    it('picks up to three of the longest words of 7+ letters, longest first', () => {
        const list = ['cart', 'granted', 'arrange', 'granting', 'wasting', 'wanting'];
        expect(pickSpotlights(list)).toEqual(['granting', 'arrange', 'granted']);
        expect(pickSpotlights(['cart', 'rates'])).toEqual([]);
    });
});

describe('checkTrace', () => {
    it('accepts a new List word, with its points', () => {
        expect(checkTrace([0, 1, 2, 3], PUZZLE, [])).toEqual({
            ok: true,
            word: 'cart',
            onList: true,
            spotlight: false,
            points: 1,
        });
    });

    it('accepts a word that is not on the List as a bonus word, with no points', () => {
        expect(checkTrace([0, 1, 2, 8, 14], PUZZLE, [])).toEqual({
            ok: true,
            word: 'carat',
            onList: false,
            spotlight: false,
            points: 0,
        });
    });

    it('rejects short words, words not in the list, and found words', () => {
        expect(checkTrace([1, 2, 3], PUZZLE, [])).toMatchObject({ ok: false, error: 'short' });
        expect(checkTrace([4, 5, 11, 10], PUZZLE, [])).toMatchObject({ ok: false, error: 'unknown' });
        const have = [found('cart', [0, 1, 2, 3])];
        expect(checkTrace([0, 1, 2, 3], PUZZLE, have)).toMatchObject({ ok: false, error: 'found' });
    });

    // Changed: a found word used to be accepted again if its new path lit more squares. A word now lights every square
    // any of its paths can use, so there is never a reason to trace it again.
    it('rejects a found word even along a different path', () => {
        const have = [found('cart', [0, 1, 2, 8])];
        expect(checkTrace([0, 1, 2, 3], PUZZLE, have)).toMatchObject({ ok: false, error: 'found' });
    });
});

describe('scoring', () => {
    it('scores words by length', () => {
        expect([3, 4, 5, 6, 7, 8, 12].map((n) => wordPoints('a'.repeat(n)))).toEqual([0, 1, 2, 3, 5, 11, 11]);
    });

    it('lights each square a word can go through, including with bonus words', () => {
        const have = [found('cart', [0, 1, 2, 3]), found('rate', [2, 8, 14, 20])];
        expect(litSquares(have, PUZZLE)).toEqual(new Set([0, 1, 2, 3, 8, 14, 20]));
        // "carat" can end on either t (squares 3 and 14), and lights both, whichever way it was traced
        expect(litSquares([found('carat', [0, 1, 2, 8, 14])], PUZZLE)).toEqual(new Set([0, 1, 2, 3, 8, 14]));
    });

    it('ignores words the puzzle does not accept', () => {
        const have = [found('zzzz', [0, 1, 2, 3])];
        expect(litSquares(have, PUZZLE).size).toBe(0);
        expect(summarize(have, PUZZLE)).toEqual({ lit: 0, words: 0, bonus: 0, points: 0, spotlights: 0 });
    });

    it('sets each dimmer from the share of the List words through the square that are found', () => {
        const cart = found('cart', [0, 1, 2, 3]);
        const levels = dimmerLevels([cart], PUZZLE);
        expect(levels[0]).toBe(5); // "cart" is the only List word here
        expect(levels[2]).toBe(3); // one of the two List words here
        expect(levels[20]).toBe(0); // dark
        // A bonus word lights a square, but only just
        expect(dimmerLevels([found('carat', [0, 1, 2, 8, 14])], PUZZLE)[0]).toBe(1);
        expect(dimmerLevels([cart, found('rate', [2, 8, 14, 20])], PUZZLE)[2]).toBe(5);
    });

    it('gives hints: the List words still missing through each square, and starting on it', () => {
        const { through, starts } = hintCounts([found('cart', [0, 1, 2, 3])], PUZZLE);
        expect(through[2]).toBe(1);
        expect(through[0]).toBe(0);
        expect(starts[2]).toBe(1);
        expect(starts[0]).toBe(0);
    });

    it('ranks by the fraction of the List points found', () => {
        expect(rankIndexFor(0, 100)).toBe(0);
        expect(rankIndexFor(1, 100)).toBe(1);
        expect(rankIndexFor(30, 100)).toBe(4);
        expect(rankIndexFor(40, 100)).toBe(5);
        expect(rankIndexFor(99, 100)).toBe(8);
        expect(rankIndexFor(100, 100)).toBe(9);
    });

    it('sums up List words, bonus words, points and lit squares (counting each word once)', () => {
        const have = [
            found('cart', [0, 1, 2, 3]),
            found('cart', [0, 1, 2, 8]),
            found('rate', [2, 8, 14, 20]),
            found('carat', [0, 1, 2, 8, 14]),
        ];
        expect(summarize(have, PUZZLE)).toEqual({ lit: 7, words: 2, bonus: 1, points: 2, spotlights: 0 });
        expect(listPoints(PUZZLE)).toBe(2);
    });

    it('counts the List words that only one player found', () => {
        const a = [found('cart', [0, 1, 2, 3]), found('carat', [0, 1, 2, 8, 14])];
        const b = [found('cart', [0, 1, 2, 3], 2), found('rate', [2, 8, 14, 20])];
        expect(onlyFinderCounts([a, b], PUZZLE)).toEqual([0, 1]);
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
