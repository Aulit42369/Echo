// Outils de test : lit la page telle que le navigateur la charge (index.html + fichiers css/js dans l'ordre)
// et l'exécute dans Node avec un faux navigateur minimal (aucune dépendance).
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const racine = path.join(__dirname, '..');
const lire = f => fs.readFileSync(path.join(racine, f), 'utf8');
const html = lire('index.html');

/** Scripts dans l'ordre de la page : { src } (fichier) ou { code } (script en ligne, hors JSON-LD). */
function scripts() {
  const out = [];
  for (const m of html.matchAll(/<script(?: src="([^"]+)")?( type="[^"]+")?>([\s\S]*?)<\/script>/g)) {
    if (m[2]) continue;
    out.push(m[1] ? { src: m[1], code: lire(m[1]) } : { code: m[3] });
  }
  return out;
}
const feuilles = () => [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map(m => m[1]);

/** Tout le code de la page : HTML + feuilles de style + scripts, dans l'ordre (pour les contrôles statiques). */
function source() {
  return [html, ...feuilles().map(lire), ...scripts().filter(s => s.src).map(s => s.code)].join('\n');
}

// Objet « n'importe quoi » : toute propriété, tout appel, tout `new` renvoie un autre objet de ce type ; vaut 0 en calcul.
function bidon(nom = '?', journal = null) {
  const enfants = new Map();
  const f = function () {};
  return new Proxy(f, {
    get(_, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === 'then') return undefined;
      if (!enfants.has(k)) enfants.set(k, bidon(nom + '.' + String(k), journal));
      return enfants.get(k);
    },
    set(_, k, v) { if (journal) journal.push(nom + '.' + String(k) + '=' + v); return true; },
    apply(_, __, args) { if (journal) journal.push(nom + '(' + args.map(a => typeof a === 'number' ? +a.toFixed(3) : typeof a === 'string' ? a : typeof a).join(',') + ')'); return bidon(nom + '()', journal); },
    construct() { return bidon('new ' + nom, journal); },
  });
}

// Objet réel complété par des « n'importe quoi » pour les propriétés absentes.
const repli = (nom, o) => new Proxy(o, { get: (c, k) => k in c ? c[k] : (c[k] = bidon(nom + '.' + String(k))) });

/**
 * Charge la page dans un contexte isolé. options.journal : tableau qui reçoit les appels au canvas 2D.
 * Renvoie { fenetre, image(n, dt), touche(k), erreurs }.
 */
function charger({ journal = null, maintenant = Date.parse('2026-10-25T12:00:00+01:00'), graine = 1, lang = null } = {}) {
  const ecouteurs = {}, images = [], stockage = new Map(), elements = {};
  let horloge = 1000, s = graine >>> 0;
  if (lang !== null) stockage.set('echo_lang', String(lang));
  const ecoute = (cible) => (type, fn) => { (ecouteurs[cible + ':' + type] ||= []).push(fn); };
  const element = id => elements[id] ||= Object.assign(bidon('#' + id), {});
  const ctx2d = bidon('ctx', journal);
  const canvas = { width: 0, height: 0, focus() {}, getContext: () => ctx2d, addEventListener: ecoute('canvas'), getBoundingClientRect: () => ({ left: 0, top: 0 }) };
  const g = {
    console, setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {},
    innerWidth: 400, innerHeight: 800, devicePixelRatio: 2,
    navigator: { languages: ['fr-FR'], language: 'fr-FR', vibrate() { return true; } },
    localStorage: { getItem: k => stockage.has(k) ? stockage.get(k) : null, setItem: (k, v) => stockage.set(k, String(v)), removeItem: k => stockage.delete(k) },
    matchMedia: () => ({ matches: false, addEventListener() {}, addListener() {} }),
    history: { pushState() {}, back() {} },
    location: { protocol: 'file:', href: 'file:///index.html' },
    performance: { now: () => horloge },
    requestAnimationFrame: fn => { images.push(fn); return images.length; },
    document: repli('document', { hidden: false, documentElement: { lang: '' }, getElementById: id => id === 'echo' ? canvas : element(id), addEventListener: ecoute('document'), createElement: () => bidon('el') }),
    addEventListener: ecoute('window'), removeEventListener() {},
    AudioContext: bidon('audio'), speechSynthesis: bidon('voix'), SpeechSynthesisUtterance: function () {},
  };
  const contexte = vm.createContext(g);
  const fenetre = vm.runInContext('this', contexte);
  fenetre.window = fenetre; fenetre.self = fenetre;
  // Hasard et date fixés : deux chargements donnent exactement la même partie
  vm.runInContext(`Math.random = () => { let t = (__s += 0x6D2B79F5) | 0; t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    Date.now = () => ${maintenant};`, Object.assign(contexte, { __s: s }));
  for (const sc of scripts()) vm.runInContext(sc.code, contexte, { filename: sc.src || 'index.html (en ligne)' });
  return {
    fenetre,
    /** Joue n images de dt secondes. */
    image(n = 1, dt = 1 / 60) { for (let i = 0; i < n; i++) { horloge += dt * 1000; const fn = images.shift(); if (fn) fn(horloge); } },
    /** Envoie une touche : appui puis relâche, ou seulement 'bas' / 'haut' (touche maintenue). */
    touche(k, sens) {
      const e = { key: k, repeat: false, target: {}, preventDefault() {} };
      if (sens !== 'haut') for (const fn of ecouteurs['window:keydown'] || []) fn(e);
      if (sens !== 'bas') for (const fn of ecouteurs['window:keyup'] || []) fn(e);
    },
    ecouteurs,
  };
}

module.exports = { racine, lire, html, scripts, feuilles, source, charger };
