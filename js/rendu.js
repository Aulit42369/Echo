// ÉCHO — rendu canvas : primitives, monde, mode audio.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Rendu
// =====================================================================
const fade = (lit, dur) => clamp(1 - (t - lit) / dur, 0, 1);
const sx = x => (x - camX) * cell + vw / 2 + shakeX;
const sy = y => (y - camY) * cell + vh / 2 + shakeY;

function fillCircle(x, y, r, color, a) { ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, max(0, r), 0, TAU); ctx.fill(); }
function strokeCircle(x, y, r, color, a, w) { ctx.globalAlpha = clamp(a, 0, 1); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, max(0, r), 0, TAU); ctx.stroke(); }
function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
function text(s, x, y, size, color, a, align = 'center', ls = 0) {
  ctx.font = `300 ${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  if ('letterSpacing' in ctx) ctx.letterSpacing = (ls * size).toFixed(1) + 'px';
  // Réduit la taille si le texte dépasse la place disponible (langues longues, petits écrans)
  const avail = align === 'center' ? 2 * min(x, vw - x) - 24 : align === 'left' ? vw - x - 12 : x - 12;
  const w = ctx.measureText(s).width;
  if (w > avail && avail > 0) {
    const k = avail / w;
    ctx.font = `300 ${size * k}px ${FONT}`;
    if ('letterSpacing' in ctx) ctx.letterSpacing = (ls * size * k).toFixed(1) + 'px';
  }
  ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function diamond(x, y, r, rot, color, a) {
  ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = color; ctx.beginPath();
  for (let k = 0; k < 4; k++) { const ang = rot + k * Math.PI / 2; const qx = x + cos(ang) * r, qy = y + sin(ang) * r; k ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); }
  ctx.closePath(); ctx.fill();
}
function roundRect(x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function formatTime(s) { const m = Math.floor(s / 60); const r = s - m * 60; const sep = (1.5).toLocaleString(I18N.langs[lang].tts).charAt(1) || '.'; return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0').replace('.', sep); }

function beaconLight(x, y) {
  let a = 0;
  for (const b of cur.beacons) {
    if (!b.alive) continue;
    const d = hypot(x - b.x, y - b.y);
    if (d < C.BEACON_LIGHT) a = max(a, 0.15 + 0.35 * (1 - d / C.BEACON_LIGHT));
  }
  return a;
}

function render() {
  majLienLegal();
  autres.maj(state === TITLE, lang);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = 1; ctx.fillStyle = COL.BG; ctx.fillRect(0, 0, vw, vh);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (state === TITLE) { renderTitle(); return; }
  if (state === OPTIONS) { renderOptions(); return; }
  shakeX = shake > 0 ? (Math.random() - 0.5) * shake * 24 : 0;
  shakeY = shake > 0 ? (Math.random() - 0.5) * shake * 24 : 0;
  if (audioMode) renderAudioWorld(); else renderWorld();
  renderHud();
  if (state === DEAD) renderOverlay(L('deadTitle'), COL.RED, null, [L('retry')]);
  else if (state === CLEAR) {
    if (dailyMode) { const r = avantProchain(); renderOverlay(L('dailyWin'), COL.GOLD, null, [
      L('dailyLine', formatTime(dailyTime), echoesUsed, shardsTaken, shardsTotal),
      L('score', dailyScore) + (newRecord ? L('newRecord') : L('recordWas', dailyBest)),
      L('defiSerie', defiSt.count, defiSt.best), L('defiProchain', Math.floor(r / 3600000), String(Math.floor(r % 3600000 / 60000)).padStart(2, '0')),
      '', L('toMenu')], 0.2); }
    else renderOverlay(L('clearTitle'), COL.GOLD, stars, [L('clearLine', level, echoesUsed, par3), '', L('deeper')]);
  }
  ctx.globalAlpha = 1;
}

function renderAudioWorld() {
  const pxs = sx(px), pys = sy(py);
  for (const p of pulses) {
    const r = (t - p.start) * p.speed;
    if (r <= p.revealR) strokeCircle(sx(p.ox), sy(p.oy), r * cell, COL.CYAN, (1 - r / p.revealR) * 0.3, 2);
  }
  fillCircle(pxs, pys, cell * 0.4, COL.WHITE, 0.08);
  fillCircle(pxs, pys, cell * 0.09, COL.WHITE, 0.8);
  text(L('audioLabel'), vw / 2, vh * 0.78, 11, COL.WHITE, 0.5, 'center', 0.4);
  const va = state === DEAD ? min(0.55, (t - stateT) * 2) : beatFlash * 0.55;
  if (va > 0.01) { ctx.globalAlpha = va; ctx.fillStyle = vignette; ctx.fillRect(0, 0, vw, vh); }
  ctx.globalAlpha = 1;
}

function renderWorld() {
  const dead = state === DEAD, f = cur;
  const halfW = vw / 2 / cell + 1, halfH = vh / 2 / cell + 1;
  const glowW = cell * 0.13, coreW = max(1.5, cell * 0.035);

  for (const b of f.beacons) if (b.alive) fillCircle(sx(b.x), sy(b.y), cell * C.BEACON_LIGHT, COL.ICE, 0.05);

  for (const w of walls) {
    if (w.broken || abs(w.mx - camX) > halfW || abs(w.my - camY) > halfH) continue;
    const md = hypot(w.mx - px, w.my - py);
    let a = max(fade(w.lit, C.WALL_FADE), md < 1.3 ? (1.3 - md) / 1.3 * 0.3 : 0, beaconLight(w.mx, w.my));
    if (easyOn() && w.seen) a = max(a, 0.09);
    if (a <= 0.01) continue;
    const x1 = sx(w.x1), y1 = sy(w.y1), x2 = sx(w.x2), y2 = sy(w.y2);
    const col = w.fragile ? COL.CRACK : COL.CYAN;
    ctx.globalAlpha = a * 0.22; ctx.strokeStyle = col; ctx.lineWidth = glowW; line(x1, y1, x2, y2);
    ctx.globalAlpha = a; ctx.strokeStyle = t - w.lit < 0.18 ? COL.WHITE : col; ctx.lineWidth = coreW;
    if (w.fragile) {
      const nx = -(y2 - y1) * 0.08, ny = (x2 - x1) * 0.08;
      const ax = x1 + (x2 - x1) * 0.35 + nx, ay = y1 + (y2 - y1) * 0.35 + ny;
      const bx = x1 + (x2 - x1) * 0.65 - nx, by = y1 + (y2 - y1) * 0.65 - ny;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(x2, y2); ctx.stroke();
    } else line(x1, y1, x2, y2);
  }

  for (const p of pulses) {
    const r = (t - p.start) * p.speed;
    if (r > p.revealR) continue;
    const a = 1 - r / p.revealR, col = p.kind === DECOY ? COL.GOLD : COL.CYAN, ox = sx(p.ox), oy = sy(p.oy);
    if (p.kind === CONE) {
      ctx.globalAlpha = a * 0.7; ctx.strokeStyle = col; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(ox, oy, r * cell, p.dir - p.half, p.dir + p.half); ctx.stroke();
    } else {
      strokeCircle(ox, oy, r * cell, col, a * 0.55, 2);
      if (r > 0.5) strokeCircle(ox, oy, (r - 0.5) * cell, col, a * 0.18, 2);
    }
  }

  if (f.hasExit) {
    const ed = hypot(f.exitX - px, f.exitY - py);
    const ea = max(fade(f.exitLit, 3.2), ed < 1.6 ? (1.6 - ed) / 1.6 * 0.8 : 0, beaconLight(f.exitX, f.exitY) * 1.6);
    if (ea > 0) {
      const ex = sx(f.exitX), ey = sy(f.exitY);
      for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1; strokeCircle(ex, ey, cell * (0.12 + ph * 0.38), COL.GOLD, ea * (1 - ph) * 0.8, 2); }
      diamond(ex, ey, cell * 0.11, t * 1.5, COL.GOLD, ea);
    }
  }

  if (f.stairsTo >= 0) {
    const sd = hypot(f.stairsX - px, f.stairsY - py);
    const sa = max(fade(f.stairsLit, 3.2), sd < 1.6 ? (1.6 - sd) / 1.6 * 0.8 : 0, beaconLight(f.stairsX, f.stairsY) * 1.6);
    if (sa > 0) {
      const sxp = sx(f.stairsX), syp = sy(f.stairsY), down = f.stairsTo > floorIdx;
      ctx.lineWidth = 2; ctx.strokeStyle = COL.STAIRS;
      for (let k = 0; k < 3; k++) {
        const r = cell * (0.32 - k * 0.09), rot = t * (down ? 1 : -1) + k * 0.4;
        ctx.globalAlpha = clamp(sa * (0.4 + k * 0.3), 0, 1); ctx.beginPath();
        for (let q = 0; q < 4; q++) { const ang = rot + q * Math.PI / 2; const x = sxp + cos(ang) * r, y = syp + sin(ang) * r; q ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      }
      text(down ? '▼' : '▲', sxp, syp + 4, 12, COL.STAIRS, sa * 0.86);
    }
  }

  for (const s of shards) {
    if (s.taken) continue;
    const d = hypot(s.x - px, s.y - py);
    const a = max(fade(s.lit, 3.5), d < 1.3 ? (1.3 - d) / 1.3 : 0, beaconLight(s.x, s.y) * 1.6);
    if (a <= 0.01) continue;
    fillCircle(sx(s.x), sy(s.y), cell * 0.2, COL.VIOLET, a * 0.25);
    diamond(sx(s.x), sy(s.y), cell * 0.08, t * 2, COL.VIOLET, a);
  }

  for (const b of f.beacons) {
    const bx = sx(b.x), by = sy(b.y);
    if (b.alive) {
      const pulse = 0.8 + 0.2 * sin(t * 4 + b.x);
      fillCircle(bx, by, cell * 0.22, COL.ICE, 0.18 * pulse);
      fillCircle(bx, by, cell * 0.06, COL.ICE, pulse);
      strokeCircle(bx, by, cell * 0.13, COL.ICE, 0.6 * pulse, 1.5);
    } else strokeCircle(bx, by, cell * 0.08, COL.ICE, 0.12, 1);
  }

  for (const d of decoys) diamond(sx(d.x), sy(d.y), cell * 0.07, t * 6, COL.GOLD, d.fired ? fade(d.start + 0.35, 2.65) : 1);

  for (const h of hunters) {
    if (!h.active) continue;
    const d = hypot(h.x - px, h.y - py), rad = radiusOf(h);
    let a = dead ? 1 : max(fade(h.lit, 1.2), d < 1.2 + rad ? (1.2 + rad - d) / 1.2 * 0.7 : 0);
    a = max(a, beaconLight(h.x, h.y) * 1.5);
    if (a > 0.01) drawHunter(h, sx(h.x), sy(h.y), min(1, a));
  }

  for (const p of particles) fillCircle(sx(p.x), sy(p.y), p.size, p.color, p.life / p.maxLife);

  const br = 1 + 0.06 * sin(t * 3), pxs = sx(px), pys = sy(py);
  fillCircle(pxs, pys, cell * 0.55 * br, COL.WHITE, 0.05);
  fillCircle(pxs, pys, cell * 0.3 * br, COL.WHITE, 0.12);
  fillCircle(pxs, pys, cell * 0.11, COL.WHITE, dead ? 0.3 : 1);

  if (input.aimArmed && state === PLAY) {
    const dx = input.x - input.ox, dy = input.y - input.oy;
    ctx.lineWidth = 1.5; ctx.strokeStyle = COL.CYAN;
    if (hypot(dx, dy) > 20) {
      const ang = atan2(dy, dx), len = C.CONE_R * cell * 0.45;
      ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(pxs + cos(ang - C.CONE_HALF) * len, pys + sin(ang - C.CONE_HALF) * len); ctx.lineTo(pxs, pys);
      ctx.lineTo(pxs + cos(ang + C.CONE_HALF) * len, pys + sin(ang + C.CONE_HALF) * len); ctx.stroke();
      ctx.beginPath(); ctx.arc(pxs, pys, len, ang - C.CONE_HALF, ang + C.CONE_HALF); ctx.stroke();
    } else strokeCircle(pxs, pys, cell * 0.45, COL.CYAN, 0.25 + 0.15 * sin(t * 10), 1.5);
    text(L('aim'), vw / 2, vh * 0.74, 11, COL.CYAN, 0.8, 'center', 0.3);
  }

  const ha = fade(hintT, 1.3);
  if (ha > 0 && state === PLAY) {
    const ang = atan2(goalY() - py, goalX() - px), rad = min(vw, vh) * 0.4;
    const hx = vw / 2 + cos(ang) * rad, hy = vh / 2 + sin(ang) * rad, s = 11;
    ctx.globalAlpha = ha * 0.9; ctx.fillStyle = f.hasExit ? COL.GOLD : COL.STAIRS; ctx.beginPath();
    ctx.moveTo(hx + cos(ang) * s * 1.4, hy + sin(ang) * s * 1.4);
    ctx.lineTo(hx + cos(ang + 2.4) * s, hy + sin(ang + 2.4) * s);
    ctx.lineTo(hx + cos(ang - 2.4) * s, hy + sin(ang - 2.4) * s);
    ctx.closePath(); ctx.fill();
  }

  if (input.touching && input.moved && !input.aimArmed && !gyro && state === PLAY) {
    strokeCircle(input.ox, input.oy, C.JOY_R, COL.WHITE, 0.12, 1.5);
    fillCircle(input.x, input.y, 18, COL.WHITE, 0.18);
  }

  const va = dead ? min(0.55, (t - stateT) * 2) : beatFlash * 0.55;
  if (va > 0.01) { ctx.globalAlpha = va; ctx.fillStyle = vignette; ctx.fillRect(0, 0, vw, vh); }
  ctx.globalAlpha = 1;
}
