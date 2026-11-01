/* Service worker Cosmo Commande : l'appli fonctionne 100 % hors ligne.
   Tous les chemins sont relatifs : l'appli peut être servie sous un sous-chemin (ex. /cosmo/). */
const CACHE_VERSION = 'v1'; // À INCRÉMENTER à chaque release (v2, v3...) pour que les téléphones se mettent à jour
const SHELL_CACHE = `cosmo-shell-${CACHE_VERSION}`;
const FONT_CACHE = 'cosmo-fonts'; // polices Google : conservées d'une version à l'autre

const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'pricing.js',
  'menu.json',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(c => c.addAll(SHELL.map(u => new Request(u, {cache: 'reload'}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(k => k !== SHELL_CACHE && k !== FONT_CACHE)
        .map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const isFont = url => url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';

/* Stale-while-revalidate : répond tout de suite avec le cache, met à jour en arrière-plan. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(res => { if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()); return res; })
    .catch(() => null);
  if (cached) return cached;
  return (await network) || Response.error(); // polices absentes : le CSS retombe sur les polices système
}

/* Cache-first pour l'app shell. */
async function cacheFirst(request) {
  const cached = await caches.match(request, {ignoreSearch: true});
  if (cached) return cached;
  try {
    return await fetch(request);
  } catch (err) {
    if (request.mode === 'navigate') return (await caches.match('index.html')) || Response.error();
    throw err;
  }
}

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isFont(url)) event.respondWith(staleWhileRevalidate(request));
  else if (url.origin === self.location.origin) event.respondWith(cacheFirst(request));
});
