import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { MAX_WORD_LENGTH, MIN_WORD_LENGTH, SIZE } from '../src/typescript/data/app';
import { neighbors } from '../src/typescript/gamelogic/grid';
import { seededRandom, shuffleInPlace } from '../src/typescript/gamelogic/prng';
import { parseWordlist, solveGrid } from '../src/typescript/gamelogic/solver';
import type { Puzzle } from '../src/typescript/types/Puzzle';
import { arg, loadScowl, parseBlocklist, SCOWL_VERSION } from './scowl';
import type { GridTuning } from './types/GridTuning';

/**
 * Builds src/static/data/words.txt, everyday-words.txt, puzzles.txt and LICENSE-wordlist.txt from SCOWL.
 *
 *   npm run build:puzzles -- [--size 50] [--days 1500] [--scowl path/to/scowl.tar.gz]
 *
 * Each grid is made by cutting the 6 x 6 grid into winding paths of 4 to 7 squares, and writing a common word along
 * each one. The grid is then searched for every word it holds, and kept only if its List (the everyday words, the ones
 * that count for rank) is a good length, reaches every square, has a long word to be a Spotlight, and doesn't leave too
 * many squares that hardly any words reach. Without --scowl, SCOWL is downloaded once into tools/.cache/. The output
 * is the same every time for the same source and settings, and is committed.
 */

/** The project's root directory */
const ROOT = path.resolve(__dirname, '..');

/** Where the output goes */
const DATA_DIR = path.join(ROOT, 'src', 'static', 'data');

/** The SCOWL size the words written along the paths come from (common words only) */
const SEED_SIZE = 35;

/** The limits for keeping a grid */
export const TUNING: GridTuning = {
    everydaySize: 20,
    minList: 45,
    maxList: 65,
    minSpotlights: 1,
    hardCoverage: 1,
    maxHard: 6,
    seed: 'lantern-grid puzzles v2',
};

/**
 * Decides whether a word can be an answer: lowercase a-z only (no proper nouns, apostrophes, accents or hyphens),
 * MIN_WORD_LENGTH to MAX_WORD_LENGTH letters, and not blocked.
 *
 * @param word - The word
 * @param blocklist - The blocked words
 * @returns True to keep it
 */
export function keepWord(word: string, blocklist: Set<string>): boolean {
    return (
        /^[a-z]+$/.test(word) &&
        word.length >= MIN_WORD_LENGTH &&
        word.length <= MAX_WORD_LENGTH &&
        !blocklist.has(word)
    );
}

/**
 * Counts the free squares connected to a square (flood fill).
 *
 * @param start - The square
 * @param free - Which squares are free
 * @param seen - Squares already counted (changed in place)
 * @returns How many free squares are connected to it, including itself
 */
function regionSize(start: number, free: boolean[], seen: boolean[]): number {
    let n = 0;
    const stack = [start];
    seen[start] = true;
    while (stack.length) {
        const i = stack.pop() as number;
        n++;
        for (const j of neighbors(i)) {
            if (free[j] && !seen[j]) {
                seen[j] = true;
                stack.push(j);
            }
        }
    }
    return n;
}

/**
 * Checks that every group of free squares is big enough to hold a word.
 *
 * @param free - Which squares are free
 * @returns True if no group is smaller than MIN_WORD_LENGTH
 */
function regionsOk(free: boolean[]): boolean {
    const seen = new Array<boolean>(free.length).fill(false);
    for (let i = 0; i < free.length; i++) {
        if (free[i] && !seen[i] && regionSize(i, free, seen) < MIN_WORD_LENGTH) return false;
    }
    return true;
}

/**
 * Cuts the grid into winding paths of 4 to 7 squares.
 *
 * @param rand - The random numbers to use
 * @returns The paths, or null if this attempt got stuck (try again)
 */
export function partition(rand: () => number): number[][] | null {
    const n = SIZE * SIZE;
    const free = new Array<boolean>(n).fill(true);
    const paths: number[][] = [];
    const freeNeighbors = (i: number): number => neighbors(i).filter((j) => free[j]).length;
    for (let guard = 0; guard < 100 && free.some(Boolean); guard++) {
        const remaining = free.filter(Boolean).length;
        // Start from the most cornered free square, so none get stranded
        const open = [...free.keys()].filter((i) => free[i]);
        const fewest = Math.min(...open.map(freeNeighbors));
        const starts = open.filter((i) => freeNeighbors(i) === fewest);
        const start = starts[Math.floor(rand() * starts.length)];
        const want = Math.min(remaining, MIN_WORD_LENGTH + Math.floor(rand() * 4));
        if (remaining - want > 0 && remaining - want < MIN_WORD_LENGTH) return null;
        let placed: number[] | null = null;
        for (let attempt = 0; attempt < 20 && !placed; attempt++) {
            const p = [start];
            free[start] = false;
            while (p.length < want) {
                const next = neighbors(p[p.length - 1]).filter((j) => free[j]);
                if (!next.length) break;
                // Shuffled, then the most cornered first (the sort keeps the shuffled order among equals)
                shuffleInPlace(next, rand).sort((a, b) => freeNeighbors(a) - freeNeighbors(b));
                const pick = rand() < 0.7 ? next[0] : next[Math.floor(rand() * next.length)];
                p.push(pick);
                free[pick] = false;
            }
            if (p.length === want && regionsOk(free)) placed = p;
            else for (const sq of p) free[sq] = true;
        }
        if (!placed) return null;
        paths.push(placed);
    }
    return free.some(Boolean) ? null : paths;
}

