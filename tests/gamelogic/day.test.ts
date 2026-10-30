import { EPOCH_DAY } from '../../src/typescript/data/app';
import { addDays } from '../../src/typescript/gamelogic/dates';
import { lettersForDay, loadDay, parsePlayerDay, parsePuzzles, saveDay } from '../../src/typescript/gamelogic/day';

/**
 * Tests for a day's grid, and loading and reading a player's day.
 */

const LINE_A = 'a'.repeat(36);
const LINE_B = 'b'.repeat(36);

beforeEach(() => localStorage.clear());

describe('the puzzle list', () => {
    it('keeps only full grids of letters', () => {
        expect(parsePuzzles(`${LINE_A}\nshort\n${LINE_B.toUpperCase()}\n\n`)).toEqual([LINE_A, LINE_B]);
    });

    it('plays line N on day N after the epoch, starting over when the list runs out', () => {
        const lines = [LINE_A, LINE_B];
        expect(lettersForDay(EPOCH_DAY, lines).join('')).toBe(LINE_A);
        expect(lettersForDay(addDays(EPOCH_DAY, 1), lines).join('')).toBe(LINE_B);
        expect(lettersForDay(addDays(EPOCH_DAY, 2), lines).join('')).toBe(LINE_A);
        expect(lettersForDay(addDays(EPOCH_DAY, -1), lines).join('')).toBe(LINE_B);
    });
});

describe("a player's day", () => {
    it('is read from Firebase, skipping malformed words and paths', () => {
        const day = parsePlayerDay('2026-10-29', {
            found: {
                '0127': { w: 'cart', at: 5 },
                '0189': { w: 'tear', at: 2 },
                '05': { w: 'ab', at: 1 }, // too short
                '0abc': { w: 'cart', at: 1 }, // squares that don't touch
                '0123': { w: 'longer', at: 1 }, // the word doesn't fit the path
            },
            hints: true,
        });
        expect(day.found.map((f) => f.w)).toEqual(['tear', 'cart']);
        expect(day.hints).toBe(true);
        expect(parsePlayerDay('2026-10-29', undefined)).toEqual({ day: '2026-10-29', found: [], hints: false });
    });

    it('is saved and loaded locally', () => {
        saveDay({ day: '2026-10-29', found: [{ w: 'cart', p: '0127', at: 5 }], hints: false });
        expect(loadDay('2026-10-29').found).toEqual([{ w: 'cart', p: '0127', at: 5 }]);
        expect(loadDay('2026-10-30').found).toEqual([]);
    });
});
