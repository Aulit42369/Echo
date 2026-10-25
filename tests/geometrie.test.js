// Vecteurs de géométrie web → Android : labyrinthe, distances, sortie la plus lointaine (farCell), ligne de vue, écho réaliste, cône.
// Calculés avec js/labyrinthe.js + js/echos.js ; geometrie-android.json est recopié dans app/src/test/resources/ et rejoué par GeometrieTest.kt.
// Régénérer après un changement voulu : MAJ_PARITE=1 node --test   (puis recopier le fichier côté Android).
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { lire } = require('./page.js');

const c = vm.createContext({});
for (const f of ['js/reglages.js', 'js/labyrinthe.js', 'js/echos.js']) vm.runInContext(lire(f), c, { filename: f });
const G = vm.runInContext('({ mulberry32, Maze, segCross, segDist, losClear, wallVisible, wallInCone, hypot })', c);
// farCell vient de js/niveau.js (qui demande l'état du jeu au chargement) : on n'en extrait que la fonction et ses aides.
const niveau = lire('js/niveau.js');
const morceau = re => niveau.match(re)[0];
const farCell = vm.runInContext([morceau(/^const ccx = .*$/m), morceau(/^const ccy = .*$/m),
  morceau(/^function farCell[\s\S]*?\n\}/m), 'farCell'].join('\n'), c);

function vecteurs() {
  const r = G.mulberry32(20261025), x = n => +(r() * n).toFixed(3);
  return [1234567, -865318257, 42].map(graine => {
    const m = new G.Maze(12, 18, G.mulberry32(graine)), walls = m.buildWalls();
    const d0 = m.bfs(0), d37 = m.bfs(37);
    const lignes = [], murs = [];
    for (let i = 0; i < 40; i++) {
      const o = [x(12), x(18)], t = [+(o[0] + x(3) - 1.5).toFixed(3), +(o[1] + x(3) - 1.5).toFixed(3)], w = walls[i % walls.length];
      lignes.push({ o, t, libre: G.losClear(o[0], o[1], t[0], t[1], walls, null), dist: +G.segDist(o[0], o[1], w.x1, w.y1, w.x2, w.y2).toFixed(4), mur: i % walls.length });
    }
    for (let i = 0; i < walls.length; i += 7) {
      const o = [x(12), x(18)], dir = +(r() * 6.283).toFixed(3);
      murs.push({ i, o, dir, visible: G.wallVisible(walls[i], o[0], o[1], walls), cone: G.wallInCone(walls[i], o[0], o[1], dir, 0.38) });
    }
    return { graine, nbMurs: walls.length, bfs0: Array.from(d0), loin0: farCell(m, 0, d0), loin37: farCell(m, 37, d37), lignes, murs };
  });
}

test('vecteurs de géométrie Android à jour', () => {
  const fichier = path.join(__dirname, 'geometrie-android.json');
  const v = vecteurs();
  if (process.env.MAJ_PARITE) fs.writeFileSync(fichier, JSON.stringify(v, null, 1) + '\n');
  assert.deepEqual(JSON.parse(fs.readFileSync(fichier, 'utf8')), v,
    'la géométrie web a changé : MAJ_PARITE=1 node --test, puis recopier tests/geometrie-android.json dans app/src/test/resources/ (Android)');
  assert.ok(v.every(j => j.lignes.some(l => l.libre) && j.lignes.some(l => !l.libre)), 'vecteurs variés');
});