/**
 * Makes a grid: cuts it into paths and writes a common word along each one.
 *
 * @param rand - The random numbers to use
 * @param seedsByLength - The common words, by length
 * @returns The grid's letters, row by row, or null if this attempt got stuck
 */
export function makeGrid(rand: () => number, seedsByLength: Map<number, string[]>): string[] | null {
    const paths = partition(rand);
    if (!paths) return null;
    const letters = new Array<string>(SIZE * SIZE).fill('');
    const used = new Set<string>();
    for (const p of paths) {
        const choices = (seedsByLength.get(p.length) ?? []).filter((w) => !used.has(w));
        if (!choices.length) return null;
        const word = choices[Math.floor(rand() * choices.length)];
        used.add(word);
        p.forEach((sq, k) => (letters[sq] = word[k]));
    }
    return letters;
}

/**
 * Decides whether to keep a grid, from its List.
 *
 * @param puzzle - The grid, solved with only the everyday words
 * @returns True if its List is a good length, reaches every square, and has a Spotlight word
 */
export function gridIsGood(puzzle: Puzzle): boolean {
    const n = puzzle.list.length;
    if (n < TUNING.minList || n > TUNING.maxList) return false;
    if (puzzle.coverage.some((c) => c === 0)) return false;
    if (puzzle.spotlights.length < TUNING.minSpotlights) return false;
    return puzzle.coverage.filter((c) => c <= TUNING.hardCoverage).length <= TUNING.maxHard;
}

/**
 * Builds the word lists, the puzzle list and the license file.
 */
export async function main(): Promise<void> {
    const size = Number(arg('size') ?? 50);
    const days = Number(arg('days') ?? 1500);
    const scowl = await loadScowl(ROOT, arg('scowl'));
    const blocklist = parseBlocklist(await readFile(path.join(ROOT, 'tools', 'blocklist.txt'), 'utf8'));
    const words = [...new Set(scowl.wordsUpTo(size).filter((w) => keepWord(w, blocklist)))].sort();
    const wordSet = new Set(words);
    const seeds = [...new Set(scowl.wordsUpTo(SEED_SIZE))].filter(
        (w) => wordSet.has(w) && w.length <= 7 && !/q(?!u)/.test(w),
    );
    seeds.sort();
    const seedsByLength = new Map<number, string[]>();
    for (const w of seeds) seedsByLength.set(w.length, [...(seedsByLength.get(w.length) ?? []), w]);
    const everydayWords = [...new Set(scowl.wordsUpTo(TUNING.everydaySize))].filter((w) => wordSet.has(w)).sort();
    const everyday = parseWordlist(everydayWords.join('\n'));
    const wordlist = parseWordlist(words.join('\n'));

    const rand = seededRandom(TUNING.seed);
    const grids: string[] = [];
    const seen = new Set<string>();
    let tries = 0;
    let answerTotal = 0;
    let listTotal = 0;
    while (grids.length < days) {
        tries++;
        const letters = makeGrid(rand, seedsByLength);
        if (!letters) continue;
        const line = letters.join('');
        if (seen.has(line)) continue;
        // Searching for just the everyday words first is much quicker, and rules out most grids
        const list = solveGrid(letters, everyday, everyday.set);
        if (!gridIsGood(list)) continue;
        seen.add(line);
        grids.push(line);
        answerTotal += solveGrid(letters, wordlist, everyday.set).answers.length;
        listTotal += list.list.length;
    }

    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(path.join(DATA_DIR, 'words.txt'), words.join('\n') + '\n');
    await writeFile(path.join(DATA_DIR, 'everyday-words.txt'), everydayWords.join('\n') + '\n');
    await writeFile(path.join(DATA_DIR, 'puzzles.txt'), grids.join('\n') + '\n');
    await writeFile(
        path.join(DATA_DIR, 'LICENSE-wordlist.txt'),
        `data/words.txt is derived from SCOWL (Spell Checker Oriented Word Lists) version ${SCOWL_VERSION},\n` +
            `http://wordlist.aspell.net/ - American English, size ${size}, filtered by tools/build-puzzles.ts.\n` +
            `The original SCOWL copyright notice follows.\n\n${scowl.copyright}`,
    );
    console.log(
        `size ${size}: ${words.length} words, ${seeds.length} path words. ${grids.length} grids ` +
            `(~${(grids.length / 365).toFixed(1)} years) from ${tries} tries; ` +
            `avg ${(listTotal / grids.length).toFixed(1)} List words, ` +
            `${(answerTotal / grids.length).toFixed(1)} words accepted.`,
    );
}
