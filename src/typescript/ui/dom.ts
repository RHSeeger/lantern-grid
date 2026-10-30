import type { DomChild } from '../types/DomChild';

/**
 * Small helpers for building the page's elements, and the icons used on its buttons.
 */

/** The icons, as SVG markup; they draw in the text color */
export const ICONS = {
    hint: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    yesterday:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    stats: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    settings:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    help: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6v.6M12 17h.01" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    shuffle:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    chevron:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/**
 * Adds children to an element, skipping null, undefined and false, and flattening lists.
 *
 * @param el - The element (changed in place)
 * @param children - What to add
 */
function append(el: Node, children: DomChild[]): void {
    for (const c of children) {
        if (c == null || c === false) continue;
        if (Array.isArray(c)) append(el, c);
        else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
    }
}

/**
 * Makes an element.
 *
 * @param tag - The tag name
 * @param attrs - Its attributes. 'class' sets the class, 'style' can be an object, 'on<event>' adds an event listener,
 *   and null, undefined and false are skipped (true sets an empty attribute)
 * @param children - What goes inside it
 * @returns The element
 */
export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    attrs: Record<string, unknown> = {},
    ...children: DomChild[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = String(v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v as EventListener);
        else el.setAttribute(k, v === true ? '' : String(v));
    }
    append(el, children);
    return el;
}

/**
 * Makes an element from markup (used for the SVG icons).
 *
 * @param markup - The markup for a single element
 * @returns The element
 */
export function svg(markup: string): Element {
    const t = document.createElement('template');
    t.innerHTML = markup.trim();
    return t.content.firstElementChild as Element;
}

/**
 * Removes everything inside an element.
 *
 * @param el - The element (changed in place)
 * @returns The same element
 */
export function clear<T extends Element>(el: T): T {
    while (el.firstChild) el.removeChild(el.firstChild);
    return el;
}

/**
 * Makes one of the icons.
 *
 * @param name - Which icon
 * @returns The SVG element
 */
export function icon(name: keyof typeof ICONS): Element {
    return svg(ICONS[name]);
}

/**
 * Capitalizes a word for display.
 *
 * @param w - The word
 * @returns The word with its first letter uppercase
 */
export function cap(w: string): string {
    return w.charAt(0).toUpperCase() + w.slice(1);
}

/**
 * Restarts a CSS animation that is triggered by a class (removing and re-adding the class).
 *
 * @param el - The element
 * @param className - The class that starts the animation
 */
export function restartAnimation(el: Element, className: string): void {
    el.classList.remove(className);
    void (el as HTMLElement).offsetWidth; // forces a reflow, so the animation starts again
    el.classList.add(className);
}
