/**
 * App-wide constants: the game's name and address, storage, Firebase location, and the puzzle rules.
 */

/** The game's name, as shown to players */
export const APP_NAME = 'Lantern Grid';

/** The line under the name on the welcome screen */
export const TAGLINE = 'Trace words through the letters. Bring the whole grid up to full.';

/** Where the game's source code is */
export const REPO_URL = 'https://github.com/rhseeger/lantern-grid';

/** Prefix for every localStorage / sessionStorage key (the games share a web address, so each needs its own) */
export const STORAGE_PREFIX = 'lantern:';

/** This game's key in the shared Firebase database (`games/<key>/<family>/<day>`) */
export const GAME_KEY = 'lantern';

/** Day 0 of the puzzle list (YYYY-MM-DD) */
export const EPOCH_DAY = '2026-10-01';

/** The grid is SIZE x SIZE letters */
export const SIZE = 6;

/** The shortest word allowed */
export const MIN_WORD_LENGTH = 4;

/** The longest word allowed (and the longest path that can be traced) */
export const MAX_WORD_LENGTH = 16;

/** The shortest word that can be a Spotlight */
export const SPOTLIGHT_MIN_LENGTH = 7;

/** The most Spotlights a grid has */
export const SPOTLIGHT_MAX = 3;

/** The highest dimmer level: a square with every List word through it found */
export const DIMMER_FULL = 5;

/** The files the service worker keeps for offline play */
export const OFFLINE_FILES = [
    'data/words.txt',
    'data/everyday-words.txt',
    'data/puzzles.txt',
    'data/LICENSE-wordlist.txt',
];
