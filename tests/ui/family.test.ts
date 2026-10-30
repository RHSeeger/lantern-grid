import { readFileSync } from 'node:fs';
import path from 'node:path';
import { startApp } from '../../src/typescript/app';
import { closeModal } from '../../src/typescript/ui/modal';
import { fake, fakeApi } from '../helpers/fakeFamily';

jest.mock('../../src/typescript/family/api', () => fakeApi);

/**
 * Family play, against a stand-in for Firebase: each player sees only their own words until they combine, then the
 * board lights with everyone's, and Compare shows each player and the family together.
 */

// "cart" along the top row, "rate" down from the r
const GRID = 'cartxx' + 'xxaxxx' + 'xxtxxx' + 'xxexxx' + 'xxxxxx' + 'xxxxxx';

/**
 * Taps a square of the board.
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
 * Lets pending promises (the fake Firebase calls) finish.
 */
async function settle(): Promise<void> {
    for (let i = 0; i < 10; i++) await Promise.resolve();
}

beforeAll(async () => {
    jest.useFakeTimers();
    localStorage.setItem('lantern:mode', JSON.stringify({ kind: 'family', fid: 'f1' }));
    fake.day = { mom: { found: { '0123': { w: 'cart', at: 1 } } } };
    const html = readFileSync(path.join(__dirname, '../../src/index.html'), 'utf8');
    document.body.innerHTML = /<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? '';
    Element.prototype.setPointerCapture = jest.fn();
    window.confirm = jest.fn(() => true);
    global.fetch = jest.fn(async (url: string) => ({
        ok: true,
        status: 200,
        text: async () => (String(url).includes('words') ? 'cart\nrate\n' : `${GRID}\n`),
    })) as unknown as typeof fetch;
    await startApp();
    await settle();
    closeModal();
    (document.querySelector('.grid') as HTMLElement).getBoundingClientRect = () =>
        ({ left: 0, top: 0, width: 600, height: 600, right: 600, bottom: 600 }) as DOMRect;
});

afterAll(() => jest.useRealTimers());

describe('Lantern Grid family play', () => {
    it("connects to the family, and hides others' words until combined", () => {
        expect(document.getElementById('mode-chip')?.textContent).toContain('The Testers');
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(0);
        expect(document.getElementById('combine-chip')?.textContent).toBe('Combine our work (+1)');
    });

    it("saves the player's own words to the family", () => {
        [2, 8, 14, 20, 20].forEach(tap);
        expect(fake.day.me).toEqual({ found: { '28ek': { w: 'rate', at: expect.any(Number) } } });
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(4);
    });

    it('compares before combining: each player, but no family total', () => {
        (document.getElementById('btn-compare') as HTMLElement).click();
        const rows = [...document.querySelectorAll('.score-table tbody tr')].map((r) => r.textContent);
        expect(rows).toHaveLength(2);
        expect(rows[0]).toContain('Me (you)4/36');
        expect(rows[1]).toContain('Mom4/36');
        // Mom's longest word shows only as its length
        expect(rows[1]).toContain('4 letters');
        closeModal();
    });

    it("combines everyone's work: the board, and the family's total", () => {
        (document.getElementById('combine-chip') as HTMLElement).click();
        expect(document.querySelectorAll('.sq.lit')).toHaveLength(7);
        expect(document.querySelectorAll('.sq-owners .player-dot').length).toBe(8);
        (document.getElementById('btn-compare') as HTMLElement).click();
        const team = document.querySelector('.score-table tr.team')?.textContent;
        expect(team).toContain('Together7/362');
        closeModal();
    });

    it('says who found a word first, once combined', () => {
        [0, 1, 2, 3, 3].forEach(tap);
        expect(document.getElementById('message')?.textContent).toBe('Already found (by Mom)');
    });
});
