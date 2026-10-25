// Carte image du défi (share-card.js) et carte « Les autres jeux d'Aulit » (autres-jeux.js).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ShareCard = require('../share-card.js');
const AutresJeux = require('../autres-jeux.js');

const html = require('./page.js').source(); // index.html + css/ + js/, dans l'ordre de chargement

/** Faux contexte 2D : note les textes écrits, accepte tout le reste. */
function fauxCtx() {
  const textes = [];
  const ctx = new Proxy({ letterSpacing: '0px', textes }, {
    get(o, k) {
      if (k in o) return o[k];
      if (k === 'fillText') return (s, x, y) => textes.push({ s, x, y, font: o.font });
      if (k === 'measureText') return s => ({ width: String(s).length * 20 });
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      return () => {};
    },
    set(o, k, v) { o[k] = v; return true; },
  });
  return ctx;
}
const DONNEES = { n: 24, kicker: 'DÉFI DU JOUR #24', score: '7 420', eclats: [true, true, false],
  detail: '⏱ 1:42 · 7 échos', serie: '4 jours de suite', url: 'https://aulit42369.github.io/Echo/' };

test('carte 1080×1920 : nom du jeu, numéro, résultat, série et URL', () => {
  assert.equal(ShareCard.W, 1080); assert.equal(ShareCard.H, 1920);
  const ctx = fauxCtx();
  ShareCard.draw(ctx, DONNEES);
  const s = ctx.textes.map(t => t.s);
  for (const attendu of ['ÉCHO', 'DÉFI DU JOUR #24', '7 420', '⏱ 1:42 · 7 échos', '4 jours de suite', 'https://aulit42369.github.io/Echo/'])
    assert.ok(s.includes(attendu), attendu);
  for (const t of ctx.textes) assert.ok(t.y > 0 && t.y < 1920, 'texte dans la carte : ' + t.s);
  const sansSerie = fauxCtx();
  ShareCard.draw(sansSerie, { ...DONNEES, serie: '' });
  assert.ok(!sansSerie.textes.some(t => t.s === ''), 'pas de série affichée sous 2 jours');
});

test('texte trop long : la taille est réduite pour tenir dans la carte', () => {
  const ctx = fauxCtx();
  ShareCard.draw(ctx, { ...DONNEES, detail: 'x'.repeat(80) });
  const t = ctx.textes.find(e => e.s === 'x'.repeat(80));
  assert.ok(+t.font.match(/(\d+)px/)[1] < 42, t.font); // 42 px au départ
});

test('murs décoratifs : reproductibles pour un même défi', () => {
  assert.deepEqual(ShareCard.murs(24), ShareCard.murs(24));
  assert.notDeepEqual(ShareCard.murs(24), ShareCard.murs(25));
  for (const m of ShareCard.murs(7)) assert.ok(m[4] > 0 && m[4] <= 1);
});

function env(nav) {
  const journal = [];
  return { journal, nav, File: function (parts, nom, o) { this.name = nom; this.type = o.type; },
    URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} },
    doc: { createElement: () => ({ click() { journal.push('clic'); }, remove() {} }), body: { appendChild() {} } } };
}
const carte = { canvas: {}, blob: { size: 1 } };

test('partage image : fichier + texte via le partage natif', async () => {
  let recu = null;
  const e = env({ canShare: () => true, share: d => { recu = d; return Promise.resolve(); } });
  assert.equal(await ShareCard.share(carte, 'ÉCHO #24', 'echo-defi-24.png', e), 'partage');
  assert.equal(recu.text, 'ÉCHO #24');
  assert.equal(recu.files[0].name, 'echo-defi-24.png');
  assert.equal(recu.files[0].type, 'image/png');
});

test('partage image : annulé → null ; refusé ou indisponible → téléchargement', async () => {
  const abandon = env({ canShare: () => true, share: () => Promise.reject(Object.assign(new Error(), { name: 'AbortError' })) });
  assert.equal(await ShareCard.share(carte, 't', 'a.png', abandon), null);
  assert.deepEqual(abandon.journal, []);
  const refus = env({ canShare: () => true, share: () => Promise.reject(new Error('NotAllowed')) });
  assert.equal(await ShareCard.share(carte, 't', 'a.png', refus), 'telechargement');
  const sansFichier = env({ canShare: () => false, share: () => Promise.resolve() });
  assert.equal(await ShareCard.share(carte, 't', 'a.png', sansFichier), 'telechargement');
  assert.deepEqual(sansFichier.journal, ['clic']);
  assert.equal(await ShareCard.share(carte, 't', 'a.png', env({})), 'telechargement');
});

test('index.html : bouton image branché, verrou de partage commun', () => {
  assert.match(html, /<button id="defiImage" type="button"><\/button>/);
  assert.ok(html.includes("el('defiImage').addEventListener('click', partagerImage)"));
  assert.ok(/function partagerImage\(\) \{\s+if \(partageEnCours\) return;/.test(html));
  assert.ok(html.includes("'echo-defi-' + defiJour.n + '.png'"));
});

test('autres jeux : les 3 autres jeux, liens web exacts, ÉCHO absent', () => {
  assert.deepEqual(AutresJeux.JEUX.map(j => [j.nom, j.url, j.cle]), [
    ['LUMEN', 'https://lumen-jeu.github.io/', 'autresLumen'],
    ['Fragments', 'https://fragments-jeu.github.io/', 'autresFragments'],
    ['Résonance', 'https://resonance-jeu.github.io/', 'autresResonance'],
  ]);
  const src = fs.readFileSync(path.join(__dirname, '..', 'autres-jeux.js'), 'utf8');
  assert.ok(src.includes('à remplacer par le lien Play Store quand l\'appli sera publiée'));
  const T = JSON.parse(html.match(/const I18N = (\{.*\});\r?\n\/\/ <\/i18n:auto>/)[1]).t;
  assert.equal(T.autresLumen[0], 'Reliez les orbes, faites monter la lumière');
  assert.equal(T.autresFragments[0], 'Party game : chacun tient une pièce du dossier');
  assert.equal(T.autresResonance[0], 'Croise les ondes, allume les nœuds');
  assert.equal(T.autresTitre[0], "Les autres jeux d'Aulit");
});

test('autres jeux : visible seulement à l\'accueil, clavier du jeu ignoré dans le panneau', () => {
  assert.ok(html.includes('autres.maj(state === TITLE, lang);'));
  assert.ok(html.includes("e.target.closest('#defiFin, #autres, #autresBtn')"));
  assert.ok(html.includes('const autres = AutresJeux.init(document, window, L);'));
});
