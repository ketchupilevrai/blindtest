/* Service worker : reseau d'abord pour les pages, cache en secours hors ligne.
   Un cache-first servirait eternellement l'ancienne version. */
const CACHE = 'blindtest-v1';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./', './index.html', './manifest.json'])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // les extraits audio iTunes ne passent pas par le cache
  if (url.hostname.endsWith('itunes.apple.com') || url.hostname.endsWith('mzstatic.com')) return;
  e.respondWith(
    fetch(req).then(r => {
      if (url.origin === location.origin) {
        const copie = r.clone();
        caches.open(CACHE).then(c => c.put(req, copie));
      }
      return r;
    }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
  );
});

self.addEventListener('controllerchange', () => {
  if (!sessionStorage.getItem('sw-maj')) {
    sessionStorage.setItem('sw-maj', '1');
    location.reload();
  }
});
