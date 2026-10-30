/**
 * A seeded random number generator and string hash, so shuffles can be repeated exactly. Used by the browser (to
 * shuffle the letters) and by the word list build script (to shuffle the puzzle list the same way every time).
 */

/**
 * Hashes a string to a 32-bit number (FNV-1a).
 *
 * @param str - The string to hash
 * @returns The hash, from 0 to 2^32 - 1
 */
export function hashString(str: string): number {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

/**
 * Creates a small, fast, repeatable random number generator (mulberry32).
 *
 * @param seed - The starting value; the same seed always gives the same numbers
 * @returns A function that returns the next number, from 0 (inclusive) to 1 (exclusive)
 */
export function mulberry32(seed: number): () => number {
    let a = seed >>> 0;
    return function next(): number {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Creates a repeatable random number generator from some text.
 *
 * @param seedText - The text to seed it with
 * @returns A function that returns the next number, from 0 (inclusive) to 1 (exclusive)
 */
export function seededRandom(seedText: string): () => number {
    return mulberry32(hashString(String(seedText)));
}

/**
 * Shuffles an array in place (Fisher-Yates).
 *
 * @param arr - The array (changed in place)
 * @param rand - The random number function to use
 * @returns The same array
 */
export function shuffleInPlace<T>(arr: T[], rand: () => number = Math.random): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
