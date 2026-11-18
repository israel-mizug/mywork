// Offline support. Caches only the app files, never customer data.
const CACHE = 'israel-ac-v1.0.0';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './logo.png', './icon-180.png', './icon-192.png', './icon-512.png', './icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// Fresh copy first so updates arrive. On a slow or missing connection, the saved copy opens right away.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const key = e.request.mode === 'navigate' ? './index.html' : e.request;
  const net = fetch(e.request, { cache: 'no-store' }).then(r => {
    if (!r.ok) return caches.match(key).then(c => c || r);
    const cp = r.clone();
    caches.open(CACHE).then(c => c.put(key, cp));
    return r;
  });
  const slow = new Promise(res => setTimeout(res, 2500)).then(() => caches.match(key));
  e.respondWith(
    Promise.race([net.catch(() => caches.match(key)), slow.then(r => r || net)])
      .then(r => r || caches.match('./index.html'))
  );
  e.waitUntil(net.catch(() => {}));
});
