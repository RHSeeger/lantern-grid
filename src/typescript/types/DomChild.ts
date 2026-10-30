/**
 * Defines the DomChild type: something that can be put inside an element made with h().
 */

/**
 * Something that can be put inside an element made with h(): a node, text, a number, a list of them, or nothing
 * (null, undefined and false are skipped, so `cond && h(...)` works).
 */
export type DomChild = Node | string | number | null | undefined | false | DomChild[];
