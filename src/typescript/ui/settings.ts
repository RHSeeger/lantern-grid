import { APP_NAME, REPO_URL } from '../data/app';
import type { Theme } from '../types/Theme';
import { h } from './dom';
import { closeModal, openModal } from './modal';

/**
 * The Menu screen: light / dark / auto, about the game (with a link to its source on GitHub), and erasing local play.
 */

/**
 * Makes the "About" section: what the game is, and where its source is.
 *
 * @returns The section's elements
 */
export function aboutSection(): HTMLElement[] {
    return [
        h('h3', {}, 'About'),
        h(
            'p',
            { class: 'small' },
            `${APP_NAME} is a free family game, made for fun. The source code is on `,
            h('a', { href: REPO_URL, target: '_blank', rel: 'noopener' }, 'GitHub'),
            '.',
        ),
    ];
}

/**
 * Opens the Menu screen.
 *
 * @param options - The current theme, and what the choices do
 */
export function showSettings(options: { theme: Theme; onTheme: (t: Theme) => void; onErase: () => void }): void {
    const choices: [Theme, string][] = [
        ['auto', 'Auto'],
        ['light', 'Light'],
        ['dark', 'Dark'],
    ];
    const seg = h(
        'div',
        { class: 'segmented', role: 'group', 'aria-label': 'Theme' },
        choices.map(([value, label]) =>
            h(
                'button',
                {
                    type: 'button',
                    class: value === options.theme ? 'on' : '',
                    'aria-pressed': String(value === options.theme),
                    onclick: (e: Event) => {
                        options.onTheme(value);
                        for (const b of seg.querySelectorAll('button')) {
                            b.classList.toggle('on', b === e.currentTarget);
                            b.setAttribute('aria-pressed', String(b === e.currentTarget));
                        }
                    },
                },
                label,
            ),
        ),
    );
    openModal({
        title: 'Menu',
        content: [
            h('h3', {}, 'Appearance'),
            seg,
            aboutSection(),
            h(
                'details',
                { class: 'danger-zone' },
                h('summary', {}, 'Erase my progress on this device'),
                h(
                    'p',
                    { class: 'small' },
                    'Erases your play on your own ("Just me") on this device. Family play is kept with the family.',
                ),
                h(
                    'button',
                    {
                        class: 'pill danger',
                        type: 'button',
                        onclick: () => {
                            if (confirm('Erase all your progress on this device? This cannot be undone.')) {
                                closeModal();
                                options.onErase();
                            }
                        },
                    },
                    'Erase',
                ),
            ),
        ],
    });
}
