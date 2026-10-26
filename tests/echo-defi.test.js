// Contrôles propres à ÉCHO pour le défi du jour (contrôles statiques sur toute la page + exécution des textes).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Defi = require('../defi.js');

const racine = path.join(__dirname, '..');
const html = require('./page.js').source(); // index.html + css/ + js/, dans l'ordre de chargement
const sw = fs.readFileSync(path.join(racine, 'sw.js'), 'utf8');

// Depuis le 25/10/2026, tous les textes (défi compris) viennent du bloc généré depuis i18n/strings.json.
function textes() {
  const m = html.match(/const I18N = (\{.*\});\r?\n\/\/ <\/i18n:auto>/);
  assert.ok(m, 'bloc <i18n:auto> introuvable');
  return JSON.parse(m[1]).t;
}
const CLES_DEFI = ['defiAFaire', 'defiFait', 'defiSerie', 'defiSerieTxt', 'defiProchain', 'defiDetail', 'defiPartager', 'defiPartage',
  'defiCopie', 'defiManuel', 'defiCopieLabel', 'defiResume', 'sDefiFin', 'defiImage', 'defiImageOk', 'defiImageErr',
  'legal', 'autresBouton', 'autresTitre', 'autresLumen', 'autresFragments', 'autresResonance', 'autresOuvrir'];
function textesDefi() { const T = textes(); return Object.fromEntries(CLES_DEFI.map(k => [k, T[k]])); }
const nbLangues = (html.match(/"langs":\[(.*?)\]/)[1].match(/"code"/g) || []).length;

test('service worker : version echo-v2.2, modules en cache', () => {
  assert.match(sw, /const VERSION = 'echo-v2.2';/);
  for (const f of ['defi.js', 'share-card.js', 'autres-jeux.js']) {
    assert.ok(sw.includes("'./" + f + "'"), f + ' en cache');
    assert.ok(html.includes('<script src="' + f + '"></script>'), f + ' chargé');
  }
  assert.ok(sw.includes("k.startsWith('echo-')"), 'le SW ne supprime que ses caches');
});

test('graine et date du défi : module commun, heure de Paris', () => {
  assert.ok(!/todaySeed|getFullYear\(\)/.test(html), "plus de date locale de l'appareil");
  assert.ok(html.includes("Defi.seed('echo', defiJour.key)"));
  assert.ok(html.includes("store.get('daily_' + defiJour.num, 0)"), 'clé de record existante echo_daily_AAAAMMJJ conservée');
  assert.ok(html.includes("Defi.record('echo', defiJour"));
  assert.ok(html.includes("const URL_JEU = 'https://aulit42369.github.io/Echo/';"));
  assert.ok(!html.includes('location.href'));
  // même graine pour une date donnée, quel que soit le moment de la journée à Paris
  const a = Defi.seed('echo', Defi.today('2026-10-24T00:30:00+02:00').key);
  const b = Defi.seed('echo', Defi.today('2026-10-24T23:59:00+02:00').key);
  assert.equal(a, b);
  assert.equal(a, -865318257);
});

test('textes du défi traduits dans toutes les langues, mêmes marqueurs', () => {
  const T = textesDefi();
  assert.equal(nbLangues, 7);
  for (const [cle, tr] of Object.entries(T)) {
    assert.equal(tr.length, nbLangues, cle);
    const ref = (tr[0].match(/\{\d\}/g) || []).sort().join();
    tr.forEach((s, i) => { assert.ok(s, cle + ' vide [' + i + ']'); assert.equal((s.match(/\{\d\}/g) || []).sort().join(), ref, cle + ' [' + i + ']'); });
  }
  assert.ok(!html.includes('I18N_DEFI') && !html.includes('Object.assign(I18N.t'), 'plus de textes écrits à la main hors du bloc généré');
  for (const cle of ['defiPartager', 'defiPartage', 'defiCopie', 'defiManuel', 'defiSerie', 'defiProchain', 'sDefiFin'])
    assert.ok(html.includes("'" + cle + "'"), cle + ' inutilisé');
});

test('texte partagé ÉCHO (format de la spécification)', () => {
  const T = textesDefi();
  const L = (k, ...a) => a.reduce((r, v, i) => r.split('{' + i + '}').join(String(v)), T[k][0]);
  const texte = Defi.shareText({ nom: 'ÉCHO', n: 24, emoji: '🦇', score: '7 420',
    lignes: Defi.grid([1, 1, 0, 1, 0], ['▫️', '💎']), detail: L('defiDetail', '1:42', 7),
    serie: 4, libelleSerie: L('defiSerieTxt'), url: 'https://aulit42369.github.io/Echo/' });
  assert.equal(texte, 'ÉCHO #24 🦇 7 420\n💎💎▫️💎▫️\n⏱ 1:42 · 7 échos\n🔥 4 jours de suite\nhttps://aulit42369.github.io/Echo/');
});

test('accessibilité du panneau de fin', () => {
  assert.match(html, /<button id="defiPartager" type="button">/);
  assert.match(html, /id="defiEtat" role="status" aria-live="polite"/);
  assert.match(html, /<label id="defiLabel" for="defiTexte"><\/label><textarea id="defiTexte" readonly/);
  assert.match(html, /#defiPartager \{ min-height: 52px;/);
  assert.match(html, /prefers-reduced-motion: reduce/);
  assert.ok(html.includes("k === 'p'"), 'raccourci P');
});

test('partage : touche P répétée ignorée, un seul partage à la fois', () => {
  assert.ok(html.includes("k === 'p') { if (!e.repeat) partager(); return; }"), 'répétition de P ignorée');
  assert.ok(/function partager\(\) \{\s+if \(partageEnCours\) return;\s+partageEnCours = true;/.test(html), 'verrou de partage');
  assert.ok(html.includes('.finally(() => { partageEnCours = false; })'), 'verrou relâché même après annulation');
});
