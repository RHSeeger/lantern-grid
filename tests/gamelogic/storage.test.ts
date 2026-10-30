import { STORAGE_PREFIX } from '../../src/typescript/data/app';
import { getJSON, remove, setJSON } from '../../src/typescript/gamelogic/storage';

/**
 * Tests for the storage helpers.
 */

beforeEach(() => localStorage.clear());

describe('storage', () => {
    it("saves, reads and removes values under the game's own prefix", () => {
        expect(STORAGE_PREFIX).not.toBe('buzzoff:');
        expect(setJSON('x', { a: 1 })).toBe(true);
        expect(localStorage.getItem(`${STORAGE_PREFIX}x`)).toBe('{"a":1}');
        expect(getJSON('x', null)).toEqual({ a: 1 });
        remove('x');
        expect(getJSON('x', 'fallback')).toBe('fallback');
    });

    it('returns the fallback for data that is not JSON', () => {
        localStorage.setItem(`${STORAGE_PREFIX}x`, '{oops');
        expect(getJSON('x', 7)).toBe(7);
    });

    it('keeps working when storage throws', () => {
        const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('full');
        });
        expect(setJSON('x', 1)).toBe(false);
        spy.mockRestore();
    });
});
