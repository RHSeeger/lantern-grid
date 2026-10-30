/**
 * Defines the PlayerColor type: one of the colors a family player can pick.
 */

/**
 * A color a family player can pick. Its value is the CSS token `--player-<id>` (with light and dark values).
 */
export type PlayerColor = {
    /** Saved with the player, and used in the CSS token's name */
    id: string;
    /** Shown to the player */
    name: string;
};
