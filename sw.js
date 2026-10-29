// ÉCHO a déménagé sur https://echo-jeu.github.io/ : ce service worker remplace l'ancien jeu hors ligne.
// Il vide UNIQUEMENT les caches « echo-* » (l'origine aulit42369.github.io est partagée avec le Site et Cra),
// se désinscrit, puis recharge les onglets ouverts : ils reçoivent alors la page de renvoi depuis le réseau.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('echo-')).map(k => caches.delete(k))))
    .then(() => self.registration.unregister())
    .then(() => self.clients.matchAll({ type: 'window' }))
    .then(clients => Promise.all(clients.map(c => c.navigate(c.url).catch(() => {})))));
});
