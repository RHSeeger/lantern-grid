import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startApp } from '../../src/typescript/app';
import { closeModal } from '../../src/typescript/ui/modal';

/**
 * A test of earning and spending clues in the whole game, and of the Fixture Schedule screen.
 */

// "cart" along the top row, "rate" down from the r, and the bonus words "carat" and "tart"
const GRID = 'cartxx' + 'xxaxxx' + 'xxtxxx' + 'xxexxx' + 'xxxxxx' + 'xxxxxx';

/**
 * Taps a square of the board (a press and release in the same place).
 *
 * @param sq - The square
 */
function tap(sq: number): void {
    const grid = document.querySelector('.grid') as HTMLElement;
    const at = { clientX: (sq % 6) * 100 + 50, clientY: Math.floor(sq / 6) * 100 + 50, bubbles: true };
    grid.dispatchEvent(new MouseEvent('pointerdown', at));
    grid.dispatchEvent(new MouseEvent('pointerup', at));
}

/**
 * Returns the bulb's button.
 *
 * @returns The button
 */
function bulb(): HTMLElement {
    return document.getElementById('btn-hints') as HTMLElement;
}

/**
 * Returns the clues saved on the device today.
 *
 * @returns The saved value
 */
function savedClues(): string | null | undefined {
    const key = Object.keys(localStorage).find((k) => k.startsWith('lantern:clues:local:'));
    return key && localStorage.getItem(key);
}

/**
 * Returns the toast showing, once a replaced toast has had time to leave.
 *
 * @returns Its text
 */
function toast(): string | null | undefined {
    jest.advanceTimersByTime(1000);
    return document.getElementById('toasts')?.textContent;
}

beforeAll(async () => {
    jest.useFakeTimers();
    const html = readFileSync(path.join(__dirname, '../../src/index.html'), 'utf8');
    document.body.innerHTML = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
    Element.prototype.setPointerCapture = jest.fn();
    global.fetch = jest.fn(async (url: string) => ({
        ok: true,
        status: 200,
        text: async () => {
            if (String(url).includes('everyday')) return 'cart\nrate\n';
            return String(url).includes('words') ? 'carat\ncart\nrate\ntart\n' : `${GRID}\n`;
        },
    })) as unknown as typeof fetch;
    await startApp();
    (document.querySelector('.grid') as HTMLElement).getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600 }) as DOMRect;
    closeModal();
});

afterAll(() => jest.useRealTimers());

describe('clues', () => {
    it('says how many bonus words are needed while no clue is ready', () => {
        bulb().click();
        expect(bulb().classList.contains('active')).toBe(false);
        expect(document.getElementById('message')?.textContent).toBe('Find 2 more bonus words for a clue');
    });

    it('fills the bulb with the first bonus word, and earns a clue with the second', () => {
        const level = () => Number(bulb().querySelector('.clue-level')?.getAttribute('y'));
        const empty = level();
        [0, 1, 2, 8, 14, 14].forEach(tap);
        expect(level()).toBeLessThan(empty);
        expect(bulb().querySelector('.clue-count')?.textContent).toBe('');
        expect(bulb().getAttribute('aria-label')).toContain('0 ready, 1 of 2');
        [14, 8, 2, 3, 3].forEach(tap);
        expect(document.getElementById('message')?.textContent).toBe('Bonus word! Clue earned!');
        expect(level()).toBe(empty);
        expect(bulb().querySelector('.clue-count')?.textContent).toBe('1');
    });

    it('spends a charge on a clue, turns the bulb off, and saves it on the device', () => {
        bulb().click();
        expect(bulb().classList.contains('active')).toBe(true);
        tap(0);
        expect(toast()).toContain('A word through here: 4 letters, starts CA.');
        expect(bulb().classList.contains('active')).toBe(false);
        expect(bulb().querySelector('.clue-count')?.textContent).toBe('');
        expect(savedClues()).toBe('["cart"]');
        const day = Object.keys(localStorage).find((k) => k.startsWith('lantern:day:'));
        expect(day && localStorage.getItem(day)).toContain('"hints":true');
    });

    it('shows a clue already paid for again for free, from any square it goes through', () => {
        jest.advanceTimersByTime(5000); // the first clue's toast goes away
        expect(toast()).toBe('');
        bulb().click();
        tap(1);
        expect(toast()).toContain('A word through here: 4 letters, starts CA.');
        expect(savedClues()).toBe('["cart"]');
    });

    it('refuses a new clue without a charge, and spends nothing on a square with no words left', () => {
        bulb().click();
        tap(20); // "rate" goes through here, and hasn't been paid for
        expect(toast()).toContain('Find 2 more bonus words for a clue.');
        expect(savedClues()).toBe('["cart"]');
        bulb().click();
        tap(30);
        expect(toast()).toContain('No words left through this square.');
        expect(bulb().classList.contains('active')).toBe(true);
        bulb().click();
    });

    it('shows the words left and the open clues in the Fixture Schedule', () => {
        (document.getElementById('btn-schedule') as HTMLElement).click();
        const rows = [...document.querySelectorAll('.schedule tbody tr')].map((r) => r.textContent);
        expect(rows).toEqual(['C1–––1', 'R1–––1']);
        expect(document.querySelector('.schedule-clues')?.textContent).toBe('4 letters, starts CA');
        closeModal();
    });

    it('takes a word out of the Fixture Schedule, and its clue, once found', () => {
        [0, 1, 2, 3, 3].forEach(tap);
        (document.getElementById('btn-schedule') as HTMLElement).click();
        const rows = [...document.querySelectorAll('.schedule tbody tr')].map((r) => r.textContent);
        expect(rows).toEqual(['R1–––1']);
        expect(document.querySelector('.schedule-clues')).toBeNull();
        closeModal();
    });

    it('has nothing to give once the paid clues are solved and no charge is left', () => {
        bulb().click();
        expect(bulb().classList.contains('active')).toBe(false);
        expect(document.getElementById('message')?.textContent).toBe('Find 2 more bonus words for a clue');
    });
});
