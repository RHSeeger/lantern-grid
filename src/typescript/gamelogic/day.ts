import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, SIZE } from '../data/app';
import type { FoundPath } from '../types/FoundPath';
import type { PlayerDay } from '../types/PlayerDay';
import { dayIndex } from './dates';
import { isValidPath, parsePathKey } from './grid';
import { asObject } from './personal';
import { getJSON, setJSON } from './storage';

/**
 * One day's play: which grid it is, loading and saving local play, and reading a player's day from Firebase (where
 * each found word is stored as `found/<path key>: { w, at }`).
 */

/**
 * Parses the puzzle list file.
 *
 * @param text - The file: one grid per line, its SIZE * SIZE letters row by row
 * @returns The grids' letters
 */
export function parsePuzzles(text: string): string[] {
    return text
        .split(/\r?\n/)
        .map((l) => l.trim().toLowerCase())
        .filter((l) => /^[a-z]+$/.test(l) && l.length === SIZE * SIZE);
}

/**
 * Returns the grid for a day: day N after EPOCH_DAY plays line N, starting over when the list runs out.
 *
 * @param key - The day key
 * @param lines - The puzzle list
 * @returns The grid's letters, row by row
 */
export function lettersForDay(key: string, lines: string[]): string[] {
    const n = lines.length;
    return [...lines[((dayIndex(key) % n) + n) % n]];
}

/**
 * Makes a new, empty day.
 *
 * @param key - The day key
 * @returns The day
 */
export function newDay(key: string): PlayerDay {
    return { day: key, found: [], hints: false };
}

/**
 * Reads one found word, skipping anything malformed.
 *
 * @param p - Its path key
 * @param v - The saved value ({ w, at })
 * @returns The found word, or null
 */
function readFound(p: string, v: unknown): FoundPath | null {
    const o = asObject(v);
    const w = typeof o.w === 'string' ? o.w : '';
    const path = parsePathKey(p);
    if (!/^[a-z]+$/.test(w) || w.length < MIN_WORD_LENGTH || w.length > MAX_WORD_LENGTH) return null;
    if (path.length !== w.length || !isValidPath(path)) return null;
    return { w, p, at: typeof o.at === 'number' ? o.at : 0 };
}

/**
 * Reads a player's day from Firebase.
 *
 * @param key - The day key
 * @param raw - The saved value (`{ found: { <path>: { w, at } }, hints }`), or undefined
 * @returns The day
 */
export function parsePlayerDay(key: string, raw: unknown): PlayerDay {
    const o = asObject(raw);
    const found = Object.entries(asObject(o.found))
        .map(([p, v]) => readFound(p, v))
        .filter((f): f is FoundPath => f !== null)
        .sort((a, b) => a.at - b.at);
    return { day: key, found, hints: o.hints === true };
}

/**
 * Loads a day of local play.
 *
 * @param key - The day key
 * @returns The day (a new one if nothing is saved)
 */
export function loadDay(key: string): PlayerDay {
    const saved = getJSON<PlayerDay | null>(`day:${key}`, null);
    if (!saved || saved.day !== key || !Array.isArray(saved.found)) return newDay(key);
    const found = saved.found.map((f) => readFound(f.p, f)).filter((f): f is FoundPath => f !== null);
    return { day: key, found, hints: saved.hints === true };
}

/**
 * Saves a day of local play.
 *
 * @param day - The day
 */
export function saveDay(day: PlayerDay): void {
    setJSON(`day:${day.day}`, day);
}
