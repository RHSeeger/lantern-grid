import type { ModalOptions } from '../types/ModalOptions';
import { getElement } from './getElement';
import { h, icon } from './dom';

/**
 * Modals: screens shown over the game (help, stats, hints, ...). Only one is open at a time. Escape, the backdrop and
 * the close button close it; focus is kept inside it while open, and goes back where it was when it closes.
 */

/** The open modal, if any */
let current: { root: HTMLElement; onClose?: () => void; returnFocus: Element | null } | null = null;

/**
 * Checks whether a modal is open.
 *
 * @returns True if one is open
 */
export function isModalOpen(): boolean {
    return current !== null;
}

/**
 * Closes the open modal, if any.
 */
export function closeModal(): void {
    if (!current) return;
    const { root, onClose, returnFocus } = current;
    current = null;
    root.remove();
    document.removeEventListener('keydown', onKey, true);
    onClose?.();
    (returnFocus as HTMLElement | null)?.focus?.();
}

/**
 * Handles keys while a modal is open: Escape closes it, and Tab cycles within it.
 *
 * @param e - The key event
 */
function onKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
        e.preventDefault();
        closeModal();
    } else if (e.key === 'Tab' && current) {
        const focusable = [
            ...current.root.querySelectorAll<HTMLElement>(
                'button, a[href], textarea, input, select, summary, [tabindex]:not([tabindex="-1"])',
            ),
        ].filter((el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }
}

/**
 * Opens a modal (closing any that is open). The element marked `data-autofocus` gets focus, or the close button.
 *
 * @param options - What it contains, and how it looks
 */
export function openModal({ title, content, onClose, variant = '', hideTitle = false }: ModalOptions): void {
    closeModal();
    const titleId = 'modal-title';
    const closeBtn = h(
        'button',
        { class: 'icon-btn modal-close', type: 'button', 'aria-label': 'Close', onclick: closeModal },
        icon('close'),
    );
    const card = h(
        'div',
        { class: `modal-card ${variant}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
        closeBtn,
        h('h2', { id: titleId, class: `modal-title${hideTitle ? ' visually-hidden' : ''}` }, title),
        h('div', { class: 'modal-body' }, content),
    );
    const root = h('div', { class: `modal-backdrop ${variant}` }, card);
    root.addEventListener('click', (e) => {
        if (e.target === root) closeModal();
    });
    getElement('modal-root').append(root);
    current = { root, onClose, returnFocus: document.activeElement };
    document.addEventListener('keydown', onKey, true);
    (card.querySelector<HTMLElement>('[data-autofocus]') ?? closeBtn).focus();
}
