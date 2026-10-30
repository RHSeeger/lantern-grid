import { SIZE } from '../data/app';

/**
 * The grid's geometry: which squares touch, and path keys (a path written as one base-36 character per square, which
 * works because a 6 x 6 grid has exactly 36 squares). Squares are numbered row by row from 0.
 */

/** The characters used for squares in a path key */
const KEY_CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';

/**
 * Checks whether two squares touch (side by side, above and below, or corner to corner).
 *
 * @param a - A square
 * @param b - Another square
 * @param size - The grid's width
 * @returns True if they are next to each other (a square doesn't touch itself)
 */
export function touches(a: number, b: number, size = SIZE): boolean {
    if (a === b) return false;
    const dr = Math.abs(Math.floor(a / size) - Math.floor(b / size));
    const dc = Math.abs((a % size) - (b % size));
    return dr <= 1 && dc <= 1;
}

/**
 * Lists the squares touching a square.
 *
 * @param i - The square
 * @param size - The grid's width
 * @returns The squares next to it, in order
 */
export function neighbors(i: number, size = SIZE): number[] {
    const out: number[] = [];
    const r = Math.floor(i / size);
    const c = i % size;
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const rr = r + dr;
            const cc = c + dc;
            if ((dr || dc) && rr >= 0 && rr < size && cc >= 0 && cc < size) out.push(rr * size + cc);
        }
    }
    return out;
}

/**
 * Checks whether a list of squares is a path that can be traced: each square touches the one before, and none is
 * used twice.
 *
 * @param path - The squares, in order
 * @param size - The grid's width
 * @returns True if it can be traced
 */
export function isValidPath(path: number[], size = SIZE): boolean {
    if (!path.every((i) => Number.isInteger(i) && i >= 0 && i < size * size)) return false;
    if (new Set(path).size !== path.length) return false;
    return path.every((sq, k) => k === 0 || touches(path[k - 1], sq, size));
}

/**
 * Writes a path as a key.
 *
 * @param path - The squares, in order
 * @returns The key
 */
export function pathKey(path: number[]): string {
    return path.map((i) => KEY_CHARS[i]).join('');
}

/**
 * Reads a path key.
 *
 * @param key - The key
 * @returns The squares, in order (any character that isn't a square is skipped)
 */
export function parsePathKey(key: string): number[] {
    return [...key].map((ch) => KEY_CHARS.indexOf(ch)).filter((i) => i >= 0);
}

/**
 * Spells a path.
 *
 * @param path - The squares, in order
 * @param letters - The grid's letters
 * @returns The word
 */
export function spell(path: number[], letters: string[]): string {
    return path.map((i) => letters[i]).join('');
}
