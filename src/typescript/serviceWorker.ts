import { OFFLINE_FILES, STORAGE_PREFIX } from './data/app';

/**
 * The service worker (built to dist/sw.js): keeps a copy of the game so it works offline and opens fast. Each build
 * gets a new cache name (__BUILD_VERSION__), so a deploy installs a new worker; the page then offers "Update
 * available — Reload" (see registerServiceWorker() in app.ts). Only this site's own files are cached, never other
 * sites' traffic (such as Firebase). The games share a web address, so this game's caches are named with its own
 * prefix, and only those are ever cleared or searched.
 */

/** The start of this game's cache names */
const CACHE_PREFIX = `${STORAGE_PREFIX.replace(/:$/, '')}-`;

/** The cache for this build */
const CACHE = `${CACHE_PREFIX}${__BUILD_VERSION__}`;

/** The files the game needs, fetched when the worker installs */
const SHELL = [
    './',
    'index.html',
    'app.bundle.js',
    'manifest.webmanifest',
    'icons/icon.svg',
    'icons/icon-192.png',
    'icons/icon-512.png',
    'icons/apple-touch-icon.png',
    ...OFFLINE_FILES,
];

/**
 * The parts of the service worker's global scope used here. (The full types are in TypeScript's "webworker" library,
 * which can't be loaded alongside the DOM library the rest of the game uses.)
 */
const sw = self as unknown as {
    addEventListener(type: string, listener: (event: any) => void): void;
    skipWaiting(): Promise<void>;
    clients: { claim(): Promise<void> };
    location: Location;
};

sw.addEventListener('install', (event) => {
    event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
});

sw.addEventListener('activate', (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k))),
            )
            .then(() => sw.clients.claim()),
    );
});

sw.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') void sw.skipWaiting();
});

sw.addEventListener('fetch', (event) => {
    const req: Request = event.request;
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== sw.location.origin) return;
    event.respondWith(
        caches.open(CACHE).then((cache) =>
            cache.match(req, { ignoreSearch: true }).then(
                (hit) =>
                    hit ??
                    fetch(req)
                        .then((res) => {
                            if (res.ok && res.type === 'basic') void cache.put(req, res.clone());
                            return res;
                        })
                        .catch(async () =>
                            req.mode === 'navigate'
                                ? ((await cache.match('index.html')) ?? Response.error())
                                : Response.error(),
                        ),
            ),
        ),
    );
});

// Makes this file a module, so its constants don't become globals for the rest of the program
export {};
