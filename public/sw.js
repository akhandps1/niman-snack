// Basic Service Worker for PWA Installation Compliance

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // A minimal fetch listener is required by some browsers to pass PWA criteria.
  // This just passes the request through without doing any offline caching for now.
  return;
});
