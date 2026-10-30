import { EPOCH_DAY } from '../../src/typescript/data/app';
import { addDays, dayIndex, dayKey, daysBetween, isDayKey, weekday } from '../../src/typescript/gamelogic/dates';

/**
 * Tests for day keys and date arithmetic.
 */

describe('dayKey', () => {
    it('gives the calendar date in the timezone asked for', () => {
        const t = new Date('2026-10-24T03:30:00Z');
        expect(dayKey(t, 'UTC')).toBe('2026-10-24');
        expect(dayKey(t, 'America/New_York')).toBe('2026-10-23');
        expect(dayKey(t, 'Asia/Tokyo')).toBe('2026-10-24');
        expect(dayKey(new Date('2026-10-24T23:30:00Z'), 'Pacific/Auckland')).toBe('2026-10-25');
    });

    it('changes day at local midnight across daylight saving changes', () => {
        expect(dayKey(new Date('2026-11-01T03:59:00Z'), 'America/New_York')).toBe('2026-10-31');
        expect(dayKey(new Date('2026-11-01T04:00:00Z'), 'America/New_York')).toBe('2026-11-01');
        expect(dayKey(new Date('2026-11-02T04:59:00Z'), 'America/New_York')).toBe('2026-11-01');
        expect(dayKey(new Date('2026-11-02T05:00:00Z'), 'America/New_York')).toBe('2026-11-02');
    });
});

describe('date arithmetic', () => {
    it('counts days from the epoch', () => {
        expect(dayIndex(EPOCH_DAY)).toBe(0);
        expect(dayIndex(addDays(EPOCH_DAY, 1))).toBe(1);
        expect(dayIndex(addDays(EPOCH_DAY, 365))).toBe(365);
        expect(dayIndex(addDays(EPOCH_DAY, -1))).toBe(-1);
    });

    it('adds days, across months, years and daylight saving changes', () => {
        expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
        expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
        expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
        expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    });

    it('counts the days between two days, and gives the day of the week', () => {
        expect(daysBetween('2026-10-01', '2026-10-24')).toBe(23);
        expect(weekday('2026-10-24')).toBe(6); // Saturday
    });

    it('recognizes day keys', () => {
        expect(isDayKey('2026-10-24')).toBe(true);
        expect(isDayKey('10/24/2026')).toBe(false);
        expect(isDayKey(20261024)).toBe(false);
    });
});
