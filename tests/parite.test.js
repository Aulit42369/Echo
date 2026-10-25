// Parité web ↔ Android : vecteurs de référence calculés avec le code de la PWA (defi.js + js/labyrinthe.js).
// Le même fichier parite-android.json est copié dans l'appli Android (app/src/test/resources/) et rejoué par PariteTest.kt.
// Régénérer après un changement voulu : MAJ_PARITE=1 node --test   (puis recopier le fichier côté Android).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Defi = require('../defi.js');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'labyrinthe.js'), 'utf8');
const { mulberry32, shuffle, Maze } = new Function(code + '\nreturn { mulberry32, shuffle, Maze };')();

function vecteurs() {
  const jours = ['2026-10-01T12:00:00+02:00', '2026-10-25T00:30:00+02:00', '2026-10-25T23:30:00+01:00', '2027-03-28T01:30:00+01:00', '2030-07-14T09:00:00+02:00'];
  return {
    jours: jours.map(iso => {
      const ms = Date.parse(iso), j = Defi.today(ms), graine = Defi.seed('echo', j.key);
      const r = mulberry32(graine), tirages = [];
      for (let i = 0; i < 8; i++) tirages.push(r());
      const m = new Maze(12, 18, mulberry32(graine));
      const melange = shuffle([...Array(20).keys()], mulberry32(graine));
      return { ms, key: j.key, num: j.num, n: j.n, day: j.day, graine, tirages, cells: Array.from(m.cells), melange };
    }),
    fnv: ['', 'echo', 'ÉCHO', 'echo:2026-10-24', '日本語🦇'].map(s => [s, Defi.fnv1a(s)]),
    partages: [
      { nom: 'ÉCHO', n: 24, emoji: '🦇', score: '7 420', lignes: Defi.grid([1, 1, 0], ['▫️', '💎']), detail: '⏱ 1:42 · 7 échos', serie: 4, libelleSerie: '{0} jours de suite', url: 'https://aulit42369.github.io/Echo/' },
      { nom: 'ÉCHO', n: 1, emoji: '🦇', score: '0', lignes: Defi.grid([0, 0, 0], ['▫️', '💎']), detail: '⏱ 9:59 · 40 echoes', serie: 1, libelleSerie: '{0} days in a row', url: 'https://aulit42369.github.io/Echo/?x=1#y' },
      { nom: 'ÉCHO', n: 400, emoji: '🦇', score: '12 000', lignes: ['💎'.repeat(10), '💎'.repeat(10), '💎'.repeat(10), '💎'.repeat(10), '💎'.repeat(10)], detail: 'x'.repeat(120), serie: 12, libelleSerie: '{0}日連続', url: 'https://aulit42369.github.io/Echo/' },
    ].map(o => ({ o, texte: Defi.shareText(o) })),
  };
}

test('vecteurs de parité Android à jour', () => {
  const fichier = path.join(__dirname, 'parite-android.json');
  const v = vecteurs();
  if (process.env.MAJ_PARITE) fs.writeFileSync(fichier, JSON.stringify(v, null, 1) + '\n');
  assert.deepEqual(JSON.parse(fs.readFileSync(fichier, 'utf8')), v,
    'le défi web a changé : MAJ_PARITE=1 node --test, puis recopier tests/parite-android.json dans app/src/test/resources/ (Android)');
});

test('le labyrinthe du jour dépend seulement de la date de Paris', () => {
  const a = vecteurs().jours;
  assert.equal(a[1].key, '2026-10-25');
  assert.equal(a[2].key, '2026-10-25'); // 23 h 30 à Paris, heure d'hiver
  assert.deepEqual(a[1].cells, a[2].cells);
  assert.notDeepEqual(a[0].cells, a[1].cells);
});
