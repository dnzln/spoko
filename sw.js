const CACHE = 'kpk-v3';

const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'manifest.webmanifest',
  'geiger.mp3',
  'beep.mp3',
  'whispers.mp3',
  'img/player.png',
  'img/stash.png',
  'img/anomaly.svg',
  'img/rad.webp',
  'img/icon-192.png',
  'img/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  const isOwnAsset = url.origin === self.location.origin || url.origin === 'https://unpkg.com';

  if (request.method !== 'GET' || !isOwnAsset) {
    return;
  }

  if (request.headers.has('range')) {
    event.respondWith(serveRange(request));
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.status === 200 && response.type !== 'opaque') {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request, { ignoreSearch: true }))
  );
});

async function serveRange(request) {
  const cached = await caches.match(request.url, { ignoreSearch: true });
  if (!cached) {
    return fetch(request);
  }

  const blob = await cached.blob();
  const match = /bytes=(\d*)-(\d*)/.exec(request.headers.get('range') || '');
  let start = 0;
  let end = blob.size - 1;

  if (match && match[1]) {
    start = Number(match[1]);
    if (match[2]) {
      end = Math.min(Number(match[2]), blob.size - 1);
    }
  } else if (match && match[2]) {
    start = Math.max(0, blob.size - Number(match[2]));
  }

  if (start > end) {
    return new Response(null, {
      status: 416,
      headers: { 'Content-Range': `bytes */${blob.size}` }
    });
  }

  return new Response(blob.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Length': String(end - start + 1),
      'Content-Range': `bytes ${start}-${end}/${blob.size}`,
      'Accept-Ranges': 'bytes'
    }
  });
}
