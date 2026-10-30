import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, SIZE } from '../data/app';
import type { Puzzle } from '../types/Puzzle';
import type { Wordlist } from '../types/Wordlist';
import { neighbors } from './grid';

/**
 * Finding every word in a grid: loading the word list, and searching every path through the grid (stopping at dead
 * ends, where no word starts with the letters so far). Used by the game (for the answers, the hints and checking
 * words) and by the puzzle build tool (for choosing good grids).
 */

/**
 * Parses the word list file.
 *
 * @param text - The file's contents: one lowercase word per line
 * @returns The word list
 */
export function parseWordlist(text: string): Wordlist {
    const sorted = [
        ...new Set(
            text
                .split(/\r?\n/)
                .map((w) => w.trim())
                .filter(Boolean),
        ),
    ].sort();
    return { set: new Set(sorted), sorted };
}

/**
 * Checks whether any word starts with some letters (a binary search of the sorted words).
 *
 * @param wordlist - The word list
 * @param prefix - The letters
 * @returns True if some word starts with them
 */
export function hasPrefix(wordlist: Wordlist, prefix: string): boolean {
    const words = wordlist.sorted;
    let lo = 0;
    let hi = words.length;
    while (lo < hi) {
        const mid = (lo + hi) >>> 1;
        if (words[mid] < prefix) lo = mid + 1;
        else hi = mid;
    }
    return lo < words.length && words[lo].startsWith(prefix);
}

/**
 * Downloads and parses the word list.
 *
 * @param url - Where the word list file is
 * @returns The word list
 * @throws If it can't be downloaded
 */
export async function loadWordlist(url = 'data/words.txt'): Promise<Wordlist> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load word list (${res.status})`);
    return parseWordlist(await res.text());
}

/**
 * Finds every word that can be traced in a grid, and the squares each one can go through.
 *
 * @param letters - The grid's letters, row by row
 * @param wordlist - The words that count
 * @param size - The grid's width
 * @returns The puzzle: the letters, the answers, and how they cover the grid
 */
export function solveGrid(letters: string[], wordlist: Wordlist, size = SIZE): Puzzle {
    const adj = letters.map((_, i) => neighbors(i, size));
    const answerSquares = new Map<string, Set<number>>();
    const used = new Array<boolean>(letters.length).fill(false);
    const path: number[] = [];

    const visit = (i: number, prefix: string): void => {
        const word = prefix + letters[i];
        if (!hasPrefix(wordlist, word)) return;
        used[i] = true;
        path.push(i);
        if (word.length >= MIN_WORD_LENGTH && wordlist.set.has(word)) {
            const squares = answerSquares.get(word) ?? new Set<number>();
            for (const sq of path) squares.add(sq);
            answerSquares.set(word, squares);
        }
        if (word.length < MAX_WORD_LENGTH) {
            for (const j of adj[i]) if (!used[j]) visit(j, word);
        }
        path.pop();
        used[i] = false;
    };
    for (let i = 0; i < letters.length; i++) visit(i, '');

    const coverage = new Array<number>(letters.length).fill(0);
    for (const squares of answerSquares.values()) for (const sq of squares) coverage[sq]++;
    return { letters, answers: [...answerSquares.keys()].sort(), coverage, answerSquares };
}
