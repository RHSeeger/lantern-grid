import { SIZE } from '../data/app';
import { RANKS } from '../data/ranks';
import { formatLongDate } from '../gamelogic/dates';
import { listPoints, litSquares, rankIndexFor, summarize, wordPoints } from '../gamelogic/play';
import type { FoundPath } from '../types/FoundPath';
import type { Puzzle } from '../types/Puzzle';
import { cap, h } from './dom';
import { openModal } from './modal';

/**
 * The Yesterday screen: yesterday's grid (with what was lit), and the List, with the words found checked.
 */

/**
 * Opens the Yesterday screen.
 *
 * @param key - Yesterday's day key
 * @param puzzle - Yesterday's puzzle
 * @param found - The words found (the player's, or the family's together)
 * @param finder - Returns a finder's color (family play), or null
 */
export function showYesterday(
    key: string,
    puzzle: Puzzle,
    found: FoundPath[],
    finder: ((uid: string) => string) | null,
): void {
    const lit = litSquares(found, puzzle);
    const summary = summarize(found, puzzle);
    const by = new Map<string, string | undefined>();
    for (const f of found) if (!by.has(f.w)) by.set(f.w, f.by);
    const longestFirst = [...puzzle.list].sort((a, b) => wordPoints(b) - wordPoints(a) || (a < b ? -1 : 1));
    openModal({
        title: "Yesterday's Answers",
        content: [
            h('p', { class: 'muted small' }, formatLongDate(key)),
            h(
                'div',
                { class: 'mini-grid', style: { gridTemplateColumns: `repeat(${SIZE}, 1fr)` }, 'aria-hidden': 'true' },
                puzzle.letters.map((l, i) => h('span', { class: lit.has(i) ? 'lit' : '' }, l.toUpperCase())),
            ),
            h(
                'p',
                {},
                `${RANKS[rankIndexFor(summary.points, listPoints(puzzle))].name}: ${summary.words} of ${puzzle.list.length} ` +
                    `words found, ${summary.bonus} bonus, and ${lit.size} of ${puzzle.letters.length} squares lit.`,
            ),
            h(
                'ul',
                { class: 'answer-list' },
                longestFirst.map((w) => {
                    const got = by.has(w);
                    const who = by.get(w);
                    return h(
                        'li',
                        { class: got ? '' : 'missed' },
                        h('span', { class: 'check', 'aria-hidden': 'true' }, got ? '✓' : ''),
                        finder &&
                            who &&
                            h('span', { class: `player-dot player-${finder(who)}`, 'aria-hidden': 'true' }),
                        cap(w),
                        puzzle.spotlights.includes(w) && h('span', { class: 'spotlight-star' }, ' ★'),
                    );
                }),
            ),
        ],
    });
}
