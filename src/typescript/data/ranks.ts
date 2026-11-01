import type { Rank } from '../types/Rank';

/**
 * The ranks: names for how much of the List's points have been found, lowest first. The names come from industrial
 * lighting and its codes. The points are chosen so that, on their own, a player gets to Task Light most days and Up to
 * Code on a good day; a family gets to Exceeds Code on many days, and Full Output (every word) is rare.
 */

/** The ranks, by the fraction of the List's points found */
export const RANKS: Rank[] = [
    { name: 'Dark', min: 0 },
    { name: 'Standby', min: 0.01 },
    { name: 'Egress', min: 0.1 },
    { name: 'Ambient', min: 0.2 },
    { name: 'Task Light', min: 0.3 },
    { name: 'Up to Code', min: 0.4 },
    { name: 'High Bay', min: 0.55 },
    { name: 'Exceeds Code', min: 0.7 },
    { name: 'Daylight', min: 0.9 },
    { name: 'Full Output', min: 1 },
];
