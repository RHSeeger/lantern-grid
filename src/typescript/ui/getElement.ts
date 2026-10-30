/**
 * Looks up elements in the page that the UI expects to exist.
 */

/**
 * Returns the element with the given id.
 *
 * @param id - The element's id
 * @returns The element
 * @throws If there is no element with that id (the page and the code are out of sync)
 */
export function getElement(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (element === null) {
        throw new Error(`Expected an element with id "${id}" in the page`);
    }
    return element;
}
