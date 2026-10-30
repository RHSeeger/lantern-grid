import type { DomChild } from '../types/DomChild';
import type { ScoreRow } from '../types/ScoreRow';
import { h } from './dom';
import { closeModal, openModal } from './modal';

/**
 * The Compare screen: how each family member did today, side by side, and (once the player combines everyone's work)
 * how the family did together. The game decides the columns.
 */

/**
 * Opens the Compare screen.
 *
 * @param options - The columns, a row per member, the family's row (null until combined), and what the buttons do
 */
export function showScoreboard(options: {
    familyName: string;
    columns: string[];
    rows: ScoreRow[];
    team: ScoreRow | null;
    combined: boolean;
    note?: DomChild;
    onCombine: () => void;
    onUncombine: () => void;
}): void {
    const { columns, rows, team, combined } = options;
    const row = (r: ScoreRow, cls: string): HTMLElement =>
        h(
            'tr',
            { class: cls },
            h(
                'th',
                { scope: 'row' },
                h(
                    'span',
                    { class: 'who' },
                    r.color && h('span', { class: `player-dot player-${r.color}`, 'aria-hidden': 'true' }),
                    r.name,
                    r.isMe && h('span', { class: 'you' }, ' (you)'),
                ),
            ),
            r.values.map((v) => h('td', { class: 'num' }, v)),
        );
    openModal({
        title: 'Compare',
        content: [
            h('p', { class: 'muted small' }, `How everyone in ${options.familyName} is doing today.`),
            h(
                'div',
                { class: 'table-scroll' },
                h(
                    'table',
                    { class: 'score-table' },
                    h(
                        'thead',
                        {},
                        h(
                            'tr',
                            {},
                            h('th', {}, ''),
                            columns.map((c) => h('th', { class: 'num', scope: 'col' }, c)),
                        ),
                    ),
                    h(
                        'tbody',
                        {},
                        rows.map((r) => row(r, r.isMe ? 'me' : '')),
                        team && row(team, 'team'),
                    ),
                ),
            ),
            options.note,
            combined
                ? [
                      h('p', { class: 'small' }, "You're seeing everyone's work combined."),
                      h(
                          'div',
                          { class: 'button-row' },
                          h(
                              'button',
                              {
                                  class: 'pill',
                                  type: 'button',
                                  onclick: () => {
                                      closeModal();
                                      options.onUncombine();
                                  },
                              },
                              'Show only mine',
                          ),
                      ),
                  ]
                : [
                      h(
                          'p',
                          { class: 'small' },
                          'Ready to work together? Combining shows everyone’s work on your board, and how you did as a team. ',
                          'You can keep playing after.',
                      ),
                      h(
                          'div',
                          { class: 'button-row' },
                          h(
                              'button',
                              {
                                  class: 'pill primary',
                                  type: 'button',
                                  onclick: () => {
                                      closeModal();
                                      options.onCombine();
                                  },
                              },
                              'Combine our work',
                          ),
                      ),
                  ],
        ],
    });
}
