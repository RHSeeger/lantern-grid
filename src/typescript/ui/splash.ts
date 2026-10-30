import { APP_NAME, TAGLINE } from '../data/app';
import { formatLongDate } from '../gamelogic/dates';
import type { DomChild } from '../types/DomChild';
import { h, svg } from './dom';
import { closeModal, openModal } from './modal';

/**
 * The welcome screen (shown on each visit) and the celebration (shown when a puzzle is finished).
 */

/**
 * Opens the welcome screen.
 *
 * @param options - The day, who the player is playing with, a line about their progress, and the logo
 */
export function showSplash(options: {
    todayKey: string;
    familyName: string | null;
    progress: string | null;
    logo: string;
    extra?: DomChild;
}): void {
    openModal({
        title: APP_NAME,
        variant: 'splash',
        content: [
            h('div', { class: 'logo', 'aria-hidden': 'true' }, svg(options.logo)),
            h('p', { class: 'splash-tag' }, TAGLINE),
            options.familyName && h('p', { class: 'splash-family' }, `Playing with ${options.familyName}`),
            options.progress && h('p', { class: 'splash-progress' }, options.progress),
            h(
                'button',
                { class: 'pill primary big', type: 'button', 'data-autofocus': true, onclick: closeModal },
                options.progress ? 'Continue' : 'Play',
            ),
            options.extra,
            h('p', { class: 'splash-date' }, formatLongDate(options.todayKey)),
        ],
    });
}

/**
 * Opens the celebration.
 *
 * @param options - The heading, what was done, and an emoji
 */
export function showCelebration(options: { title: string; text: string; emoji: string }): void {
    openModal({
        title: options.title,
        variant: 'celebrate',
        content: [
            h('div', { class: 'celebrate-burst', 'aria-hidden': 'true' }, options.emoji),
            h('p', {}, options.text),
            h(
                'div',
                { class: 'button-row center' },
                h('button', { class: 'pill primary', type: 'button', onclick: closeModal }, 'Nice!'),
            ),
        ],
    });
}
