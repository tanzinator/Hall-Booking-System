var cacheName = 'Temporas';

// Cache all the files to make a PWA
self.addEventListener('install', e => {
  console.log("SERvice worker install")
  e.waitUntil(
    caches.open(cacheName).then(cache => {
      console.log("CACHE")
      // Our application only has two files here index.html and manifest.json
      // but you can add more such as style.css as your app grows
      return cache.addAll([
        '/',
        './admin/login'
      ]).then(function () {
        self.skipWaiting();
      });
    })
  );
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activate');
  e.waitUntil(
    caches.keys().then(function (keyList) {
      return Promise.all(keyList.map(function (key) {
        if (key !== cacheName) {
          console.log('[ServiceWorker] Removing old cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Our service worker will intercept all fetch requests
// and check if we have cached the file
// if so it will serve the cached file
self.addEventListener('fetch', event => {
  console.log("[Service Worker] fetch url: " + event.request.url);
  event.respondWith(
    caches.open(cacheName)
      .then(cache => cache.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        }))
  );
});