// Ancienne adresse : le SW ne supprime que les caches echo-*, se désinscrit et recharge les onglets ; les pages renvoient.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lire = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('sw.js : supprime seulement echo-*, se désinscrit, recharge', async () => {
  const supprimes = [], ecouteurs = {}, recharges = [];
  let desinscrit = false;
  const self = {
    addEventListener: (t, f) => { ecouteurs[t] = f; }, skipWaiting: () => Promise.resolve(),
    registration: { unregister: async () => { desinscrit = true; return true; } },
    clients: { matchAll: async () => [{ url: 'https://aulit42369.github.io/Echo/', navigate: async u => recharges.push(u) }] },
  };
  const caches = { keys: async () => ['echo-v2.5', 'site-v3', 'cra-v1', 'zz-echo-x'], delete: async k => { supprimes.push(k); return true; } };
  vm.runInContext(lire('sw.js'), vm.createContext({ self, caches }));
  let p; ecouteurs.activate({ waitUntil: x => { p = x; } }); await p;
  assert.deepEqual(supprimes, ['echo-v2.5']);
  assert.ok(desinscrit);
  assert.deepEqual(recharges, ['https://aulit42369.github.io/Echo/']);
});

test('pages : renvoi vers la même page sur echo-jeu.github.io', () => {
  for (const [f, cible] of [['index.html', '/'], ['privacy.html', '/privacy.html'], ['404.html', '/']]) {
    const html = lire(f);
    assert.ok(html.includes(`rel="canonical" href="https://echo-jeu.github.io${cible}"`), f);
    assert.ok(html.includes(`content="0; url=https://echo-jeu.github.io${cible}"`), f);
    assert.match(html, /ÉCHO a déménagé/);
    const js = html.match(/<script>([\s\S]*?)<\/script>/)[1];
    for (const [chemin, attendu] of [['/Echo/', '/'], ['/Echo', '/'], ['/Echo/privacy.html', '/privacy.html'], ['/Echo/a/b', '/a/b']]) {
      let va = null;
      vm.runInNewContext(js, { location: { pathname: chemin, search: '?x=1', hash: '#y', replace: u => { va = u; } } });
      assert.equal(va, 'https://echo-jeu.github.io' + attendu + '?x=1#y');
    }
  }
});
