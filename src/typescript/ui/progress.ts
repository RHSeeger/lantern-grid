import { RANKS } from '../data/ranks';
import { rankIndexFor } from '../gamelogic/play';
import { h } from './dom';
import { openModal } from './modal';

/**
 * The progress line (the rank, and a bar of how many squares are lit) and the Rankings screen behind it.
 */

/**
 * Draws the progress line.
 *
 * @param el - The element to draw it in
 * @param lit - How many squares are lit
 * @param squares - How many squares the grid has
 * @param team - True when showing the family's combined progress
 */
export function renderProgress(el: HTMLElement, lit: number, squares: number, team: boolean): void {
    const r = rankIndexFor(lit, squares);
    el.replaceChildren(
        h('span', { class: 'rank-name' }, RANKS[r].name),
        h(
            'span',
            { class: 'bar', 'aria-hidden': 'true' },
            h('span', { class: 'bar-fill', style: { width: `${(100 * lit) / squares}%` } }),
        ),
        h('span', { class: 'lit-count' }, `${lit}/${squares}`),
    );
    el.setAttribute(
        'aria-label',
        `${team ? 'Your family' : 'You'}: ${RANKS[r].name}, ${lit} of ${squares} squares lit. Show the rankings.`,
    );
}

/**
 * Opens the Rankings screen: how many squares each rank needs.
 *
 * @param lit - How many squares are lit
 * @param squares - How many squares the grid has
 */
export function showRankings(lit: number, squares: number): void {
    const current = rankIndexFor(lit, squares);
    openModal({
        title: 'Rankings',
        content: [
            h('p', {}, 'Ranks are based on how many of the squares you have lit.'),
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
                            h('td', { class: 'num' }, String(Math.ceil(rank.min * squares))),
                        ),
                    ),
                ),
            ),
        ],
    });
}
