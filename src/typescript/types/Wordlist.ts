/**
 * Defines the Wordlist type: the words that count, ready for tracing.
 */

/**
 * The words that count, ready for tracing.
 */
export type Wordlist = {
    /** Every word, for checking a traced word */
    set: Set<string>;
    /** Every word, sorted, so a search can tell when no word starts with what it has so far */
    sorted: string[];
};
