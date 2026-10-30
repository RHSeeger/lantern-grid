import type { DomChild } from './DomChild';

/**
 * Defines the ScoreRow type: one row of the Compare screen's table.
 */

/**
 * One row of the Compare screen's table: a family member's results for the day, or the family's together.
 */
export type ScoreRow = {
    /** Who it is ("Together" for the family's row) */
    name: string;
    /** Their color (a PlayerColor id), or '' for the family's row */
    color: string;
    /** True for the player's own row */
    isMe: boolean;
    /** One value per column */
    values: DomChild[];
};
