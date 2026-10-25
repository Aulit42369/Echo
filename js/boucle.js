// ÉCHO — boucle d'animation, accès de test ECHO, service worker.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Boucle
// =====================================================================
let last = performance.now();
function frame(now) {
  const dt = min(0.05, max(0, (now - last) / 1000));
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Accès de test (console) : ECHO.go(niveau)
window.ECHO = {
  go(l) { dailyMode = false; level = l; startLevel(); },
  tp(x, y) { px = x; py = y; camX = x; camY = y; },
  state: () => ({ state, level, floorIdx, floors: floors.length, hunters: hunters.map(h => h.type),
    stairs: cur && cur.stairsTo >= 0 ? [cur.stairsX, cur.stairsY] : null, exit: cur && cur.hasExit ? [cur.exitX, cur.exitY] : null,
    beacons: cur ? cur.beacons.length : 0, lit: walls.filter(w => w.lit > t - 3).length, mother: (hunters.find(h => h.type === MERE) || {}).growth,
    pos: [px, py], hunterPos: hunters.map(h => [h.type, h.x, h.y]) }),
};

// Hors ligne : le service worker met le jeu en cache (ignoré si indisponible)
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
