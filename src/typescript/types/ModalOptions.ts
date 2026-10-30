import type { DomChild } from './DomChild';

/**
 * Defines the ModalOptions type: what a modal (a screen shown over the game) contains.
 */

/**
 * What a modal contains, and how it looks.
 */
export type ModalOptions = {
    /** The heading */
    title: string;
    /** The body */
    content: DomChild;
    /** Called after it closes */
    onClose?: () => void;
    /** A styling variant: '' (a card), 'splash' (the full-screen welcome) or 'celebrate' */
    variant?: '' | 'splash' | 'celebrate';
    /** Hide the heading visually (it is still read by screen readers) */
    hideTitle?: boolean;
};
