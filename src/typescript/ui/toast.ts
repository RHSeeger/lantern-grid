import type { DomChild } from '../types/DomChild';
import type { MessageKind } from '../types/MessageKind';
import type { ToastOptions } from '../types/ToastOptions';
import { getElement } from './getElement';
import { h, restartAnimation } from './dom';

/**
 * Toasts (short pop-up messages near the top: badges, notices, "Update available") and the message shown above the
 * word being typed ("Not in word list", "Nice! +5").
 */

/** Toasts waiting to be shown. Timed toasts show one at a time, so they never pile up over the game */
const queue: (() => void)[] = [];

/** Whether a timed toast is showing */
let busy = false;

/** The timer that hides the message above the word */
let msgTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Shows the next queued toast, if any.
 */
function next(): void {
    const show = queue.shift();
    busy = !!show;
    show?.();
}

/**
 * Shows a toast. Timed toasts wait their turn; a toast with duration 0 shows at once and stays until dismissed.
 *
 * @param content - What it says
 * @param options - How long it shows, and an optional button
 * @returns A function that dismisses it (or takes it out of the queue)
 */
export function showToast(content: DomChild, { duration = 3500, action = null, className = '' }: ToastOptions = {}) {
    let el: HTMLElement | null = null;
    let done = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const dismiss = (): void => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        if (!el) {
            queue.splice(queue.indexOf(show), 1);
            return;
        }
        const shown = el;
        shown.classList.remove('show');
        setTimeout(() => shown.remove(), 300);
        if (duration) setTimeout(next, 250);
    };
    const show = (): void => {
        el = h(
            'div',
            { class: `toast ${className}`, role: 'status' },
            content,
            action &&
                h(
                    'button',
                    {
                        class: 'toast-action',
                        type: 'button',
                        onclick: () => {
                            action.onClick();
                            dismiss();
                        },
                    },
                    action.label,
                ),
        );
        getElement('toasts').append(el);
        const shown = el;
        requestAnimationFrame(() => shown.classList.add('show'));
        if (duration) timer = setTimeout(dismiss, duration);
    };
    if (!duration) show();
    else {
        queue.push(show);
        if (!busy) next();
    }
    return dismiss;
}

/**
 * Shows a message above the word being typed, briefly.
 *
 * @param text - The message
 * @param kind - Its kind (sets its look and how long it shows)
 * @param points - Points to show beside it ("+5"), if any
 */
export function flashMessage(text: string, kind: MessageKind = 'error', points: number | null = null): void {
    const root = getElement('message');
    clearTimeout(msgTimer);
    root.replaceChildren(
        h('span', { class: `msg msg-${kind}` }, text),
        ...(points != null ? [h('span', { class: 'msg-points' }, `+${points}`)] : []),
    );
    restartAnimation(root, 'show');
    msgTimer = setTimeout(() => root.classList.remove('show'), kind === 'error' ? 1100 : 1500);
}
