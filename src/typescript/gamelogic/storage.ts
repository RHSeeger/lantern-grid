import { STORAGE_PREFIX } from '../data/app';

/**
 * localStorage / sessionStorage helpers. Every access is wrapped in try/catch: the game must still work (just
 * without remembering anything) when storage is unavailable, such as in some private browsing modes.
 */

/**
 * Returns the browser storage to use, if it is available.
 *
 * @param kind - 'local' (kept) or 'session' (kept until the tab closes)
 * @returns The storage, or null
 */
function store(kind: 'local' | 'session'): Storage | null {
    try {
        return kind === 'session' ? window.sessionStorage : window.localStorage;
    } catch {
        return null;
    }
}

/**
 * Reads a saved value.
 *
 * @param key - The key (without the prefix)
 * @param fallback - What to return if nothing is saved, or it can't be read
 * @param kind - Which storage to use
 * @returns The saved value, or the fallback
 */
export function getJSON<T>(key: string, fallback: T, kind: 'local' | 'session' = 'local'): T {
    try {
        const raw = store(kind)?.getItem(STORAGE_PREFIX + key);
        return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
        return fallback;
    }
}

/**
 * Saves a value.
 *
 * @param key - The key (without the prefix)
 * @param value - The value; it must survive JSON
 * @param kind - Which storage to use
 * @returns True if it was saved
 */
export function setJSON(key: string, value: unknown, kind: 'local' | 'session' = 'local'): boolean {
    try {
        const s = store(kind);
        if (!s) return false;
        s.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
    } catch {
        return false;
    }
}

/**
 * Deletes a saved value.
 *
 * @param key - The key (without the prefix)
 * @param kind - Which storage to use
 */
export function remove(key: string, kind: 'local' | 'session' = 'local'): void {
    try {
        store(kind)?.removeItem(STORAGE_PREFIX + key);
    } catch {
        /* ignore */
    }
}
