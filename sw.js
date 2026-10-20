const CACHE = 'manual-ges-v2';
// Rutas relativas: el sitio vive en /manual-ges/ (GitHub Pages), no en la raíz del dominio
const BASICOS = ['./', './index.html', './manifest.json', './manual.xlsx'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASICOS)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
// Red primero: siempre se intenta traer la versión nueva; la copia guardada solo se usa sin conexión.
// ignoreSearch evita guardar una copia distinta de manual.xlsx por cada ?v=...
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(fetch(e.request).then(resp => {
    if (resp && resp.status === 200) {
      const clone = resp.clone();
      const clave = new URL(e.request.url); clave.search = '';
      caches.open(CACHE).then(c => c.put(clave.href, clone));
    }
    return resp;
  }).catch(() => caches.match(e.request, {ignoreSearch:true})
    .then(r => r || caches.match('./index.html'))));
});
