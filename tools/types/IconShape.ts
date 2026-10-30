/**
 * Defines the IconShape type: one rounded rectangle in an app icon.
 */

/**
 * One rounded rectangle in an app icon, in a 1 x 1 square (0,0 is the top left).
 */
export type IconShape = {
    /** Its color, as [red, green, blue] (0-255) */
    color: number[];
    /** Its left edge */
    x: number;
    /** Its top edge */
    y: number;
    /** Its width */
    w: number;
    /** Its height */
    h: number;
    /** How rounded its corners are */
    r: number;
};
