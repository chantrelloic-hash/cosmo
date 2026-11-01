/* Service worker Cosmo Commande : l'appli fonctionne 100 % hors ligne.
   Tous les chemins sont relatifs : l'appli peut être servie sous un sous-chemin (ex. /cosmo/). */
const CACHE_VERSION = 'v4'; // À INCRÉMENTER à chaque release (v2, v3...) pour que les téléphones se mettent à jour
const SHELL_CACHE = `cosmo-shell-${CACHE_VERSION}`;
const FONT_CACHE = 'cosmo-fonts'; // polices Google : conservées d'une version à l'autre
const IMAGE_CACHE = 'cosmo-images'; // photos des produits (images/) : mises en cache à la première utilisation
const MENU_TIMEOUT = 2000; // menu.json : au-delà de 2 s sans réponse du réseau, on sert la copie en cache

const SHELL = [
  './',
  'index.html',
  'styles.css',
  'app.js',
  'pricing.js',
  'store.js',
  'i18n.js',
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
        .filter(k => k !== SHELL_CACHE && k !== FONT_CACHE && k !== IMAGE_CACHE)
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

/* menu.json : réseau d'abord (une carte à jour dès que le téléphone est en ligne, sans nouvelle version
   de l'appli), repli sur la copie en cache si le réseau est absent ou met plus de MENU_TIMEOUT à répondre.
   La requête réseau continue en arrière-plan et met le cache à jour même après le délai. */
async function menuNetworkFirst(event) {
  const {request} = event;
  const cache = await caches.open(SHELL_CACHE);
  const network = fetch(request, {cache: 'no-cache'}).then(res => {
    if (res.ok) cache.put('menu.json', res.clone());
    return res;
  });
  event.waitUntil(network.catch(() => null));
  const timeout = new Promise(resolve => setTimeout(() => resolve(null), MENU_TIMEOUT));
  const first = await Promise.race([network.catch(() => null), timeout]);
  if (first && first.ok) return first;
  const cached = await cache.match('menu.json');
  if (cached) return cached;
  return first || network; // pas de copie : on attend le réseau (ou l'erreur)
}

/* Photos des produits : cache-first, remplies à la première utilisation (puis disponibles hors ligne).
   Une image absente (404) n'est pas mise en cache : l'appli retombe sur le picto. */
async function imageCacheFirst(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', event => {
  const {request} = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isFont(url)) event.respondWith(staleWhileRevalidate(request));
  else if (url.origin !== self.location.origin) return;
  else if (url.pathname.endsWith('/menu.json')) event.respondWith(menuNetworkFirst(event));
  else if (/\/images\/[^/]+\.(webp|jpe?g|png|avif|gif|svg)$/i.test(url.pathname)) event.respondWith(imageCacheFirst(request));
  else event.respondWith(cacheFirst(request));
});
