import { EPOCH_DAY } from '../data/app';

/**
 * Day keys (YYYY-MM-DD) and date arithmetic. A day key is a calendar date in some timezone; arithmetic on keys is done
 * in UTC so daylight saving changes never matter.
 */

/** Milliseconds in a day */
const DAY_MS = 86400000;

/**
 * Returns the device's timezone.
 *
 * @returns The IANA timezone name (e.g. "America/New_York"), or undefined if it can't be found
 */
export function localTimeZone(): string | undefined {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
    } catch {
        return undefined;
    }
}

/**
 * Returns the calendar date of a moment in a timezone.
 *
 * @param date - The moment (defaults to now)
 * @param timeZone - The IANA timezone (defaults to the device's)
 * @returns The day key (YYYY-MM-DD)
 */
export function dayKey(date: Date = new Date(), timeZone?: string): string {
    const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (timeZone) opts.timeZone = timeZone;
    const parts = new Intl.DateTimeFormat('en-CA', opts).formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes): string => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('year')}-${get('month')}-${get('day')}`;
}

/**
 * Converts a day key to midnight UTC on that date.
 *
 * @param key - The day key (YYYY-MM-DD)
 * @returns Milliseconds since 1970
 */
function keyToUtc(key: string): number {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
}

/**
 * Checks whether a value looks like a day key.
 *
 * @param key - The value to check
 * @returns True if it is a YYYY-MM-DD string
 */
export function isDayKey(key: unknown): key is string {
    return typeof key === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(key);
}

/**
 * Returns how many days a day is after EPOCH_DAY (the first day of the puzzle list).
 *
 * @param key - The day key
 * @returns The number of days (negative before EPOCH_DAY)
 */
export function dayIndex(key: string): number {
    return Math.round((keyToUtc(key) - keyToUtc(EPOCH_DAY)) / DAY_MS);
}

/**
 * Adds days to a day key.
 *
 * @param key - The day key
 * @param n - How many days to add (negative to go back)
 * @returns The new day key
 */
export function addDays(key: string, n: number): string {
    return new Date(keyToUtc(key) + n * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Returns how many days there are from one day to another.
 *
 * @param a - The first day key
 * @param b - The second day key
 * @returns b - a, in days
 */
export function daysBetween(a: string, b: string): number {
    return Math.round((keyToUtc(b) - keyToUtc(a)) / DAY_MS);
}

/**
 * Returns the day of the week of a day key.
 *
 * @param key - The day key
 * @returns 0 for Sunday through 6 for Saturday
 */
export function weekday(key: string): number {
    return new Date(keyToUtc(key)).getUTCDay();
}

/**
 * Formats a day key for display, e.g. "Saturday, October 24, 2026".
 *
 * @param key - The day key
 * @returns The date, in the device's language
 */
export function formatLongDate(key: string): string {
    return new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(keyToUtc(key)));
}
