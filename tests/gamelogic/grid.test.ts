import { isValidPath, neighbors, parsePathKey, pathKey, spell, touches } from '../../src/typescript/gamelogic/grid';

/**
 * Tests for the grid's geometry and path keys (a 6 x 6 grid; squares numbered row by row).
 */

describe('touches and neighbors', () => {
    it('counts sides and corners, but not the square itself or squares further away', () => {
        expect(touches(0, 1)).toBe(true);
        expect(touches(0, 7)).toBe(true);
        expect(touches(0, 6)).toBe(true);
        expect(touches(0, 0)).toBe(false);
        expect(touches(0, 2)).toBe(false);
        // The end of one row doesn't touch the start of the next
        expect(touches(5, 6)).toBe(false);
    });

    it('lists 3 neighbors in a corner, 5 on an edge, and 8 in the middle', () => {
        expect(neighbors(0)).toEqual([1, 6, 7]);
        expect(neighbors(3)).toHaveLength(5);
        expect(neighbors(14)).toHaveLength(8);
    });
});

describe('isValidPath', () => {
    it('accepts touching squares used once each', () => {
        expect(isValidPath([0, 1, 8, 15])).toBe(true);
    });

    it('rejects jumps, repeats, and squares off the grid', () => {
        expect(isValidPath([0, 2])).toBe(false);
        expect(isValidPath([0, 1, 0])).toBe(false);
        expect(isValidPath([35, 36])).toBe(false);
        expect(isValidPath([5, 6])).toBe(false);
    });
});

describe('path keys', () => {
    it('round-trip, one character per square', () => {
        const path = [0, 9, 10, 35];
        expect(pathKey(path)).toBe('09az');
        expect(parsePathKey('09az')).toEqual(path);
    });

    it('spell the letters along a path', () => {
        expect(spell([2, 0, 1], ['a', 'b', 'c'])).toBe('cab');
    });
});
