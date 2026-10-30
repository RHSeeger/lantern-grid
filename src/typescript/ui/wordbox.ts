import type { FoundPath } from '../types/FoundPath';
import { cap, h, icon } from './dom';

/**
 * The found-words box: how many words are found, and (opened) the list of them, alphabetically. Once everyone's work
 * is combined, each word has a dot in the color of whoever found it first.
 */

/**
 * Makes the found-words box.
 *
 * @param root - The element to draw it in
 * @returns A function that draws it
 */
export function createWordbox(root: HTMLElement): {
    render: (found: FoundPath[], total: number, finder: ((uid: string) => string) | null, fresh?: string) => void;
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
        render(found, total, finder, fresh) {
            const first = new Map<string, FoundPath>();
            for (const f of found) if (!first.has(f.w)) first.set(f.w, f);
            const words = [...first.keys()].sort();
            count.textContent = `${words.length} of ${total} words`;
            preview.replaceChildren(
                ...[...first.keys()]
                    .reverse()
                    .slice(0, 8)
                    .map((w) => h('span', {}, cap(w))),
            );
            list.replaceChildren(
                ...words.map((w) => {
                    const by = first.get(w)?.by;
                    return h(
                        'li',
                        { class: `${w === fresh ? 'fresh' : ''}${finder && by ? ' by-player' : ''}` },
                        finder && by && h('span', { class: `player-dot player-${finder(by)}`, 'aria-hidden': 'true' }),
                        cap(w),
                    );
                }),
            );
        },
    };
}
