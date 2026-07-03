const CACHE_NAME = 'bored-arcade-v1';
const APP_SHELL = [
    './',
    './index.html',
    './app-shell.js',
    './manifest.webmanifest',
    './icon-192.svg',
    './icon-512.svg',
    './snake.html',
    './snake.css',
    './snake.js',
    './tetris.html',
    './tetris.css',
    './tetris.js',
    './pong.html',
    './invaders.html',
    './minesweeper.html',
    './flappy.html',
    './breakout.html',
    './2048.html',
    './asteroids.html',
    './simon.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    if (request.method !== 'GET') return;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;

            return fetch(request)
                .then((networkResponse) => {
                    if (networkResponse.ok) {
                        const clone = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
                    }
                    return networkResponse;
                })
                .catch(() => cachedResponse);
        })
    );
});
