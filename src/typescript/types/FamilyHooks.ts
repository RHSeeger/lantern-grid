/**
 * Defines the FamilyHooks type: what the game does for family play.
 */

/**
 * What the game does for family play. familyController.ts calls these, so it never needs to import the game itself.
 */
export type FamilyHooks = {
    /** Redraws everything */
    render: () => void;
    /** Takes in a new version of the family's day (first is true when the day has just arrived, or changed) */
    dataChanged: (first: boolean) => void;
    /** Hides the board and shows a message (while connecting, or if connecting failed) */
    showConnecting: (text: string) => void;
    /** Shows the board again */
    showReady: () => void;
    /** Opens the welcome screen */
    openSplash: () => void;
    /** Opens today's local play (after switching to playing on your own) */
    openLocal: () => void;
    /** Flashes a short message above the board */
    flash: (text: string) => void;
};
