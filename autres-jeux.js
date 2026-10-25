// ÉCHO — carte « Les autres jeux d'Aulit » : bouton sur l'accueil + panneau avec les 3 autres jeux.
// Textes dans i18n/strings.json (clés autres*), passés par la fonction L du jeu. Chargeable sous Node (tests).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AutresJeux = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  // Liens web des 3 autres jeux : à remplacer par le lien Play Store quand l'appli sera publiée.
  var JEUX = [
    { nom: 'LUMEN', cle: 'autresLumen', url: 'https://lumen-jeu.github.io/', couleur: '#ffc94d' },
    { nom: 'Fragments', cle: 'autresFragments', url: 'https://fragments-jeu.github.io/', couleur: '#c08bff' },
    { nom: 'Résonance', cle: 'autresResonance', url: 'https://resonance-jeu.github.io/', couleur: '#5cf2ff' },
  ];
  var CSS = [
    '#autresBtn { position: fixed; top: max(10px, env(safe-area-inset-top)); right: max(10px, env(safe-area-inset-right)); z-index: 2;',
    '  min-height: 40px; padding: 0 16px; border-radius: 20px; border: 1px solid rgba(92,242,255,.38); background: rgba(5,7,10,.6);',
    '  color: rgba(255,255,255,.82); font: 300 11px/1 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; letter-spacing: .18em;',
    '  text-transform: uppercase; cursor: pointer; box-shadow: 0 0 18px rgba(92,242,255,.12); }',
    '#autresBtn[hidden], #autres[hidden] { display: none; }',
    '#autres { position: fixed; inset: 0; z-index: 3; display: flex; flex-direction: column; align-items: center; justify-content: center;',
    '  gap: 14px; padding: max(24px, env(safe-area-inset-top)) 16px max(24px, env(safe-area-inset-bottom)); overflow-y: auto;',
    '  background: radial-gradient(circle at 50% 18%, rgba(92,242,255,.10), rgba(5,7,10,.97) 55%); color: #fff;',
    '  font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif; }',
    '#autres h2 { margin: 0 0 4px; font-size: 15px; font-weight: 300; letter-spacing: .3em; text-transform: uppercase; text-align: center; }',
    '#autres .note { margin: 0 0 6px; font-size: 11px; letter-spacing: .08em; color: rgba(255,255,255,.62); }',
    '#autres a { position: relative; display: block; width: min(360px, 100%); box-sizing: border-box; padding: 18px 54px 18px 22px;',
    '  border-radius: 22px; border: 1px solid var(--c); background: rgba(5,7,10,.8); text-decoration: none; color: #fff; overflow: hidden;',
    '  box-shadow: 0 0 24px color-mix(in srgb, var(--c) 18%, transparent), inset 0 0 22px color-mix(in srgb, var(--c) 7%, transparent); }',
    '#autres a::before { content: ""; position: absolute; right: -38px; top: 50%; width: 110px; height: 110px; transform: translateY(-50%);',
    '  border-radius: 50%; border: 1px solid var(--c); opacity: .35; box-shadow: 0 0 0 14px rgba(5,7,10,.0), 0 0 0 15px var(--c); }',
    '#autres a::after { content: "↗"; position: absolute; right: 20px; top: 50%; transform: translateY(-50%); color: var(--c); font-size: 18px; }',
    '#autres b { display: block; font-weight: 300; font-size: 16px; letter-spacing: .3em; text-transform: uppercase; color: var(--c); }',
    '#autres span { display: block; margin-top: 6px; font-size: 13px; line-height: 1.4; color: rgba(255,255,255,.8); }',
    '#autres a:active { background: rgba(92,242,255,.08); }',
    '#autres button { margin-top: 8px; min-height: 48px; padding: 0 28px; border-radius: 24px; border: 1.5px solid rgba(255,255,255,.4);',
    '  background: transparent; color: #fff; font: 300 13px system-ui, sans-serif; letter-spacing: .3em; text-transform: uppercase; cursor: pointer; }',
    '#autresBtn:focus-visible, #autres a:focus-visible, #autres button:focus-visible { outline: 2px solid #5cf2ff; outline-offset: 3px; }',
  ].join('\n');

  /** L : fonction de traduction du jeu. Renvoie { maj(voirBouton), ouvert() }. */
  function init(doc, win, L) {
    var st = doc.createElement('style'); st.textContent = CSS; doc.head.appendChild(st);
    var btn = doc.createElement('button'); btn.id = 'autresBtn'; btn.type = 'button'; btn.hidden = true;
    var pan = doc.createElement('div'); pan.id = 'autres'; pan.hidden = true;
    pan.setAttribute('role', 'dialog'); pan.setAttribute('aria-modal', 'true'); pan.setAttribute('aria-labelledby', 'autresTitre');
    doc.body.appendChild(btn); doc.body.appendChild(pan);
    var langue = null, historique = false;

    function remplir() {
      pan.textContent = '';
      var h = doc.createElement('h2'); h.id = 'autresTitre'; h.textContent = L('autresTitre'); pan.appendChild(h);
      var p = doc.createElement('p'); p.className = 'note'; p.textContent = L('autresOuvrir'); pan.appendChild(p);
      JEUX.forEach(function (j) {
        var a = doc.createElement('a'); a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; a.style.setProperty('--c', j.couleur);
        var b = doc.createElement('b'); b.textContent = j.nom;
        var s = doc.createElement('span'); s.textContent = L(j.cle);
        a.appendChild(b); a.appendChild(s); pan.appendChild(a);
      });
      var r = doc.createElement('button'); r.type = 'button'; r.textContent = L('back'); r.addEventListener('click', fermer); pan.appendChild(r);
    }
    function ouvrir() {
      remplir(); pan.hidden = false;
      try { win.history.pushState({ autres: 1 }, ''); historique = true; } catch (e) { historique = false; }
      var a = pan.querySelector('a'); if (a) a.focus();
    }
    function fermer() {
      if (pan.hidden) return;
      pan.hidden = true; btn.focus();
      if (historique) { historique = false; try { win.history.back(); } catch (e) { /* rien */ } }
    }
    btn.addEventListener('click', ouvrir);
    pan.addEventListener('keydown', function (e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } });
    // retour d'Android : ferme le panneau sans quitter le jeu
    win.addEventListener('popstate', function () { if (!pan.hidden) { historique = false; pan.hidden = true; btn.focus(); } });

    return {
      maj: function (voir, lang) {
        if (lang !== langue) { langue = lang; btn.textContent = L('autresBouton'); if (!pan.hidden) remplir(); }
        if (btn.hidden === voir) btn.hidden = !voir;
        if (!voir && !pan.hidden) fermer();
      },
      ouvert: function () { return !pan.hidden; },
    };
  }

  return { JEUX: JEUX, init: init };
});
