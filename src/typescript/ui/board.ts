import { SIZE } from '../data/app';
import { touches } from '../gamelogic/grid';
import type { BoardView } from '../types/BoardView';
import { h } from './dom';

/**
 * The board: the grid of letters, lit squares, and tracing a word. A word is traced by dragging a finger (or the
 * mouse) through the letters, and submitted on letting go; or by tapping the letters one at a time, and tapping the
 * last one again (or Enter). While dragging, only the middle of each square counts, so moving corner to corner
 * doesn't catch the squares beside the way.
 */

/** How close to a square's middle a drag must come to pick it, as a fraction of the square's width */
const DRAG_RADIUS = 0.42;

/**
 * Makes the board.
 *
 * @param root - The element to draw it in
 * @param options - What happens as the path changes, and when it is submitted
 * @returns Functions to set the letters and draw the board
 */
export function createBoard(
    root: HTMLElement,
    options: { onPathChange: (path: number[]) => void; onSubmit: (path: number[]) => void },
): { setLetters: (letters: string[]) => void; render: (view: BoardView) => void } {
    const n = SIZE * SIZE;
    const squares = Array.from({ length: n }, (_, i) =>
        h(
            'div',
            { class: 'sq', 'data-i': String(i), role: 'gridcell' },
            h('span', { class: 'sq-letter' }),
            h('span', { class: 'sq-hint', 'aria-hidden': 'true' }),
            h('span', { class: 'sq-owners', 'aria-hidden': 'true' }),
        ),
    );
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    line.setAttribute('class', 'trace-line');
    const overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.setAttribute('class', 'trace');
    overlay.setAttribute('viewBox', `0 0 ${SIZE * 100} ${SIZE * 100}`);
    overlay.setAttribute('aria-hidden', 'true');
    overlay.append(line);
    const grid = h('div', { class: 'grid', role: 'grid', 'aria-label': 'Letters' }, squares);
    root.replaceChildren(grid, overlay);

    let letters: string[] = [];
    let path: number[] = [];
    /** The pointer being tracked, and where it went down */
    let press: { id: number; start: number; before: number[]; dragged: boolean } | null = null;

    const setPath = (p: number[]): void => {
        path = p;
        options.onPathChange(path);
    };

    /**
     * Finds the square under a point.
     *
     * @param x - The point's x (client coordinates)
     * @param y - The point's y
     * @param strict - Only count the middle of a square (while dragging)
     * @returns The square, or -1
     */
    const squareAt = (x: number, y: number, strict: boolean): number => {
        const r = grid.getBoundingClientRect();
        const w = r.width / SIZE;
        const col = Math.floor((x - r.left) / w);
        const row = Math.floor((y - r.top) / w);
        if (col < 0 || col >= SIZE || row < 0 || row >= SIZE) return -1;
        if (strict) {
            const dx = x - (r.left + (col + 0.5) * w);
            const dy = y - (r.top + (row + 0.5) * w);
            if (Math.hypot(dx, dy) > DRAG_RADIUS * w) return -1;
        }
        return row * SIZE + col;
    };

    /**
     * Handles a tap (a press with no drag): extends the path, submits it (tapping its last square), or starts again.
     *
     * @param sq - The square tapped
     * @param before - The path before the tap
     */
    const tap = (sq: number, before: number[]): void => {
        const last = before[before.length - 1];
        if (before.length && sq === last) {
            if (before.length > 1) options.onSubmit(before);
            setPath([]);
        } else if (before.includes(sq)) setPath(before.slice(0, before.indexOf(sq) + 1));
        else if (before.length && touches(last, sq)) setPath([...before, sq]);
        else setPath([sq]);
    };

    grid.addEventListener('pointerdown', (e) => {
        if (press || e.button > 0) return;
        const sq = squareAt(e.clientX, e.clientY, false);
        if (sq < 0) return;
        e.preventDefault();
        grid.setPointerCapture(e.pointerId);
        press = { id: e.pointerId, start: sq, before: path, dragged: false };
        squares[sq].classList.add('pressed');
    });
    grid.addEventListener('pointermove', (e) => {
        if (!press || e.pointerId !== press.id) return;
        const sq = squareAt(e.clientX, e.clientY, true);
        if (sq < 0) return;
        if (!press.dragged) {
            if (sq === press.start || !touches(press.start, sq)) return;
            press.dragged = true;
            setPath([press.start, sq]);
            return;
        }
        const last = path[path.length - 1];
        if (sq === last) return;
        if (sq === path[path.length - 2]) setPath(path.slice(0, -1));
        else if (!path.includes(sq) && touches(last, sq)) setPath([...path, sq]);
    });
    const release = (e: PointerEvent, cancelled: boolean): void => {
        if (!press || e.pointerId !== press.id) return;
        const p = press;
        press = null;
        squares[p.start].classList.remove('pressed');
        if (cancelled) return;
        if (p.dragged) {
            const traced = path;
            setPath([]);
            options.onSubmit(traced);
        } else tap(p.start, p.before);
    };
    grid.addEventListener('pointerup', (e) => release(e, false));
    grid.addEventListener('pointercancel', (e) => release(e, true));
    // Stops the page scrolling or zooming while tracing on a phone
    grid.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

    return {
        setLetters(l) {
            letters = l;
            squares.forEach((el, i) => {
                (el.firstChild as HTMLElement).textContent = (letters[i] ?? '').toUpperCase();
            });
        },
        render(view) {
            path = view.path;
            squares.forEach((el, i) => {
                const g = view.glow[i] ?? 0;
                const k = view.path.indexOf(i);
                el.className = `sq${g ? ` lit glow-${Math.min(g, 3)}` : ''}${k >= 0 ? ' traced' : ''}`;
                if (k >= 0 && k === view.path.length - 1) el.classList.add('last');
                const label = `${(letters[i] ?? '').toUpperCase()}${g ? ', lit' : ''}`;
                el.setAttribute('aria-label', label);
                const hint = el.children[1] as HTMLElement;
                hint.textContent = view.hints && !g ? String(view.hints[i]) : '';
                const owners = el.children[2] as HTMLElement;
                owners.replaceChildren(
                    ...(view.owners?.[i] ?? []).map((c) => h('span', { class: `player-dot player-${c}` })),
                );
            });
            const pts = view.path.map((i) => `${(i % SIZE) * 100 + 50},${Math.floor(i / SIZE) * 100 + 50}`);
            line.setAttribute('points', pts.join(' '));
        },
    };
}
