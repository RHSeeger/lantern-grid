/**
 * Defines the PlayerProfile type: the name and color a player uses in a family.
 */

/**
 * The name and color a player uses in a family. The last ones used are remembered as the default for the next family.
 */
export type PlayerProfile = {
    /** Their name (up to MAX_PLAYER_NAME characters) */
    name: string;
    /** Their color (a PlayerColor id) */
    color: string;
};
