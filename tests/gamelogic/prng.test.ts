import { hashString, mulberry32, seededRandom, shuffleInPlace } from '../../src/typescript/gamelogic/prng';

/**
 * Tests for the seeded random number generator and string hash.
 */

describe('mulberry32', () => {
    it('gives the same numbers for the same seed, all from 0 to 1', () => {
        const xs = Array.from({ length: 5 }, mulberry32(42));
        expect(Array.from({ length: 5 }, mulberry32(42))).toEqual(xs);
        expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
        expect(Array.from({ length: 5 }, mulberry32(43))).not.toEqual(xs);
    });
});

describe('hashString', () => {
    it('is stable, and differs for different text', () => {
        expect(hashString('abc')).toBe(hashString('abc'));
        expect(hashString('abc')).not.toBe(hashString('abd'));
    });
});

describe('shuffleInPlace', () => {
    it('shuffles the same way for the same seed', () => {
        const a = shuffleInPlace([1, 2, 3, 4, 5], seededRandom('x'));
        expect(shuffleInPlace([1, 2, 3, 4, 5], seededRandom('x'))).toEqual(a);
        expect([...a].sort()).toEqual([1, 2, 3, 4, 5]);
    });
});
