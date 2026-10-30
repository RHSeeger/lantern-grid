import type { FoundPath } from './FoundPath';

/**
 * Defines the PlayerDay type: one player's play on one day.
 */

/**
 * One player's play on one day: saved in localStorage (`day:<YYYY-MM-DD>`) in local play, and in Firebase
 * (`games/lantern/<fid>/<day>/<uid>`) in family play.
 */
export type PlayerDay = {
    /** The day key */
    day: string;
    /** The words traced, in the order found */
    found: FoundPath[];
    /** Whether the hints were turned on */
    hints: boolean;
};
