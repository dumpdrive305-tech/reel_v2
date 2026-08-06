const CACHE = 'myreels-v2';
const ASSETS = [
  '/myreel/',
  '/myreel/index.html',
  '/myreel/manifest.json',
  '/myreel/icon-192.png',
  '/myreel/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Never cache: Telegram API, GitHub API, Google Fonts
  if (
    url.includes('api.telegram.org') ||
    url.includes('api.github.com') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) return;

  // Network first for HTML (always get latest app)
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache first for everything else (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
