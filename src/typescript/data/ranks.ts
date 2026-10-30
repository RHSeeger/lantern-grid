import type { Rank } from '../types/Rank';

/**
 * The ranks: names for how much of the grid is lit, lowest first.
 */

/** The ranks, by the fraction of squares lit */
export const RANKS: Rank[] = [
    { name: 'Dark', min: 0 },
    { name: 'Flicker', min: 0.01 },
    { name: 'Glimmer', min: 0.25 },
    { name: 'Glow', min: 0.5 },
    { name: 'Shine', min: 0.7 },
    { name: 'Radiant', min: 0.85 },
    { name: 'All Aglow', min: 1 },
];
