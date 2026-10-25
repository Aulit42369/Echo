// ÉCHO — rendu des Ombres, HUD, écrans (accueil, options, fin).
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

function drawHunter(h, hx, hy, a) {
  if (h.type === PATROUILLE) {
    fillCircle(hx, hy, cell * 0.34, COL.PINK, a * 0.18);
    ctx.globalAlpha = a; ctx.strokeStyle = COL.PINK; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let k = 0; k < 4; k++) { const ang = t * 2 + k * Math.PI / 2; const x = hx + cos(ang) * cell * 0.22, y = hy + sin(ang) * cell * 0.22; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.closePath(); ctx.stroke();
    fillCircle(hx, hy, cell * 0.07, COL.PINK, a);
  } else if (h.type === AVEUGLE) {
    for (let k = 0; k < 3; k++) { const ph = (t * 1.2 + k / 3) % 1; strokeCircle(hx, hy, cell * (0.12 + ph * 0.3), COL.ORANGE, a * (1 - ph) * 0.7, 1.5); }
    fillCircle(hx, hy, cell * (0.15 + 0.02 * sin(t * 6)), COL.ORANGE, a);
  } else if (h.type === REFLET) {
    fillCircle(hx, hy, cell * 0.4, COL.PALE, a * 0.15);
    strokeCircle(hx, hy, cell * 0.16, COL.RED, a * 0.8, 2);
    fillCircle(hx, hy, cell * 0.1, COL.PALE, a);
  } else if (h.type === MERE) {
    const R = cell * radiusOf(h) * 0.9;
    fillCircle(hx, hy, R * 1.5, COL.MOTHER, a * 0.35);
    ctx.globalAlpha = a; ctx.fillStyle = COL.RED; ctx.beginPath();
    const n = 22;
    for (let k = 0; k < n; k++) {
      const ang = k * TAU / n - t * 0.5, rr = R * (k % 2 === 0 ? 1 + 0.12 * sin(t * 5 + k) : 0.55);
      const x = hx + cos(ang) * rr, y = hy + sin(ang) * rr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    fillCircle(hx, hy, R * 0.3, COL.VIOLET, a * (0.7 + 0.3 * sin(t * 3)));
    fillCircle(hx, hy, R * 0.12, COL.BG, a);
  } else {
    fillCircle(hx, hy, cell * 0.34, COL.RED, a * 0.2);
    ctx.globalAlpha = a; ctx.fillStyle = COL.RED; ctx.beginPath();
    const n = 14;
    for (let k = 0; k < n; k++) {
      const ang = k * TAU / n + t * 0.8, rr = cell * 0.22 * (k % 2 === 0 ? 1 : 0.6 + 0.2 * sin(t * 9 + k));
      const x = hx + cos(ang) * rr, y = hy + sin(ang) * rr; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    fillCircle(hx, hy, cell * 0.06, COL.BG, a);
  }
}

function toolButton(bx, col, left, label, isDiamond) { // label déjà traduit, compteur inclus
  const by = buttonY(), av = left > 0 ? 1 : 0.3;
  fillCircle(bx, by, 32, col, 0.07 * av);
  strokeCircle(bx, by, 32, col, 0.7 * av, 1.5);
  strokeCircle(bx, by, 16, col, 0.45 * av, 1.5);
  if (isDiamond) diamond(bx, by, 6, Math.PI / 4, col, av); else fillCircle(bx, by, 5, col, av);
  text(label, bx, by + 48, 10, col, av * 0.8, 'center', 0.2);
}

function renderHud() {
  const top = 44, m = 22;
  if (dailyMode) {
    text(L('daily'), m, top, 13, COL.WHITE, 0.82, 'left', 0.25);
    text(`⏱ ${formatTime(state === CLEAR ? dailyTime : t - levelStartT)}   ◆ ${shardsTaken}/${shardsTotal}`, m, top + 20, 11, COL.GOLD, 0.78, 'left', 0.25);
  } else {
    const floorTxt = floors.length > 1 ? ' · ' + L('floor', floorIdx + 1, floors.length) : '';
    text(L('level', level) + floorTxt + (easyOn() ? ' · ' + L('easyTag') : ''), m, top, 13, COL.WHITE, 0.82, 'left', 0.25);
    text('◆ ' + L('shards', shardsTaken, shardsTotal), m, top + 20, 11, COL.VIOLET, 0.75, 'left', 0.25);
  }
  const mother = hunters.find(h => h.type === MERE);
  if (mother) text(L('mother', mother.growth), m, top + 38, 11, COL.RED, 0.78, 'left', 0.25);

  const r = 5, gap = 18;
  for (let i = 0; i < C.MAX_ENERGY; i++) {
    const x = vw - m - (C.MAX_ENERGY - 1 - i) * gap, y = top - 4;
    if (energy >= i + 1) fillCircle(x, y, r, COL.CYAN, 1);
    else {
      strokeCircle(x, y, r, COL.CYAN, 0.25, 1.5);
      if (i === Math.floor(energy)) {
        ctx.globalAlpha = 0.9; ctx.strokeStyle = COL.CYAN; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + TAU * (energy - i)); ctx.stroke();
      }
    }
  }
  text(L('echoes', echoesUsed), vw - m + r, top + 20, 11, COL.CYAN, 0.6, 'right', 0.25);

  if (state === PLAY) {
    if (decoysMax > 0) toolButton(decoyX(), COL.GOLD, decoysLeft, L('decoy', decoysLeft), true);
    if (beaconsMax > 0) toolButton(beaconX(), COL.ICE, beaconsLeft, L('beacon', beaconsLeft), false);
  }

  const since = t - levelStartT;
  if (state === PLAY && since < 2.4) {
    const a = since < 0.3 ? since / 0.3 : min(1, (2.4 - since) / 0.8);
    const label = dailyMode ? L('daily') : isBoss() ? L('motherBanner') : L('level', level);
    text(label, vw / 2, vh * 0.3, dailyMode || isBoss() ? 22 : 30, dailyMode ? COL.GOLD : isBoss() ? COL.RED : COL.WHITE, a * 0.9, 'center', 0.5);
  }
  const fs = t - floorBannerT;
  if (state === PLAY && fs < 1.6) text(L('floorBanner', floorIdx + 1), vw / 2, vh * 0.3, 22, COL.STAIRS, min(1, (1.6 - fs) / 0.6) * 0.9, 'center', 0.5);
  const hints = hintsFor();
  if (state === PLAY && hints.length && since < 11 && !input.aimArmed && !audioMode) {
    const a = min(1, (11 - since) / 1.5) * min(1, since / 0.8);
    hints.forEach((l, k) => text(l, vw / 2, vh * 0.62 + k * 22, 13, COL.WHITE, a * 0.67, 'center', 0.05));
  }
  ctx.globalAlpha = 1;
}

function renderOverlay(title, col, starCount, lines, top = 0.42) {
  const a = min(1, (t - stateT) * 1.5);
  ctx.globalAlpha = a * 0.6; ctx.fillStyle = COL.BLACK; ctx.fillRect(0, 0, vw, vh);
  text(title, vw / 2, vh * top, 24, col, a, 'center', 0.3);
  let y = vh * top + 34;
  if (starCount !== null) {
    for (let k = 0; k < 3; k++) {
      const sa = clamp((t - stateT - 0.3 - k * 0.25) / 0.2, 0, 1);
      text(k < starCount ? '★' : '☆', vw / 2 + (k - 1) * 40, y + 8, 30, k < starCount ? COL.GOLD : COL.WHITE, sa * a * (k < starCount ? 1 : 0.2));
    }
    y += 44;
  }
  lines.forEach((l, k) => text(l, vw / 2, y + k * 20, 13, COL.WHITE, a * 0.75, 'center', 0.06));
  ctx.globalAlpha = 1;
}

function renderTitle() {
  const cx = vw / 2, cy = vh * 0.22, span = min(vw, 520);
  for (let k = 0; k < 4; k++) { const ph = (t * 0.3 + k / 4) % 1; strokeCircle(cx, cy, ph * span * 0.7, COL.CYAN, (1 - ph) * 0.5, 1.5); }
  const ga = (sin(t * 0.7) * 0.5 + 0.5) * 0.6;
  fillCircle(cx + span * 0.3 * cos(t * 0.25), cy + span * 0.22 * sin(t * 0.31), 4, COL.RED, ga);
  fillCircle(cx, cy, 18, COL.WHITE, 0.15);
  fillCircle(cx, cy, 7, COL.WHITE, 1);

  text('ÉCHO', cx + 8, vh * 0.43, min(58, vw * 0.15), COL.WHITE, 1, 'center', 0.55);
  text(L('tagline'), cx, vh * 0.43 + 34, 15, COL.WHITE, 0.67, 'center', 0.08);

  const colors = [COL.CYAN, COL.GOLD, COL.WHITE, COL.WHITE];
  for (const b of titleButtons()) {
    const col = colors[b.k];
    roundRect(b.x, b.y, b.w, b.h, 24);
    ctx.globalAlpha = b.k === 0 ? 0.10 : 0.05; ctx.fillStyle = col; ctx.fill();
    ctx.globalAlpha = b.k >= 2 ? 0.35 : 0.7; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    text(b.label, b.x + b.w / 2 + 2, b.y + b.h / 2 + 5, b.k >= 2 ? 13 : 15, col, 0.9, 'center', 0.3);
  }

  const info = [];
  if (best > 0) info.push([L('record', best, totalStars), COL.WHITE, 0.5]);
  if (!accueil || Defi.parisDate().num !== accueil.j.num) majAccueil(); // minuit de Paris passé pendant l'accueil
  info.push([accueil.fait ? L('defiFait', accueil.j.n, nombre(accueil.score)) : L('defiAFaire', accueil.j.n), COL.GOLD, 0.85, accueil.serie]);
  info.push([audioMode ? L('audioMenuHint') : L('headphones'), COL.GOLD, 0.67]);
  if (!matchMedia('(pointer: coarse)').matches) info.push([L('keyboard'), COL.CYAN, 0.55]);
  info.forEach((l, k) => {
    const y = vh * 0.88 + k * 18, suite = l[3] > 0 ? '      ' + l[3] : '';
    text(l[0] + suite, cx, y, 11, l[1], l[2], 'center', 0.1);
    if (suite) { const w = ctx.measureText(l[0] + suite).width; flamme(cx - w / 2 + ctx.measureText(l[0] + '   ').width, y - 4, 5.5, l[2]); }
  });
  ctx.globalAlpha = 1;
}

function majLienLegal() {
  const lienLegal = document.getElementById('lienLegal');
  const voir = state === OPTIONS;
  if (voir && lienLegal.textContent !== L('legal')) lienLegal.textContent = L('legal');
  if (lienLegal.hidden === voir) lienLegal.hidden = !voir;
}

function renderOptions() {
  text(L('options'), vw / 2, vh * 0.11, 26, COL.WHITE, 0.9, 'center', 0.5);
  const names = [L('optEasy'), L('optReal'), L('optAudio'), L('optGyro'), L('optLang')];
  const desc = [L('descEasy'), L('descReal'), L('descAudio'), tilt.available ? L('descGyro') : L('descGyroNA'), L('descLang')];
  const on = [easy, realistic, audioMode, gyro, true];
  const values = [easy, realistic, audioMode, gyro].map(v => L(v ? 'yes' : 'no')).concat([I18N.langs[lang].name]);
  const cols = [COL.VIOLET, COL.CYAN, COL.GOLD, COL.ICE, COL.WHITE];
  for (const b of optionButtons()) {
    if (b.k === 5) {
      roundRect(b.x, b.y, b.w, b.h, 26); ctx.globalAlpha = 0.35; ctx.strokeStyle = COL.WHITE; ctx.lineWidth = 1.5; ctx.stroke();
      text(L('back'), b.x + b.w / 2, b.y + b.h / 2 + 5, 13, COL.WHITE, 0.8, 'center', 0.3);
      continue;
    }
    const col = b.k === 3 && !tilt.available ? COL.GRAY : cols[b.k];
    const lit = on[b.k] && b.k !== 4;
    roundRect(b.x, b.y, b.w, b.h, 26);
    ctx.globalAlpha = lit ? 0.12 : 0.03; ctx.fillStyle = col; ctx.fill();
    ctx.globalAlpha = lit || b.k === 4 ? 0.8 : 0.3; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.stroke();
    text(names[b.k], b.x + 22, b.y + b.h / 2 + 5, 13, col, lit || b.k === 4 ? 0.95 : 0.75, 'left', 0.2);
    text(values[b.k], b.x + b.w - 22, b.y + b.h / 2 + 5, 13, col, lit || b.k === 4 ? 0.95 : 0.75, 'right', 0.1);
    text(desc[b.k], vw / 2, b.y + b.h + 17, 11, COL.WHITE, 0.47, 'center', 0.03);
  }
  text(L('dailyNote'), vw / 2, vh * 0.96, 11, COL.WHITE, 0.5, 'center', 0.03);
  ctx.globalAlpha = 1;
}
