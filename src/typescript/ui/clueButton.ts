import { BONUS_PER_CLUE } from '../data/app';
import { h, svg } from './dom';

/**
 * The bulb in the toolbar: it fills up as bonus words are found, and shows how many clues are ready.
 */

/** The bulb's glass, as an SVG path (the same shape as the shared hint icon) */
const GLASS = 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z';

/** Where the glass starts and ends, in the icon's coordinates */
const GLASS_TOP = 3;
const GLASS_BOTTOM = 16;

/**
 * Sets up the bulb inside its button.
 *
 * @param button - The button (its contents are replaced)
 * @returns A function that redraws it, given the clues ready and the bonus words towards the next
 */
export function createClueButton(button: HTMLElement): (ready: number, progress: number) => void {
    const bulb = svg(
        `<svg viewBox="0 0 24 24" aria-hidden="true">
            <clipPath id="clue-fill-clip"><rect class="clue-level" x="0" y="${GLASS_BOTTOM}" width="24" height="24"/></clipPath>
            <path class="clue-fill" d="${GLASS}" clip-path="url(#clue-fill-clip)"/>
            <path d="M9 18h6M10 21h4${GLASS}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
    );
    const count = h('span', { class: 'clue-count' });
    button.replaceChildren(bulb, count);
    const level = bulb.querySelector('.clue-level') as Element;
    return (ready, progress) => {
        const share = progress / BONUS_PER_CLUE;
        level.setAttribute('y', String(GLASS_BOTTOM - share * (GLASS_BOTTOM - GLASS_TOP)));
        count.textContent = ready ? String(ready) : '';
        const label = `Clues: ${ready} ready, ${progress} of ${BONUS_PER_CLUE} bonus words towards the next`;
        button.setAttribute('aria-label', label);
        button.title = label;
    };
}
