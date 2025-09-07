// Name of the cache
const CACHE_NAME = "taskify-cache-v1";

// Files to cache (add your CSS, JS, fonts, and images here)
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "/styles.css",
  "/script.js",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

// Install service worker & cache files
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Caching app shell...");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate service worker & clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      )
    )
  );
});

// Fetch: serve cached files if offline
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).catch(() =>
          caches.match("/index.html") // fallback
        )
      );
    })
  );
});
