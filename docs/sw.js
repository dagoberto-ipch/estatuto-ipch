/*
  Service worker del Estatuto IPCh.

  Precarga el libro entero para que abra sin internet. El texto son 295
  articulos dentro del propio HTML, asi que con una sola copia cached alcanza.

  Para forzar una version nueva hay que cambiar CACHE (subir el numero).
*/
const CACHE = 'estatuto-ipch-v1';

const APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cacheada) => {
      if (cacheada) {
        // Revalidar en segundo plano: una actualizacion del texto llega en la
        // siguiente apertura sin dejar de funcionar sin conexion.
        fetch(req).then((res) => {
          if (res && res.ok) {
            caches.open(CACHE).then((cache) => cache.put(req, res));
          }
        }).catch(() => {});
        return cacheada;
      }

      return fetch(req)
        .then((res) => {
          if (res && res.ok && res.type === 'basic') {
            const copia = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copia));
          }
          return res;
        })
        .catch(() => caches.match('./index.html'));
    })
  );
});