/**
 * Defines the ToastOptions type: how a toast (a short pop-up message) behaves.
 */

/**
 * How a toast behaves.
 */
export type ToastOptions = {
    /** How long it shows, in milliseconds; 0 keeps it until dismissed (and skips the queue) */
    duration?: number;
    /** A button on the toast, which dismisses it when pressed */
    action?: { label: string; onClick: () => void } | null;
    /** An extra class for styling */
    className?: string;
};
