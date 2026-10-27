// ÉCHO — service worker : le jeu fonctionne hors ligne après la première visite.
// Change VERSION à chaque mise à jour pour forcer le rafraîchissement du cache.
const VERSION = 'echo-v2.4';
// Mêmes fichiers, même ordre que les balises de index.html (contrôlé par tests/chargement.test.js).
const JEU = ['i18n', 'reglages', 'labyrinthe', 'sons', 'appareil', 'etat', 'entrees', 'niveau', 'logique', 'echos', 'ombres',
  'rendu', 'ecrans', 'defi-ecran', 'boucle'].map(n => './js/' + n + '.js');
const FILES = ['./', './index.html', './css/echo.css', './defi.js', './share-card.js', './autres-jeux.js', ...JEU,
  './privacy.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('echo-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Réseau d'abord pour la page (mises à jour), cache d'abord pour le reste.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    // Seule une vraie page du jeu (200, racine ou index.html) remplace la copie hors ligne :
    // ni privacy.html ni une 404 de GitHub Pages ne doivent écraser './index.html'.
    const estJeu = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
    e.respondWith(fetch(e.request)
      .then(r => {
        if (r.ok && estJeu) { const copy = r.clone(); e.waitUntil(caches.open(VERSION).then(c => c.put('./index.html', copy))); }
        return r;
      })
      .catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
