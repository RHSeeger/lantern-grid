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
            h('p', { class: 'lead' }, 'Trace words through the grid to light it up. Can you bring it all up to full?'),
            h(
                'ul',
                { class: 'rules' },
                h('li', {}, 'Drag your finger from letter to letter to spell a word, then let go.'),
                h('li', {}, 'Or tap the letters one at a time, and tap the last one again (or press Enter).'),
                h('li', {}, 'Each letter must touch the one before it: across, up and down, or corner to corner.'),
                h('li', {}, 'Words must be at least 4 letters, and a square can only be used once in a word.'),
                h('li', {}, 'A word lights every square it could go through, even if you traced a different way.'),
            ),
            h('h3', {}, 'The List and your rank'),
            h(
                'p',
                {},
                'Each grid has a List of everyday words. Your rank comes from the points you have from the List: 1 for ',
                '4 letters, 2 for 5, 3 for 6, 5 for 7, and 11 for 8 or more. Tap the progress bar to see the ranks.',
            ),
            h(
                'p',
                {},
                'Other real words are accepted as bonus words. They don’t add points, but they can light a dark square, ',
                'and they take a meter reading.',
            ),
            h('h3', {}, 'Meter readings'),
            h(
                'p',
                {},
                'A bonus word shows two numbers on every square it could go through. The number at the top right is how ',
                'many List words you’re still missing through that square; “▸” at the top left is how many of them start ',
                'there. Use them to hunt down the real words.',
            ),
            h('h3', {}, 'Dimmers'),
            h(
                'p',
                {},
                'Each square is on a dimmer: the more of the List’s words through it you find, the brighter it gets. ',
                'A glowing square is at full, with every word through it found: that square is cleared. So a dim square ',
                'means words are still hiding there.',
            ),
            h('h3', {}, 'Spotlights'),
            h('p', {}, 'The stars are the List’s longest words, up to three a day. Can you find them all?'),
            h('h3', {}, 'Clues'),
            h(
                'p',
                {},
                'The bulb fills up as you find bonus words, and every 2 of them earn a clue: the number on the bulb is how ',
                'many you have ready. Tap the bulb, then a square, to see how long one of its missing words is and how it ',
                'starts. Seeing the same clue again is free. Dragging always traces a word.',
            ),
            h('h3', {}, 'Fixture Schedule'),
            h(
                'p',
                {},
                'The table button shows how many List words you’re still missing, by first letter and length, along with ',
                'your clues. It’s free, as often as you like.',
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
                'its finder’s color, and you can see how the family did as a team. Can you find every word on the List ',
                'together? In Compare, “Only” counts the List words that nobody else found.',
            ),
            aboutSection(),
            h('p', { class: 'muted small' }, `A new ${APP_NAME} grid comes out every day at midnight.`),
        ],
    });
}
