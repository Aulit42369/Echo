// ÉCHO — Ombres (déplacements, alertes, Reflet), collisions, effets.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// ---------- Ombres ----------
function alert(f, h, target) {
  const m = f.maze, c = cellOf(m, h.x, h.y);
  h.path = [c, ...m.path(c, target)];
  if (!h.hunting && f === cur && h.type !== MERE) {
    const d = hypot(h.x - px, h.y - py);
    playAt('growl', h.x, h.y, 0.25 + 0.6 * max(0, 1 - d / C.HEAR_R));
  }
  h.hunting = true;
}

function moveToward(m, h, target, speed, dt) {
  const tx = ccx(m, target), ty = ccy(m, target), dx = tx - h.x, dy = ty - h.y, d = hypot(dx, dy), step = speed * dt;
  if (d <= step) {
    h.x = tx; h.y = ty;
    if (target !== h.atCell) { h.prevCell = h.atCell; h.atCell = target; }
    return true;
  }
  h.x += dx / d * step; h.y += dy / d * step;
  return false;
}

function followPath(f, h, speed, dt) {
  const m = f.maze;
  if (!h.path.length) {
    h.hunting = false;
    if (h.type === RODEUSE || h.type === MERE) {
      const b = f.beacons.find(b => b.alive && hypot(b.x - h.x, b.y - h.y) < C.BEACON_LURE);
      if (b) h.path = m.path(h.atCell, cellOf(m, b.x, b.y));
    }
    if (!h.path.length) {
      const n = m.neighbors(h.atCell, nb);
      if (!n) return;
      let pick = nb[Math.floor(Math.random() * n)];
      if (n > 1) { let g = 0; while (pick === h.prevCell && g++ < 6) pick = nb[Math.floor(Math.random() * n)]; }
      h.path.push(pick);
    }
  }
  if (moveToward(m, h, h.path[0], speed, dt)) h.path.shift();
}

// Le Reflet suit ta piste, y compris d'un étage à l'autre
function syncReflet() {
  const r = reflet;
  if (!r || trailCount <= C.REFLET_DELAY) return;
  const i = (trailCount - C.REFLET_DELAY) % C.TRAIL_N, tf = trailF[i];
  floors.forEach((f, fi) => {
    if (fi === tf) return;
    const j = f.hunters.indexOf(r);
    if (j >= 0) { f.hunters.splice(j, 1); floors[tf].hunters.push(r); }
  });
  if (!r.active) { r.active = true; r.lx = trailX[i]; r.ly = trailY[i]; }
  r.x = trailX[i]; r.y = trailY[i];
}

function updateHunters(f, onFloor, dt) {
  const m = f.maze, mul = easyOn() ? 0.85 : 1, lv = dailyMode ? 6 : level;
  const huntSpeed = min(2.3, 1.65 + lv * 0.06) * mul;
  const playerMoving = onFloor && hypot(vx, vy) > 0.35 * C.SPEED;
  for (const h of f.hunters) {
    if (h.type === REFLET) continue;
    if (h.type === PATROUILLE) {
      const route = h.route;
      if (route && route.length > 1 && moveToward(m, h, route[h.routeIdx], 1.1 * mul, dt)) {
        if (h.routeIdx + h.routeDir < 0 || h.routeIdx + h.routeDir >= route.length) h.routeDir = -h.routeDir;
        h.routeIdx += h.routeDir;
      }
    } else if (h.type === AVEUGLE) {
      const d = hypot(h.x - px, h.y - py);
      if (playerMoving && d < 2.8) {
        h.senseTimer -= dt;
        if (h.senseTimer <= 0) { h.senseTimer = 0.4; alert(f, h, cellOf(m, px, py)); }
      } else h.senseTimer = 0;
      followPath(f, h, (h.hunting ? 1.9 : 0.55) * mul, dt);
    } else if (h.type === MERE) {
      followPath(f, h, (h.hunting ? min(2.4, 0.7 + 0.12 * h.growth) : 0.5) * mul, dt);
    } else {
      followPath(f, h, h.hunting ? huntSpeed : 0.75 * mul, dt);
    }
  }
}

// Les Rôdeuses (et la Mère) qui atteignent une balise l'éteignent
function updateBeacons() {
  floors.forEach((f, fi) => {
    for (const b of f.beacons) {
      if (!b.alive) continue;
      for (const h of f.hunters) {
        if ((h.type === RODEUSE || h.type === MERE) && hypot(h.x - b.x, h.y - b.y) < 0.35) {
          b.alive = false;
          if (fi === floorIdx) { playAt('snuff', b.x, b.y, 0.8); burst(b.x, b.y, 20, 1.6, COL.ICE, 0.9, 1.8); }
          else playAt('snuff', b.x, b.y, 0.3, 0.7);
          say(L('sBeaconOut'));
          break;
        }
      }
    }
  });
}

function collide() {
  pushX = 0; pushY = 0;
  for (let pass = 0; pass < 2; pass++) {
    for (const w of walls) {
      if (w.broken) continue;
      if (px + C.PR < min(w.x1, w.x2) || px - C.PR > max(w.x1, w.x2) || py + C.PR < min(w.y1, w.y2) || py - C.PR > max(w.y1, w.y2)) continue;
      const dx2 = w.x2 - w.x1, dy2 = w.y2 - w.y1;
      const u = clamp(((px - w.x1) * dx2 + (py - w.y1) * dy2) / (dx2 * dx2 + dy2 * dy2), 0, 1);
      const dx = px - (w.x1 + u * dx2), dy = py - (w.y1 + u * dy2), d = hypot(dx, dy);
      if (d < C.PR && d > 1e-5) { const push = (C.PR - d) / d; px += dx * push; py += dy * push; pushX += dx * push; pushY += dy * push; }
    }
  }
  px = clamp(px, C.PR, maze.cols - C.PR); py = clamp(py, C.PR, maze.rows - C.PR);
}

function die() {
  state = DEAD; stateT = t;
  for (const h of hunters) h.lit = t + 2;
  sound.play('death'); haptics.boom(); shake = 1; vx = 0; vy = 0;
  burst(px, py, 40, 3.5, COL.RED, 1.1, 2.5);
  say(L('sDead'));
}

function playAt(name, x, y, vol, rate = 1) {
  const dx = x - px, d = max(0.001, hypot(dx, y - py));
  sound.play(name, vol, clamp(dx / d, -1, 1) * 0.85, rate);
}

function burst(x, y, count, speed, color, life, size) {
  for (let i = 0; i < count && particles.length < 600; i++) {
    const a = Math.random() * TAU, s = speed * (0.3 + Math.random() * 0.7), l = life * (0.5 + Math.random() * 0.5);
    particles.push({ x, y, vx: cos(a) * s, vy: sin(a) * s, life: l, maxLife: l, color, size });
  }
}
function spark(w) {
  if (particles.length >= 600) return;
  const u = Math.random(), a = Math.random() * TAU, l = 0.5 + Math.random() * 0.5;
  particles.push({ x: w.x1 + (w.x2 - w.x1) * u, y: w.y1 + (w.y2 - w.y1) * u, vx: cos(a) * 0.35, vy: sin(a) * 0.35,
    life: l, maxLife: l, color: w.fragile ? COL.CRACK : COL.CYAN, size: 1.4 });
}
