import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startApp } from '../../src/typescript/app';
import { closeModal, isModalOpen } from '../../src/typescript/ui/modal';

/**
 * A smoke test of the whole game in local play: the page loads, the welcome screen opens, and tracing a word by
 * tapping lights its squares and is saved.
 */

// "cart" along the top row, "rate" down from the r
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
            return String(url).includes('words') ? 'carat\ncart\nrate\n' : `${GRID}\n`;
        },
    })) as unknown as typeof fetch;
    await startApp();
    (document.querySelector('.grid') as HTMLElement).getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600 }) as DOMRect;
});

afterAll(() => jest.useRealTimers());

describe('Lantern Grid', () => {
    it('opens with the welcome screen, and the grid', () => {
        expect(isModalOpen()).toBe(true);
        closeModal();
        expect(document.querySelectorAll('.sq')).toHaveLength(36);
        expect(document.querySelector('.sq')?.textContent).toContain('C');
        expect(document.getElementById('progress')?.textContent).toContain('0/2');
        expect(document.getElementById('lights')?.textContent).toContain('0/36 lit');
    });

    it('traces a word by tapping, lights it, and saves it', () => {
        [0, 1, 2, 3].forEach(tap);
        expect(document.getElementById('word-text')?.textContent).toBe('CART');
        tap(3); // tapping the last letter again submits the word
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(4);
        expect(document.getElementById('progress')?.textContent).toContain('1/2');
        expect(document.getElementById('lights')?.textContent).toContain('4/36 lit');
        expect(document.querySelector('.wordbox-count')?.textContent).toBe('1 of 2 words');
        const saved = Object.keys(localStorage).find((k) => k.startsWith('lantern:day:'));
        expect(saved && localStorage.getItem(saved)).toContain('"w":"cart"');
    });

    it('accepts a bonus word without points, and it takes meter readings on its squares', () => {
        const squares = document.querySelectorAll('.sq');
        // No numbers yet, though "rate" is still missing
        expect([...document.querySelectorAll('.sq-hint')].every((el) => el.textContent === '')).toBe(true);
        [0, 1, 2, 8, 14, 14].forEach(tap);
        expect(document.getElementById('message')?.textContent).toBe('Bonus word! 6 new readings');
        expect(document.querySelector('.wordbox-count')?.textContent).toBe('1 of 2 words +1 bonus');
        expect(document.getElementById('progress')?.textContent).toContain('1/2');
        // "rate" is still missing, and starts on the r, which has a reading now
        expect(squares[2].querySelector('.sq-hint')?.textContent).toBe('1');
        expect(squares[2].querySelector('.sq-start')?.textContent).toBe('▸1');
        // "rate" also goes through the e, which has no reading
        expect(squares[20].querySelector('.sq-hint')?.textContent).toBe('');
    });

    // Changed: clues used to be free once turned on; they now have to be earned (tests/ui/clues.test.ts has the rest)
    it('keeps the bulb off until a clue is earned, so tapping still traces', () => {
        const bulb = document.getElementById('btn-hints') as HTMLElement;
        bulb.click();
        expect(bulb.classList.contains('active')).toBe(false);
        expect(document.getElementById('message')?.textContent).toBe('Find 1 more bonus word for a clue');
        tap(2);
        expect(document.getElementById('word-text')?.textContent).toBe('R');
        tap(2); // tapping it again clears it, since one letter can't be a word
    });

    it('traces a word by dragging, and submits it on letting go', () => {
        const grid = document.querySelector('.grid') as HTMLElement;
        const at = (sq: number): MouseEventInit => ({
            clientX: (sq % 6) * 100 + 50,
            clientY: Math.floor(sq / 6) * 100 + 50,
            bubbles: true,
        });
        grid.dispatchEvent(new MouseEvent('pointerdown', at(2)));
        for (const sq of [8, 14, 20]) grid.dispatchEvent(new MouseEvent('pointermove', at(sq)));
        expect(document.getElementById('word-text')?.textContent).toBe('RATE');
        grid.dispatchEvent(new MouseEvent('pointerup', at(20)));
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(7);
        expect(document.querySelector('.wordbox-count')?.textContent).toBe('2 of 2 words +1 bonus');
        expect(document.getElementById('lights')?.textContent).toContain('7/36 cleared · 7/36 lit');
    });

    it('rejects a word already found', () => {
        [0, 1, 2, 3, 3].forEach(tap);
        expect(document.getElementById('message')?.textContent).toBe('Already found');
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(7);
    });

    it('brings a square to full only when every List word through it is found', () => {
        expect(document.querySelectorAll('.sq.dim-5')).toHaveLength(7);
        expect(document.getElementById('progress')?.textContent).toContain('Full Output');
    });
});
