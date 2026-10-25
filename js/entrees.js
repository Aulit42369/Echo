// ÉCHO — entrées tactile / souris / clavier, retour Android, écran allumé, installation.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Entrées : tactile, souris et clavier
// =====================================================================
const input = { touching: false, moved: false, aimArmed: false, joyId: null, ox: 0, oy: 0, x: 0, y: 0, downTime: 0,
  tap: false, cone: false, coneAngle: 0, decoy: false, beacon: false, tapX: 0, tapY: 0, titleAction: -1, back: false };
const keys = new Set();
const buttonY = () => vh - 84;
const decoyX = () => vw - 58, beaconX = () => 58;
function inDecoy(x, y) { return state === PLAY && decoysMax > 0 && hypot(x - decoyX(), y - buttonY()) < 40; }
function inBeacon(x, y) { return state === PLAY && beaconsMax > 0 && hypot(x - beaconX(), y - buttonY()) < 40; }

cv.addEventListener('pointerdown', e => {
  e.preventDefault(); sound.init(); cv.focus();
  const x = e.clientX, y = e.clientY;
  if (input.touching && input.joyId !== null) {
    if (inDecoy(x, y)) input.decoy = true; else if (inBeacon(x, y)) input.beacon = true; else input.tap = true;
    return;
  }
  input.tapX = x; input.tapY = y;
  if (inDecoy(x, y)) { input.decoy = true; return; }
  if (inBeacon(x, y)) { input.beacon = true; return; }
  input.joyId = e.pointerId; input.ox = x; input.oy = y; input.x = x; input.y = y;
  input.downTime = performance.now(); input.moved = false; input.aimArmed = false; input.touching = true;
  try { cv.setPointerCapture(e.pointerId); } catch (err) {}
});
cv.addEventListener('pointermove', e => {
  if (!input.touching || e.pointerId !== input.joyId) return;
  const x = e.clientX, y = e.clientY;
  if (input.aimArmed) { input.x = x; input.y = y; return; }
  const dx = x - input.ox, dy = y - input.oy, len = hypot(dx, dy);
  if (len > 14) input.moved = true;
  if (len > C.JOY_R) { input.ox = x - dx / len * C.JOY_R; input.oy = y - dy / len * C.JOY_R; }
  input.x = x; input.y = y;
});
function release(e, cancel) {
  if (!input.touching || e.pointerId !== input.joyId) return;
  if (!cancel) {
    if (input.aimArmed) {
      const dx = input.x - input.ox, dy = input.y - input.oy;
      if (hypot(dx, dy) > 20) { input.coneAngle = atan2(dy, dx); input.cone = true; } else input.tap = true;
    } else if (!input.moved && performance.now() - input.downTime < 260) input.tap = true;
  }
  input.touching = false; input.aimArmed = false; input.joyId = null;
}
cv.addEventListener('pointerup', e => release(e, false));
cv.addEventListener('pointercancel', e => release(e, true));
cv.addEventListener('contextmenu', e => e.preventDefault());

addEventListener('keydown', e => {
  if (e.target && e.target.closest && e.target.closest('#defiFin, #autres, #autresBtn')) return;
  const k = e.key.toLowerCase();
  if (state === CLEAR && dailyMode && k === 'p') { if (!e.repeat) partager(); return; }
  if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  sound.init();
  if (e.repeat) return;
  keys.add(k);
  if (state === TITLE) {
    if (k === 'enter' || k === ' ') input.titleAction = 0;
    else if (k === 'j') input.titleAction = 1;
    else if (k === 'o') input.titleAction = 2;
    return;
  }
  if (state === OPTIONS) { if (k === 'escape') input.back = true; return; }
  if (k === ' ' || k === 'enter') input.tap = true;
  else if (k === 'f') { input.coneAngle = facing; input.cone = true; }
  else if (k === 'e') input.decoy = true;
  else if (k === 'b') input.beacon = true;
  else if (k === 'escape') input.back = true;
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
addEventListener('blur', () => keys.clear());

// Bouton retour d'Android : partie / options → menu
let histPushed = false, ignorePop = false;
function pushGameHistory() { if (!histPushed) { try { history.pushState({ echo: 1 }, ''); histPushed = true; } catch (e) {} } }
addEventListener('popstate', () => {
  histPushed = false;
  if (ignorePop) { ignorePop = false; return; }
  if (state !== TITLE) input.back = true;
});
function goTitle() {
  state = TITLE; stateT = t; defiPanneau(false); majAccueil();
  if (histPushed) { histPushed = false; ignorePop = true; try { history.back(); } catch (e) {} }
}

// Écran allumé pendant la partie
let wakeLock = null;
async function keepAwake() {
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) {}
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { sound.suspend(); try { speechSynthesis.cancel(); } catch (e) {} }
  else { sound.resume(); if (state !== TITLE) keepAwake(); last = performance.now(); }
});

// Installation (Android / Chrome)
let installEvt = null;
const standalone = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || navigator.standalone;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; });
addEventListener('appinstalled', () => { installEvt = null; });
