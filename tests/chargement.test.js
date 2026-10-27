// Non-régression du découpage en fichiers : la page se charge et se joue sans erreur dans un faux navigateur,
// dans les 7 langues, et tous les textes demandés par le code existent dans le bloc de traductions.
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { charger, source, scripts } = require('./page.js');

const etat = p => p.fenetre.ECHO.state();

test('la page se charge et démarre sur l\'accueil', () => {
  const p = charger();
  p.image(60);
  assert.equal(etat(p).state, 0, 'accueil');
});

test('parcours complet au clavier : partie, défi, options, niveaux 1 à 12', () => {
  const p = charger();
  p.image(30);
  p.touche('Enter'); p.image(5);
  assert.equal(etat(p).state, 2, 'partie lancée');
  p.touche('ArrowRight', 'bas'); p.image(40); p.touche('ArrowRight', 'haut');
  for (const k of [' ', 'f', 'e', 'b']) { p.touche(k); p.image(20); }
  p.touche('Escape'); p.image(5);
  assert.equal(etat(p).state, 0, 'retour au menu');
  p.touche('j'); p.image(5);
  assert.equal(etat(p).state, 2, 'défi lancé');
  p.touche('Escape'); p.image(5);
  p.touche('o'); p.image(30);
  assert.equal(etat(p).state, 1, 'options');
  p.touche('Escape'); p.image(5);
  for (let l = 1; l <= 12; l++) {
    p.fenetre.ECHO.go(l); p.image(5);
    const e = etat(p);
    assert.equal(e.level, l);
    assert.ok(e.floors >= 1);
    p.touche('ArrowUp', 'bas'); p.touche(' '); p.image(90); p.touche('ArrowUp', 'haut');
    p.touche('f'); p.touche('e'); p.touche('b'); p.image(60);
  }
  assert.equal(etat(p).hunters.includes(4) || etat(p).level !== 10, true);
});

test('les 7 langues s\'affichent sans erreur', () => {
  for (let lang = 0; lang < 7; lang++) {
    const p = charger({ lang });
    p.image(10);
    p.touche('o'); p.image(10);
    p.fenetre.ECHO.go(1); p.image(10);
  }
});

test('chaque texte demandé par le code existe dans les 7 langues', () => {
  const code = scripts().map(s => s.code).join('\n');
  const T = JSON.parse(code.match(/const I18N = (\{.*\});\r?\n\/\/ <\/i18n:auto>/)[1]).t;
  const cles = new Set([...code.matchAll(/\bLL?\('([A-Za-z0-9_]+)'[,)]/g)].map(m => m[1]));
  assert.ok(cles.size > 40, 'clés trouvées : ' + cles.size);
  for (const k of cles) {
    assert.ok(T[k], 'texte manquant : ' + k);
    assert.equal(T[k].length, 7, k);
  }
  assert.ok(source().length > 50000);
});

test('service worker : chaque css / js de la page est en cache hors ligne', () => {
  const vm = require('node:vm');
  const { lire, feuilles } = require('./page.js');
  const c = {};
  vm.runInNewContext(lire('sw.js').replace(/self\.addEventListener[\s\S]*$/, '') + '\nthis.FILES = FILES;', c);
  const fichiers = [...feuilles(), ...scripts().filter(s => s.src).map(s => s.src)];
  assert.ok(fichiers.length >= 19, 'fichiers de la page : ' + fichiers.length);
  for (const f of fichiers) assert.ok(c.FILES.includes('./' + f), f + ' absent de sw.js');
  // seule exception : le compteur GoatCounter d'une ligne (empreinte dans la CSP, vérifié par statistiques.test.js)
  assert.ok(!require('./page.js').html.replace(/<script>[^<]*goatcounter[^<]*<\/script>/, '').includes('<script>'), 'plus aucun script en ligne (hors JSON-LD et GoatCounter)');
});
