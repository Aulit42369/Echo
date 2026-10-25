// ÉCHO — échos, ligne de vue, leurres, balises, murs fissurés.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// ---------- échos ----------
function angleIn(ox, oy, x, y, dir, half) {
  let d = atan2(y - oy, x - ox) - dir;
  while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
  return abs(d) <= half;
}
const inCone = (p, x, y) => p.kind !== CONE || angleIn(p.ox, p.oy, x, y, p.dir, p.half);

function segDist(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const u = clamp(((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return hypot(x - (x1 + u * dx), y - (y1 + u * dy));
}
function segCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const rx = bx - ax, ry = by - ay, sx = dx - cx, sy = dy - cy;
  const den = rx * sy - ry * sx;
  if (abs(den) < 1e-9) return false;
  const tt = ((cx - ax) * sy - (cy - ay) * sx) / den, uu = ((cx - ax) * ry - (cy - ay) * rx) / den;
  return tt > 1e-4 && tt < 1 - 1e-4 && uu >= -1e-4 && uu <= 1 + 1e-4;
}
function losClear(ox, oy, tx, ty, list, skip) {
  const minX = min(ox, tx), maxX = max(ox, tx), minY = min(oy, ty), maxY = max(oy, ty);
  for (const w of list) {
    if (w === skip || w.broken) continue;
    if (max(w.x1, w.x2) < minX || min(w.x1, w.x2) > maxX || max(w.y1, w.y2) < minY || min(w.y1, w.y2) > maxY) continue;
    if (segCross(ox, oy, tx, ty, w.x1, w.y1, w.x2, w.y2)) return false;
  }
  return true;
}
// Écho réaliste : le mur est-il visible depuis l'origine (au moins un point dégagé) ?
function wallVisible(w, ox, oy, list) {
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
  const uc = clamp(((ox - w.x1) * dx + (oy - w.y1) * dy) / (dx * dx + dy * dy), 0, 1);
  for (const u of [uc, 0.15, 0.5, 0.85]) {
    let sx = w.x1 + u * dx, sy = w.y1 + u * dy;
    const d = hypot(ox - sx, oy - sy);
    if (d > 1e-4) { sx += (ox - sx) / d * 0.03; sy += (oy - sy) / d * 0.03; }
    if (losClear(ox, oy, sx, sy, list, w)) return true;
  }
  return false;
}
const entityVisible = (p, x, y) => !realOn() || losClear(p.ox, p.oy, x, y, walls, null);

function wallInCone(w, ox, oy, dir, half) {
  if (angleIn(ox, oy, w.x1, w.y1, dir, half) || angleIn(ox, oy, w.x2, w.y2, dir, half) || angleIn(ox, oy, w.mx, w.my, dir, half)) return true;
  const dx = w.x2 - w.x1, dy = w.y2 - w.y1;
  const u = clamp(((ox - w.x1) * dx + (oy - w.y1) * dy) / (dx * dx + dy * dy), 0, 1);
  return angleIn(ox, oy, w.x1 + u * dx, w.y1 + u * dy, dir, half);
}

function makePulse(kind, ox, oy, dir) {
  let speed, reveal, hear, half;
  if (kind === CONE) { speed = 11; reveal = C.CONE_R; hear = C.CONE_HEAR; half = C.CONE_HALF; }
  else if (kind === DECOY) { speed = 6; reveal = C.DECOY_R; hear = C.DECOY_HEAR; half = Math.PI; }
  else { speed = C.PULSE_SPEED; reveal = C.PULSE_R; hear = C.HEAR_R; half = Math.PI; }
  const real = realOn();
  const cand = real ? walls.filter(w => !w.broken && segDist(ox, oy, w.x1, w.y1, w.x2, w.y2) <= reveal + 0.5) : null;
  const wallDist = new Float32Array(walls.length);
  for (let i = 0; i < walls.length; i++) {
    const w = walls[i];
    if (w.broken || (kind === CONE && !wallInCone(w, ox, oy, dir, half))) { wallDist[i] = Infinity; continue; }
    const dd = segDist(ox, oy, w.x1, w.y1, w.x2, w.y2);
    wallDist[i] = real && dd <= reveal && !wallVisible(w, ox, oy, cand) ? Infinity : dd;
  }
  return { id: ++pulseSeq, kind, ox, oy, start: t, speed, revealR: reveal, hearR: hear, maxR: max(reveal, hear), dir, half, wallDist };
}

function firePulse(kind, dir) {
  if (energy < 1) { sound.play('empty', 0.6); return; }
  energy -= 1; echoesUsed++;
  pulses.push(makePulse(kind, px, py, dir));
  if (kind === CONE) sound.play('cone', 0.7); else sound.play('ping', 0.9);
  haptics.tick();
  answerAt = t + min(1.4, 0.3 + hypot(goalX() - px, goalY() - py) * 0.05);
  // La Mère entend tout et se nourrit de chaque écho
  for (const h of hunters) if (h.type === MERE) {
    h.growth++; h.hunting = false; alert(cur, h, cellOf(maze, px, py));
    playAt('growl', h.x, h.y, 0.9, max(0.5, 0.75 - h.growth * 0.02));
  }
  // Les Rôdeuses de l'autre étage entendent si tu es juste au-dessus/dessous
  floors.forEach((f, fi) => {
    if (fi === floorIdx) return;
    for (const h of f.hunters) if (h.type === RODEUSE && hypot(h.x - px, h.y - py) < C.FLOOR_HEAR) alert(f, h, cellOf(f.maze, px, py));
  });
}

function blocked(x, y, r) {
  if (x < r || y < r || x > maze.cols - r || y > maze.rows - r) return true;
  for (const w of walls) {
    if (w.broken) continue;
    if (x + r < min(w.x1, w.x2) || x - r > max(w.x1, w.x2) || y + r < min(w.y1, w.y2) || y - r > max(w.y1, w.y2)) continue;
    if (segDist(x, y, w.x1, w.y1, w.x2, w.y2) < r) return true;
  }
  return false;
}

function throwDecoy() {
  if (decoysLeft <= 0) { sound.play('empty', 0.6); return; }
  decoysLeft--;
  const dx = cos(facing), dy = sin(facing);
  let tx = px, ty = py, dist = 0;
  while (dist < C.DECOY_RANGE) {
    const nx = tx + dx * 0.05, ny = ty + dy * 0.05;
    if (blocked(nx, ny, 0.12)) break;
    tx = nx; ty = ny; dist += 0.05;
  }
  decoys.push({ fx: px, fy: py, tx, ty, x: px, y: py, start: t, fired: false });
  sound.play('throw', 0.7); haptics.tick();
}

function placeBeacon() {
  if (beaconsLeft <= 0) { sound.play('empty', 0.6); return; }
  beaconsLeft--;
  cur.beacons.push({ x: px, y: py, alive: true });
  sound.play('beacon', 0.8); haptics.tick(20); burst(px, py, 18, 1.4, COL.ICE, 0.8, 1.8); say(L('sBeaconPlaced'));
}

function updateDecoys() {
  for (let i = decoys.length - 1; i >= 0; i--) {
    const d = decoys[i];
    const k = min(1, (t - d.start) / 0.35);
    d.x = d.fx + (d.tx - d.fx) * k; d.y = d.fy + (d.ty - d.fy) * k;
    if (!d.fired && k >= 1) {
      d.fired = true;
      pulses.push(makePulse(DECOY, d.tx, d.ty, 0));
      playAt('ping', d.tx, d.ty, 0.8, 0.8);
      burst(d.tx, d.ty, 14, 1.5, COL.GOLD, 0.6, 1.8);
    }
    if (t - d.start > 3) decoys.splice(i, 1);
  }
}

function updatePulses() {
  const f = cur;
  for (let pi = pulses.length - 1; pi >= 0; pi--) {
    const p = pulses[pi];
    const r = (t - p.start) * p.speed;
    if (r <= p.revealR + 0.3) {
      for (let i = 0; i < walls.length; i++) {
        const w = walls[i];
        if (w.broken || w.lastPulse === p.id) continue;
        const d = p.wallDist[i];
        if (d <= r && d <= p.revealR) {
          w.lit = t; w.seen = true; w.lastPulse = p.id;
          if (Math.random() < 0.35) spark(w);
          if (w.fragile && d <= C.BREAK_R) breakWall(w);
        }
      }
    }
    for (const h of hunters) {
      if (!h.active || h.lastPulse === p.id) continue;
      const d = hypot(h.x - p.ox, h.y - p.oy), mm = h.type === MERE ? 2 : 1;
      if (d <= r && d <= p.maxR * mm) {
        h.lastPulse = p.id;
        if (d <= p.revealR && inCone(p, h.x, h.y) && entityVisible(p, h.x, h.y)) h.lit = t;
        const hears = h.type === RODEUSE || (h.type === MERE && p.kind === DECOY);
        if (hears && d <= p.hearR * mm) alert(f, h, cellOf(maze, p.ox, p.oy));
      }
    }
    for (const s of shards) {
      if (s.taken || s.lastPulse === p.id) continue;
      const d = hypot(s.x - p.ox, s.y - p.oy);
      if (d <= r && d <= p.revealR && inCone(p, s.x, s.y) && entityVisible(p, s.x, s.y)) { s.lit = t; s.lastPulse = p.id; }
    }
    if (f.hasExit && f.exitLastPulse !== p.id) {
      const d = hypot(f.exitX - p.ox, f.exitY - p.oy);
      if (d <= r && d <= p.revealR && inCone(p, f.exitX, f.exitY) && entityVisible(p, f.exitX, f.exitY)) { f.exitLit = t; f.exitLastPulse = p.id; }
    }
    if (f.stairsTo >= 0 && f.stairsLastPulse !== p.id) {
      const d = hypot(f.stairsX - p.ox, f.stairsY - p.oy);
      if (d <= r && d <= p.revealR && inCone(p, f.stairsX, f.stairsY) && entityVisible(p, f.stairsX, f.stairsY)) { f.stairsLit = t; f.stairsLastPulse = p.id; }
    }
    if (r > p.maxR * 2) pulses.splice(pi, 1);
  }
}

function breakWall(w) {
  w.broken = true; maze.open(w.a, w.b);
  playAt('crack', w.mx, w.my, 1); haptics.tick(45);
  shake = max(shake, 0.35); burst(w.mx, w.my, 28, 2.5, COL.CRACK, 1, 2.2);
  const target = cellOf(maze, w.mx, w.my);
  for (const h of hunters) if ((h.type === RODEUSE || h.type === MERE) && hypot(h.x - w.mx, h.y - w.my) < C.BREAK_NOISE) alert(cur, h, target);
}
