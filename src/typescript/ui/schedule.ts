import { SCHEDULE_LENGTHS } from '../data/app';
import { clueText, fixtureSchedule } from '../gamelogic/play';
import type { FoundPath } from '../types/FoundPath';
import type { Puzzle } from '../types/Puzzle';
import { h, svg } from './dom';
import { openModal } from './modal';

/**
 * The Fixture Schedule screen: a table of the List words still missing, by first letter and length, and the clues
 * the player has paid for and not solved yet. It never says what the words are.
 */

/** The toolbar icon: a table */
const SCHEDULE_ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v14H4zM4 10h16M4 14.5h16M9.5 5v14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/**
 * Makes the toolbar icon.
 *
 * @returns The SVG element
 */
export function scheduleIcon(): Element {
    return svg(SCHEDULE_ICON);
}

/**
 * Makes a table cell for a count, leaving a dash for none.
 *
 * @param n - The count
 * @returns The cell
 */
function countCell(n: number): HTMLTableCellElement {
    return h('td', { class: n ? '' : 'muted' }, n ? String(n) : '–');
}

/**
 * Opens the Fixture Schedule screen.
 *
 * @param found - The words found (the player's, or the family's together)
 * @param puzzle - The puzzle
 * @param paid - The words the player has paid for a clue about
 */
export function showSchedule(found: FoundPath[], puzzle: Puzzle, paid: string[]): void {
    const rows = fixtureSchedule(found, puzzle);
    const totals = SCHEDULE_LENGTHS.map((_, i) => rows.reduce((sum, r) => sum + r.counts[i], 0));
    const have = new Set(found.map((f) => f.w));
    const open = paid.filter((w) => !have.has(w));
    const lastLength = SCHEDULE_LENGTHS.length - 1;
    openModal({
        title: 'Fixture Schedule',
        content: [
            rows.length
                ? [
                      h(
                          'p',
                          { class: 'muted small' },
                          'The List words you’re still missing, by first letter and length.',
                      ),
                      h(
                          'table',
                          { class: 'schedule' },
                          h(
                              'thead',
                              {},
                              h(
                                  'tr',
                                  {},
                                  h('th', {}, ''),
                                  SCHEDULE_LENGTHS.map((n, i) => h('th', {}, i === lastLength ? `${n}+` : String(n))),
                                  h('th', {}, 'All'),
                              ),
                          ),
                          h(
                              'tbody',
                              {},
                              rows.map((r) =>
                                  h(
                                      'tr',
                                      {},
                                      h('th', {}, r.letter.toUpperCase()),
                                      r.counts.map(countCell),
                                      countCell(r.counts.reduce((a, b) => a + b, 0)),
                                  ),
                              ),
                          ),
                          h(
                              'tfoot',
                              {},
                              h(
                                  'tr',
                                  {},
                                  h('th', {}, 'All'),
                                  totals.map(countCell),
                                  countCell(totals.reduce((a, b) => a + b, 0)),
                              ),
                          ),
                      ),
                  ]
                : h('p', {}, 'Nothing left: every word on the List is found.'),
            open.length > 0 && [
                h('h3', {}, 'Your clues'),
                h(
                    'ul',
                    { class: 'schedule-clues' },
                    open.map((w) => h('li', {}, clueText(w))),
                ),
            ],
        ],
    });
}
