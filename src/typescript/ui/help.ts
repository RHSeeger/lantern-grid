import { APP_NAME } from '../data/app';
import { aboutSection } from './settings';
import { h } from './dom';
import { openModal } from './modal';

/**
 * The How to Play screen.
 */

/**
 * Opens the How to Play screen.
 */
export function showHelp(): void {
    openModal({
        title: 'How to Play',
        content: [
            h('p', { class: 'lead' }, 'Trace words through the grid to light up its squares. Can you light them all?'),
            h(
                'ul',
                { class: 'rules' },
                h('li', {}, 'Drag your finger from letter to letter to spell a word, then let go.'),
                h('li', {}, 'Or tap the letters one at a time, and tap the last one again (or press Enter).'),
                h('li', {}, 'Each letter must touch the one before it: across, up and down, or corner to corner.'),
                h('li', {}, 'Words must be at least 4 letters, and a square can only be used once in a word.'),
                h('li', {}, 'Every square a word goes through lights up. Squares used by more words glow brighter.'),
                h(
                    'li',
                    {},
                    'You can trace a word you already found along different squares, to light the squares it missed.',
                ),
            ),
            h('h3', {}, 'Scoring'),
            h(
                'p',
                {},
                'Your rank is how many squares you have lit. Words also score points: 1 for 4 letters, 2 for 5, 3 for ',
                '6, 5 for 7, and 11 for 8 or more.',
            ),
            h(
                'p',
                {},
                'Every square can be lit, but a few are tricky: only unusual words reach them. Turn on the hints (the ',
                'bulb) to see how many words go through each dark square.',
            ),
            h('h3', {}, 'Play with your family'),
            h(
                'p',
                {},
                'Tap “Just me” to create or join a family. Everyone gets the same grid each day and plays on their own. ',
                'Open Compare (the trophy) to see how you each did.',
            ),
            h(
                'p',
                {},
                'When you’re ready, tap “Combine our work”: everyone’s words light up your board together, each with ',
                'its finder’s color, and you can see how the family did as a team. Can you light every square together?',
            ),
            aboutSection(),
            h('p', { class: 'muted small' }, `A new ${APP_NAME} grid comes out every day at midnight.`),
        ],
    });
}
