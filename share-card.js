// ÉCHO — carte image du Défi du jour (1080×1920, format story) et son partage.
// Même dessin que CarteDefi.kt (appli Android) : garder les deux alignés (coordonnées, couleurs, textes).
// Partage : navigator.share avec fichier, sinon téléchargement. Aucune dépendance ; chargeable sous Node (tests).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ShareCard = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var W = 1080, H = 1920, CX = 540, OY = 640; // OY : centre de l'écho
  var BG = '#05070a', CYAN = '#5cf2ff', GOLD = '#ffc94d', RED = '#ff3b5c', ORANGE = '#ff8a3d';
  var FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';

  function rgba(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  /** Petit hasard reproductible (mulberry32) : même labyrinthe décoratif pour un numéro de défi donné. */
  function hasard(a) {
    return function () {
      a = (a + 0x6d2b79f5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /** Murs décoratifs : grille de 120 px, chaque segment s'allume selon sa distance à l'écho. Renvoie [x1,y1,x2,y2,a]. */
  function murs(n) {
    var r = hasard(n | 0), out = [], P = 120;
    for (var gy = 0; gy <= 9; gy++) for (var gx = 0; gx <= 9; gx++) {
      var x = gx * P, y = gy * P + 40;
      [[x, y, x + P, y], [x, y, x, y + P]].forEach(function (s) {
        if (r() < 0.42) return;
        var d = Math.hypot((s[0] + s[2]) / 2 - CX, (s[1] + s[3]) / 2 - OY);
        var a = Math.max(0, 1 - d / 560);
        if (a > 0.02) out.push([s[0], s[1], s[2], s[3], a]);
      });
    }
    return out;
  }
  /** Texte centré avec espacement des lettres ; réduit la taille pour tenir dans `max` px. Renvoie la largeur. */
  function texte(ctx, s, y, taille, poids, couleur, ls, max) {
    s = String(s);
    var t = taille;
    for (;;) {
      ctx.font = poids + ' ' + t + 'px ' + FONT;
      if ('letterSpacing' in ctx) ctx.letterSpacing = (ls * t).toFixed(1) + 'px';
      if (t <= 14 || ctx.measureText(s).width <= max) break;
      t -= 4;
    }
    var w = ctx.measureText(s).width;
    ctx.textAlign = 'center'; ctx.fillStyle = couleur;
    ctx.fillText(s, CX + ('letterSpacing' in ctx ? ls * t / 2 : 0), y); // l'espacement s'ajoute aussi après la dernière lettre
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
    return w;
  }
  function losange(ctx, x, y, r) {
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.closePath();
  }
  function flamme(ctx, x, y, s) {
    function goutte(r, h) {
      ctx.beginPath(); ctx.moveTo(x, y - h); ctx.bezierCurveTo(x + r, y - h * 0.2, x + r * 0.75, y + r, x, y + r);
      ctx.bezierCurveTo(x - r * 0.75, y + r, x - r, y - h * 0.2, x, y - h); ctx.fill();
    }
    ctx.fillStyle = ORANGE; goutte(s * 0.8, s * 1.3);
    ctx.fillStyle = GOLD; goutte(s * 0.4, s * 0.6);
  }

  /**
   * o = { n, kicker: 'DÉFI DU JOUR #24', score: '7 420', eclats: [true, false, …], detail: '⏱ 1:42 · 7 échos',
   *       serie: '4 jours de suite' (ou ''), url: 'https://aulit42369.github.io/Echo/' }
   */
  function draw(ctx, o) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);

    // murs révélés par l'écho, puis ondes concentriques
    ctx.lineCap = 'round';
    murs(o.n).forEach(function (m) {
      ctx.strokeStyle = rgba(CYAN, 0.18 * m[4]); ctx.lineWidth = 14;
      ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[2], m[3]); ctx.stroke();
      ctx.strokeStyle = rgba(CYAN, 0.85 * m[4]); ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(m[0], m[1]); ctx.lineTo(m[2], m[3]); ctx.stroke();
    });
    for (var r = 90; r < 1300; r += 105) {
      ctx.strokeStyle = rgba(CYAN, Math.max(0.04, 0.55 * (1 - r / 1000))); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(CX, OY, r, 0, Math.PI * 2); ctx.stroke();
    }
    // une Ombre aux aguets
    var g = ctx.createRadialGradient(850, 330, 0, 850, 330, 70);
    g.addColorStop(0, rgba(RED, 0.75)); g.addColorStop(1, rgba(RED, 0));
    ctx.fillStyle = g; ctx.fillRect(780, 260, 140, 140);
    ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(850, 330, 11, 0, Math.PI * 2); ctx.fill();
    // la lueur du joueur
    g = ctx.createRadialGradient(CX, OY, 0, CX, OY, 120);
    g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(CX - 120, OY - 120, 240, 240);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(CX, OY, 20, 0, Math.PI * 2); ctx.fill();
    // fondu vers le noir : la zone de texte reste lisible
    var f = ctx.createLinearGradient(0, 1000, 0, 1180);
    f.addColorStop(0, rgba(BG, 0)); f.addColorStop(1, rgba(BG, 1));
    ctx.fillStyle = f; ctx.fillRect(0, 1000, W, H - 1000);

    texte(ctx, 'ÉCHO', 1250, 150, 300, '#ffffff', 0.55, 900);
    texte(ctx, o.kicker, 1345, 44, 400, GOLD, 0.3, 900);
    ctx.shadowColor = rgba(CYAN, 0.6); ctx.shadowBlur = 40;
    texte(ctx, o.score, 1550, 190, 200, '#ffffff', 0.04, 900);
    ctx.shadowBlur = 0;

    var ec = o.eclats || [], pas = 92, x0 = CX - (ec.length - 1) * pas / 2;
    ec.forEach(function (pris, i) {
      var x = x0 + i * pas;
      losange(ctx, x, 1640, 26);
      if (pris) { ctx.shadowColor = CYAN; ctx.shadowBlur = 30; ctx.fillStyle = CYAN; ctx.fill(); ctx.shadowBlur = 0; }
      else { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; ctx.stroke(); }
    });
    if (o.detail) texte(ctx, o.detail, 1735, 42, 300, 'rgba(255,255,255,0.8)', 0.06, 900);
    if (o.serie) {
      var ws = texte(ctx, o.serie, 1805, 40, 400, GOLD, 0.1, 820);
      flamme(ctx, CX - ws / 2 - 34, 1792, 16);
    }
    ctx.fillStyle = rgba(CYAN, 0.6); ctx.fillRect(CX - 40, 1838, 80, 3);
    texte(ctx, o.url, 1888, 30, 300, rgba(CYAN, 0.85), 0.08, 960);
  }

  /** Dessine la carte ; renvoie une promesse { canvas, blob }. */
  function render(doc, o) {
    var cv = doc.createElement('canvas'); cv.width = W; cv.height = H;
    draw(cv.getContext('2d'), o);
    return new Promise(function (ok, ko) { cv.toBlob(function (b) { b ? ok({ canvas: cv, blob: b }) : ko(new Error('toBlob')); }, 'image/png'); });
  }

  function telecharge(env, blob, nom) {
    var u = env.URL.createObjectURL(blob), a = env.doc.createElement('a');
    a.href = u; a.download = nom; env.doc.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { env.URL.revokeObjectURL(u); }, 10000);
    return 'telechargement';
  }

  /** carte = { canvas, blob } ; promesse 'partage' | 'telechargement', ou null si le joueur a annulé. env : pour les tests. */
  function share(carte, texte, nom, env) {
    env = env || { nav: navigator, doc: document, URL: URL, File: typeof File === 'function' ? File : null };
    var nav = env.nav || {}, fichier = null;
    try { if (env.File) fichier = new env.File([carte.blob], nom, { type: 'image/png' }); } catch (e) { fichier = null; }
    if (fichier && typeof nav.share === 'function' && typeof nav.canShare === 'function' && nav.canShare({ files: [fichier] })) {
      var p;
      try { p = Promise.resolve(nav.share({ files: [fichier], text: texte })); } catch (e) { p = Promise.reject(e); }
      return p.then(function () { return 'partage'; },
        function (e) { return e && e.name === 'AbortError' ? null : telecharge(env, carte.blob, nom); });
    }
    return Promise.resolve(telecharge(env, carte.blob, nom));
  }

  return { W: W, H: H, murs: murs, draw: draw, render: render, share: share };
});
