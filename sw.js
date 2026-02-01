const CACHE_NAME = "attendance-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/setup.html",
  "/tracker.html",
  "/styles.css",
  "/setup.js",
  "/tracker.js",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then(
      (cached) => cached || fetch(event.request)
    )
  );
});
