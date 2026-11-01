import { RANKS } from '../data/ranks';
import { rankIndexFor } from '../gamelogic/play';
import { h } from './dom';
import { openModal } from './modal';

/**
 * The progress line (the rank, and a bar of the List's points found), the line under it (Spotlights, and squares lit)
 * and the Rankings screen behind them.
 */

/**
 * Draws the progress line.
 *
 * @param el - The element to draw it in
 * @param points - The List's points found
 * @param total - All the List's points
 * @param team - True when showing the family's combined progress
 */
export function renderProgress(el: HTMLElement, points: number, total: number, team: boolean): void {
    const r = rankIndexFor(points, total);
    el.replaceChildren(
        h('span', { class: 'rank-name' }, RANKS[r].name),
        h(
            'span',
            { class: 'bar', 'aria-hidden': 'true' },
            h('span', { class: 'bar-fill', style: { width: `${total ? (100 * points) / total : 0}%` } }),
        ),
        h('span', { class: 'lit-count' }, `${points}/${total}`),
    );
    el.setAttribute(
        'aria-label',
        `${team ? 'Your family' : 'You'}: ${RANKS[r].name}, ${points} of ${total} points. Show the rankings.`,
    );
}

/**
 * Draws the line under the progress line: the day's Spotlights (a star for each, filled once found), and squares
 * cleared and lit.
 *
 * @param el - The element to draw it in
 * @param spotlightsFound - How many Spotlights are found
 * @param spotlights - How many Spotlights the grid has
 * @param cleared - How many squares are cleared
 * @param lit - How many squares are lit
 * @param squares - How many squares the grid has
 */
export function renderLights(
    el: HTMLElement,
    spotlightsFound: number,
    spotlights: number,
    cleared: number,
    lit: number,
    squares: number,
): void {
    const stars = '★'.repeat(spotlightsFound) + '☆'.repeat(spotlights - spotlightsFound);
    el.replaceChildren(
        h(
            'span',
            { 'aria-label': `${spotlightsFound} of ${spotlights} Spotlights found` },
            h('span', { class: 'lights-stars', 'aria-hidden': 'true' }, stars),
            ' Spotlights',
        ),
        h('span', {}, `${cleared}/${squares} cleared · ${lit}/${squares} lit`),
    );
}

/**
 * Opens the Rankings screen: how many points each rank needs.
 *
 * @param points - The List's points found
 * @param total - All the List's points
 */
export function showRankings(points: number, total: number): void {
    const current = rankIndexFor(points, total);
    openModal({
        title: 'Rankings',
        content: [
            h('p', {}, 'Ranks are based on the points you have from today’s List of everyday words.'),
            h(
                'table',
                { class: 'rank-table' },
                h(
                    'tbody',
                    {},
                    RANKS.map((rank, i) =>
                        h(
                            'tr',
                            { class: `${i <= current ? 'reached' : ''}${i === current ? ' current' : ''}` },
                            h('td', {}, h('span', { class: 'rank-dot' }), rank.name),
                            h('td', { class: 'num' }, String(Math.ceil(rank.min * total))),
                        ),
                    ),
                ),
            ),
        ],
    });
}
