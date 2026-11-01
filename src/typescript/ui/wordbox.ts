import type { FoundPath } from '../types/FoundPath';
import type { Puzzle } from '../types/Puzzle';
import { cap, h, icon } from './dom';

/**
 * The found-words box: how many of the List's words are found (and any bonus words), and (opened) the list of them,
 * alphabetically. Spotlights have a star, and bonus words look quieter. Once everyone's work is combined, each word has
 * a dot in the color of whoever found it first.
 */

/**
 * Makes the found-words box.
 *
 * @param root - The element to draw it in
 * @returns A function that draws it
 */
export function createWordbox(root: HTMLElement): {
    render: (found: FoundPath[], puzzle: Puzzle, finder: ((uid: string) => string) | null, fresh?: string) => void;
} {
    const count = h('span', { class: 'wordbox-count' });
    const preview = h('span', { class: 'wordbox-preview' });
    const head = h(
        'button',
        { class: 'wordbox-head', type: 'button', 'aria-expanded': 'false' },
        count,
        preview,
        h('span', { class: 'wordbox-chevron' }, icon('chevron')),
    );
    const list = h('ul', { class: 'wordbox-list' });
    root.replaceChildren(head, list);
    head.addEventListener('click', () => {
        const open = root.classList.toggle('open');
        head.setAttribute('aria-expanded', String(open));
    });
    return {
        render(found, puzzle, finder, fresh) {
            const first = new Map<string, FoundPath>();
            for (const f of found) if (puzzle.answerSquares.has(f.w) && !first.has(f.w)) first.set(f.w, f);
            const words = [...first.keys()].sort();
            const onList = new Set(puzzle.list);
            const listed = words.filter((w) => onList.has(w)).length;
            const bonus = words.length - listed;
            count.textContent = `${listed} of ${puzzle.list.length} words${bonus ? ` +${bonus} bonus` : ''}`;
            preview.replaceChildren(
                ...[...first.keys()]
                    .reverse()
                    .slice(0, 8)
                    .map((w) => h('span', {}, cap(w))),
            );
            list.replaceChildren(
                ...words.map((w) => {
                    const by = first.get(w)?.by;
                    const classes = [
                        w === fresh ? 'fresh' : '',
                        finder && by ? 'by-player' : '',
                        onList.has(w) ? '' : 'bonus-word',
                    ];
                    return h(
                        'li',
                        { class: classes.filter(Boolean).join(' ') },
                        finder && by && h('span', { class: `player-dot player-${finder(by)}`, 'aria-hidden': 'true' }),
                        cap(w),
                        puzzle.spotlights.includes(w) && h('span', { class: 'spotlight-star' }, ' ★'),
                    );
                }),
            );
        },
    };
}
