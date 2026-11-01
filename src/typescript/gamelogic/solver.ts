import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, SIZE, SPOTLIGHT_MAX, SPOTLIGHT_MIN_LENGTH } from '../data/app';
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
 * Picks a grid's Spotlights: its longest List words, of at least SPOTLIGHT_MIN_LENGTH letters.
 *
 * @param list - The grid's List
 * @returns Up to SPOTLIGHT_MAX of them, longest first (alphabetically among equals)
 */
export function pickSpotlights(list: string[]): string[] {
    return list
        .filter((w) => w.length >= SPOTLIGHT_MIN_LENGTH)
        .sort((a, b) => b.length - a.length || (a < b ? -1 : 1))
        .slice(0, SPOTLIGHT_MAX);
}

/**
 * Finds every word that can be traced in a grid, and the squares each one can go through.
 *
 * @param letters - The grid's letters, row by row
 * @param wordlist - The words that are accepted
 * @param everyday - The words that count for rank (on the grid's List)
 * @param size - The grid's width
 * @returns The puzzle: the letters, the answers, the List, and how the List covers the grid
 */
export function solveGrid(letters: string[], wordlist: Wordlist, everyday: Set<string>, size = SIZE): Puzzle {
    const adj = letters.map((_, i) => neighbors(i, size));
    const answerSquares = new Map<string, Set<number>>();
    const answerStarts = new Map<string, Set<number>>();
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
            answerStarts.set(word, (answerStarts.get(word) ?? new Set<number>()).add(path[0]));
        }
        if (word.length < MAX_WORD_LENGTH) {
            for (const j of adj[i]) if (!used[j]) visit(j, word);
        }
        path.pop();
        used[i] = false;
    };
    for (let i = 0; i < letters.length; i++) visit(i, '');

    const answers = [...answerSquares.keys()].sort();
    const list = answers.filter((w) => everyday.has(w));
    const coverage = new Array<number>(letters.length).fill(0);
    for (const w of list) for (const sq of answerSquares.get(w) ?? []) coverage[sq]++;
    return { letters, answers, list, spotlights: pickSpotlights(list), coverage, answerSquares, answerStarts };
}
