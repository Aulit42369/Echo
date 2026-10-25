// ÉCHO — défi du jour à l'écran : accueil, panneau de fin, partage texte et image (logique dans defi.js).
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Défi du jour (logique commune dans defi.js)
// =====================================================================
const URL_JEU = 'https://aulit42369.github.io/Echo/';
const calme = matchMedia('(prefers-reduced-motion: reduce)');
const el = id => document.getElementById(id);
let accueil = null, defiSt = { count: 0, best: 0 }, defiTexte = '';
function nombre(n) { return n.toLocaleString(I18N.langs[lang].tts); }
function majAccueil() {
  const j = Defi.today(), st = Defi.load('echo'), fait = Defi.aJoue('echo', j);
  accueil = { j, fait, score: fait ? st.jours[j.key].score : 0, serie: Defi.serie('echo', j) };
}
/** ms jusqu'au prochain minuit de Paris (décalage 1 h l'hiver, 2 h l'été). */
function avantProchain() {
  const now = Date.now(), J = 86400000;
  for (const o of [1, 2]) {
    const m = now + o * 3600000, minuit = m - m % J + J - o * 3600000;
    if (Defi.parisDate(minuit).num !== Defi.parisDate(minuit - 1).num) return minuit - now;
  }
  return 0;
}
function texteDefi(serie) {
  const sec = Math.floor(dailyTime);
  return Defi.shareText({ nom: 'ÉCHO', n: defiJour.n, emoji: '🦇', score: nombre(dailyScore),
    lignes: Defi.grid(floors.flatMap(f => f.shards).map(s => s.taken ? 1 : 0), ['▫️', '💎']),
    detail: L('defiDetail', Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), echoesUsed),
    serie, libelleSerie: L('defiSerieTxt'), url: URL_JEU });
}
function defiPanneau(on) {
  el('defiFin').hidden = !on;
  if (!on) return;
  el('defiPartager').textContent = L('defiPartager');
  el('defiImage').textContent = L('defiImage');
  el('defiApercu').textContent = defiTexte;
  el('defiApercu').setAttribute('aria-label', L('defiResume', defiJour.n, nombre(dailyScore), defiSt.count));
  el('defiLabel').textContent = L('defiCopieLabel');
  el('defiEtat').textContent = ''; el('defiCopie').hidden = true;
}
let partageEnCours = false; // un seul partage à la fois (double clic, touche P répétée)
function partager() {
  if (partageEnCours) return;
  partageEnCours = true;
  Defi.share(defiTexte).finally(() => { partageEnCours = false; }).then(r => {
    if (!r) return; // partage annulé
    const msg = L(r === 'partage' ? 'defiPartage' : r === 'copie' ? 'defiCopie' : 'defiManuel');
    el('defiEtat').textContent = msg; say(msg);
    if (r === 'manuel') { el('defiCopie').hidden = false; el('defiTexte').value = defiTexte; el('defiTexte').focus(); el('defiTexte').select(); }
  });
}
el('defiPartager').addEventListener('click', partager);
/** Données de la carte image : les mêmes informations que le texte partagé. */
function carteDefi() {
  const sec = Math.floor(dailyTime);
  return { n: defiJour.n, kicker: L('daily') + ' #' + defiJour.n, score: nombre(dailyScore),
    eclats: floors.flatMap(f => f.shards).map(s => s.taken),
    detail: L('defiDetail', Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'), echoesUsed),
    serie: defiSt.count >= 2 ? L('defiSerieTxt', defiSt.count) : '', url: URL_JEU };
}
function partagerImage() {
  if (partageEnCours) return;
  partageEnCours = true;
  ShareCard.render(document, carteDefi())
    .then(c => ShareCard.share(c, defiTexte, 'echo-defi-' + defiJour.n + '.png'))
    .catch(() => 'echec')
    .finally(() => { partageEnCours = false; })
    .then(r => {
      if (!r) return; // partage annulé
      const msg = L(r === 'partage' ? 'defiPartage' : r === 'telechargement' ? 'defiImageOk' : 'defiImageErr');
      el('defiEtat').textContent = msg; say(msg);
    });
}
el('defiImage').addEventListener('click', partagerImage);
const autres = AutresJeux.init(document, window, L);
/** Picto de série : petite flamme dans la palette du jeu (pas d'emoji dans l'interface). */
function flamme(x, y, s, a) {
  const k = calme.matches ? 1 : 1 + 0.08 * sin(t * 7), h = s * k;
  const goutte = (r, hh) => { ctx.beginPath(); ctx.moveTo(x, y - hh); ctx.bezierCurveTo(x + r, y - hh * 0.2, x + r * 0.75, y + r, x, y + r);
    ctx.bezierCurveTo(x - r * 0.75, y + r, x - r, y - hh * 0.2, x, y - hh); ctx.fill(); };
  ctx.globalAlpha = a; ctx.fillStyle = COL.ORANGE; goutte(s * 0.8, h * 1.3);
  ctx.fillStyle = COL.GOLD; goutte(s * 0.4, h * 0.6);
}
