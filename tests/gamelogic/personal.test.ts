import { asObject, parsePersonalData } from '../../src/typescript/gamelogic/personal';

/**
 * Tests for reading the player's own data from Firebase.
 */

describe('parsePersonalData', () => {
    it('reads the families, oldest first, and ignores what Buzz Off keeps there', () => {
        const data = parsePersonalData({
            families: { b: { name: 'Second', joinedAt: 20 }, a: { name: 'First', joinedAt: 10 } },
            history: { a: { '2026-10-01': { words: 3, score: 9 } } },
            achievements: { all: {} },
        });
        expect(data).toEqual({
            families: [
                { fid: 'a', name: 'First', joinedAt: 10 },
                { fid: 'b', name: 'Second', joinedAt: 20 },
            ],
        });
    });

    it('copes with nothing saved, and with malformed entries', () => {
        expect(parsePersonalData(null)).toEqual({ families: [] });
        expect(parsePersonalData({ families: { x: 5 } })).toEqual({
            families: [{ fid: 'x', name: 'Family', joinedAt: 0 }],
        });
    });
});

describe('asObject', () => {
    it('returns plain objects, and an empty one for anything else', () => {
        expect(asObject({ a: 1 })).toEqual({ a: 1 });
        expect(asObject([1])).toEqual({});
        expect(asObject('x')).toEqual({});
        expect(asObject(null)).toEqual({});
    });
});
