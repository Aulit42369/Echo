// ÉCHO — boucle logique : menus, partie, mode audio, changement d'étage, fin de niveau.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Logique
// =====================================================================
function update(dt) {
  t += dt;
  const tap = input.tap, cone = input.cone, decoy = input.decoy, beacon = input.beacon, back = input.back, ta = input.titleAction;
  input.tap = input.cone = input.decoy = input.beacon = input.back = false; input.titleAction = -1;
  if (back && state !== TITLE) { goTitle(); say(L('sMenu')); }

  if (state === PLAY && input.touching && !input.moved && !input.aimArmed && performance.now() - input.downTime > C.AIM_DELAY) {
    input.aimArmed = true; haptics.tick(8);
  }

  if (state === TITLE) {
    if (ta >= 0) titleAction(ta);
    else if (tap) titleTap(input.tapX, input.tapY);
    sound.setLoop(0.12, 0.9);
  } else if (state === OPTIONS) {
    if (tap) optionsTap(input.tapX, input.tapY);
    sound.setLoop(0.1, 0.9);
  } else if (state === PLAY) {
    updatePlay(dt, tap, cone, decoy, beacon);
  } else if (state === DEAD) {
    sound.setLoop(0.05, 0.7);
    if (tap && t - stateT > 0.8) startLevel();
  } else if (state === CLEAR) {
    sound.setLoop(0.1, 1.1);
    if (tap && t - stateT > 0.8) { if (dailyMode) goTitle(); else { level++; startLevel(); } }
  }
  const drag = 1 - dt * 2.2;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i]; p.life -= dt;
    if (p.life <= 0) { particles[i] = particles[particles.length - 1]; particles.pop(); continue; }
    p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= drag; p.vy *= drag;
  }
  shake = max(0, shake - dt * 2.5);
  beatFlash = max(0, beatFlash - dt * 1.8);
}

// ---------- menus ----------
function titleButtons() {
  const labels = [L('play'), L('daily'), L('options')];
  if (installEvt && !standalone()) labels.push(L('install'));
  const w = min(vw * 0.66, 340), h = 48;
  return labels.map((label, k) => { const cy = vh * (0.58 + k * 0.075); return { label, k, x: vw / 2 - w / 2, y: cy - h / 2, w, h }; });
}
function titleAction(k) {
  if (k === 0) { dailyMode = false; level = 1; startLevel(); }
  else if (k === 1) { // défi figé au lancement : une partie commencée à 23 h 59 reste celle de ce jour
    dailyMode = true; defiJour = Defi.today(); dailySeed = Defi.seed('echo', defiJour.key); dailyBest = store.get('daily_' + defiJour.num, 0); startLevel();
  }
  else if (k === 2) { state = OPTIONS; stateT = t; pushGameHistory(); say(L('sOptions')); }
  else if (k === 3 && installEvt) { installEvt.prompt(); installEvt.userChoice.finally(() => { installEvt = null; }); }
  haptics.tick();
}
function titleTap(x, y) {
  if (audioMode && y < vh * 0.5) { titleAction(0); return; }
  for (const b of titleButtons()) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.k <= 1 && matchMedia('(pointer: coarse)').matches && !standalone() && document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      titleAction(b.k); return;
    }
  }
}
function optionButtons() {
  const top = vh * 0.2, gap = min(84, (vh * 0.93 - 50 - top) / 5), w = min(vw * 0.8, 380), h = min(52, gap - 26);
  const out = [];
  for (let k = 0; k < 6; k++) {
    const cy = k < 5 ? top + k * gap : top + 5 * gap + 10;
    out.push({ k, x: vw / 2 - w / 2, y: cy - h / 2, w, h });
  }
  return out;
}
function optionsTap(x, y) {
  for (const b of optionButtons()) {
    if (!(x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h)) continue;
    if (b.k === 0) { easy = !easy; store.set('easy', easy); say(L(easy ? 'sEasyOn' : 'sEasyOff')); }
    else if (b.k === 1) { realistic = !realistic; store.set('realistic', realistic); say(L(realistic ? 'sRealOn' : 'sRealOff')); }
    else if (b.k === 2) { audioMode = !audioMode; store.set('audio', audioMode); speech.say(L(audioMode ? 'sAudioOn' : 'sAudioOff')); }
    else if (b.k === 3 && tilt.available) {
      gyro = !gyro; store.set('gyro', gyro);
      if (gyro) tilt.start(); else tilt.stop();
      say(L(gyro ? 'sGyroOn' : 'sGyroOff'));
    } else if (b.k === 4) {
      lang = (lang + 1) % I18N.langs.length; store.set('lang', lang);
      document.documentElement.lang = I18N.langs[lang].code;
      say(I18N.langs[lang].name);
    } else if (b.k === 5) { goTitle(); say(L('sMenu')); }
    haptics.tick();
    return;
  }
}

// ---------- partie ----------
const goalX = () => cur.hasExit ? cur.exitX : cur.stairsX;
const goalY = () => cur.hasExit ? cur.exitY : cur.stairsY;

function updatePlay(dt, tap, cone, decoy, beacon) {
  energy = min(C.MAX_ENERGY, energy + dt / (easyOn() ? C.REGEN * 0.8 : C.REGEN));

  // Déplacement : inclinaison, joystick ou clavier
  let tx = 0, ty = 0;
  if (gyro && tilt.has) { if (!input.aimArmed) [tx, ty] = tilt.vector(); }
  else if (input.touching && input.moved && !input.aimArmed) { tx = (input.x - input.ox) / C.JOY_R; ty = (input.y - input.oy) / C.JOY_R; }
  if (!tx && !ty) {
    if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) tx -= 1;
    if (keys.has('arrowright') || keys.has('d')) tx += 1;
    if (keys.has('arrowup') || keys.has('w') || keys.has('z')) ty -= 1;
    if (keys.has('arrowdown') || keys.has('s')) ty += 1;
  }
  const l = hypot(tx, ty); if (l > 1) { tx /= l; ty /= l; }
  const k = min(1, dt * 12);
  vx += (tx * C.SPEED - vx) * k; vy += (ty * C.SPEED - vy) * k;
  px += vx * dt; py += vy * dt;
  if (hypot(vx, vy) > 0.3) facing = atan2(vy, vx);
  collide();
  bumpCd -= dt;
  const push = hypot(pushX, pushY);
  if (push > 0.004 && bumpCd <= 0 && hypot(tx, ty) > 0.3) {
    bumpCd = 0.3;
    const rate = abs(pushY) > abs(pushX) ? (pushY > 0 ? 1.2 : 0.85) : 1;
    sound.play('bump', audioMode ? 0.6 : 0.18, -pushX / push * 0.9, rate);
    if (audioMode) haptics.tick(10);
  }

  if (!trailOn && hypot(px - 0.5, py - 0.5) > 2.5) trailOn = true;
  if (trailOn) {
    trailAcc += dt;
    while (trailAcc >= C.TRAIL_DT) {
      trailAcc -= C.TRAIL_DT;
      const i = trailCount % C.TRAIL_N;
      trailX[i] = px; trailY[i] = py; trailF[i] = floorIdx; trailCount++;
    }
  }

  if (tap) firePulse(RADIAL, facing);
  if (cone) firePulse(CONE, input.coneAngle);
  if (decoy) throwDecoy();
  if (beacon) placeBeacon();
  updateDecoys();
  updatePulses();

  if (answerAt >= 0 && t >= answerAt) { answerAt = -1; hintT = t; playAt('answer', goalX(), goalY(), 0.9); }

  syncReflet();
  floors.forEach((f, fi) => updateHunters(f, fi === floorIdx, dt));
  updateBeacons();

  if (hypot(vx, vy) / C.SPEED > 0.8) {
    for (const h of hunters) if (h.type === RODEUSE && !h.hunting && hypot(h.x - px, h.y - py) < 1.7) alert(cur, h, cellOf(maze, px, py));
  }
  for (const h of hunters) if (h.active && hypot(h.x - px, h.y - py) < radiusOf(h)) { die(); return; }

  for (const s of shards) {
    if (!s.taken && hypot(s.x - px, s.y - py) < 0.4) {
      s.taken = true; shardsTaken++; energy = min(C.MAX_ENERGY, energy + 2);
      sound.play('shard', 0.8); haptics.tick(20); burst(s.x, s.y, 24, 2.2, COL.VIOLET, 0.8, 2.2); say(L('sShard'));
    }
  }

  let nd = 99, anyHunting = false;
  floors.forEach((f, fi) => {
    const here = fi === floorIdx;
    for (const h of f.hunters) {
      if (!h.active) continue;
      const d = hypot(h.x - px, h.y - py);
      if (here) { nd = min(nd, d - (radiusOf(h) - 0.36)); if (h.hunting) anyHunting = true; }
      const step = hypot(h.x - h.lx, h.y - h.ly); h.lx = h.x; h.ly = h.y;
      if (step < 1) h.stepAcc += step;
      if (h.stepAcc > 0.5) {
        h.stepAcc = 0;
        if (here && d < 6) playAt('step', h.x, h.y, (1 - d / 6) * 0.55, (0.85 + Math.random() * 0.3) * (h.type === MERE ? 0.7 : 1));
        else if (!here && d < 5) playAt('step', h.x, h.y, (1 - d / 5) * 0.3, 0.6);
      }
    }
  });
  if (nd < C.BEAT_R) {
    beatTimer -= dt;
    if (beatTimer <= 0) {
      const i = clamp(1 - nd / C.BEAT_R, 0, 1);
      beatTimer = 0.32 + 0.9 * (1 - i);
      haptics.heartbeat(i); sound.play('thump', 0.3 + 0.6 * i);
      beatFlash = max(beatFlash, 0.25 + 0.6 * i);
    }
  } else beatTimer = min(beatTimer, 0.15);
  const danger = clamp(1 - nd / 7, 0, 1);
  sound.setLoop(0.18 + 0.55 * danger + (anyHunting ? 0.12 : 0), 0.95 + 0.2 * danger);

  if (audioMode) audioCues(dt);

  const ds = cur.stairsTo >= 0 ? hypot(cur.stairsX - px, cur.stairsY - py) : 99;
  if (ds > 0.6) stairsArmed = true;
  if (stairsArmed && ds < 0.35) { changeFloor(cur.stairsTo); return; }

  if (cur.hasExit && hypot(cur.exitX - px, cur.exitY - py) < 0.38) { clearLevel(); return; }

  const c = min(1, dt * 6);
  camX += (px - camX) * c; camY += (py - camY) * c;
}

// Mode audio : passages ouverts, direction de l'objectif, éclats proches
function audioCues(dt) {
  scanTimer -= dt;
  if (scanTimer <= 0) {
    scanTimer = 0.8;
    const c = cellOf(maze, px, py);
    let delay = 0;
    for (const d of [N, E, S, W]) {
      if (!maze.isOpen(c, d)) continue;
      const pan = d === E ? 0.9 : d === W ? -0.9 : 0;
      const rate = d === N ? 1.26 : d === S ? 0.8 : 1;
      sound.play('open', 0.35, pan, rate, delay);
      delay += 0.09;
    }
  }
  goalTimer -= dt;
  if (goalTimer <= 0) {
    goalTimer = 2.2;
    const d = hypot(goalX() - px, goalY() - py), dy = goalY() - py;
    playAt('answer', goalX(), goalY(), 0.2 + 0.5 * max(0, 1 - d / 14), dy < -0.5 ? 1.15 : dy > 0.5 ? 0.87 : 1);
  }
  shardTimer -= dt;
  if (shardTimer <= 0) {
    shardTimer = 1.6;
    const s = shards.find(s => !s.taken && hypot(s.x - px, s.y - py) < 3);
    if (s) playAt('shard', s.x, s.y, 0.3);
  }
}

function changeFloor(to) {
  const down = to > floorIdx;
  setFloor(to);
  stairsArmed = false; pulses = []; decoys = []; answerAt = -1; floorBannerT = t;
  sound.play('stairs', 0.8, 0, down ? 1 : 1.25); haptics.tick(30);
  say(L(down ? 'sDown' : 'sUp'));
}

function clearLevel() {
  state = CLEAR; stateT = t;
  sound.play('win'); haptics.success(); burst(cur.exitX, cur.exitY, 40, 3, COL.GOLD, 1.2, 2.5);
  if (dailyMode) {
    dailyTime = t - levelStartT;
    dailyScore = max(0, Math.floor(10000 - dailyTime * 40 - echoesUsed * 120 + shardsTaken * 400));
    if (dailyScore > dailyBest) { dailyBest = dailyScore; newRecord = true; store.set('daily_' + defiJour.num, dailyBest); }
    // 1er appel : série du jour ; 2e : même jour, ne range que le texte qui contient cette série
    defiSt = Defi.record('echo', defiJour, dailyScore, '');
    defiTexte = texteDefi(defiSt.count);
    defiSt = Defi.record('echo', defiJour, dailyScore, defiTexte);
    defiPanneau(true);
    say(L('sDefiFin', nombre(dailyScore), defiSt.count));
  } else {
    stars = echoesUsed <= par3 ? 3 : echoesUsed <= par2 ? 2 : 1;
    if (stars > store.get('stars_' + level, 0)) store.set('stars_' + level, stars);
    if (level > best) { best = level; store.set('best', best); }
    totalStars = sumStars();
    say(stars > 1 ? L('sClearMany', stars) : L('sClearOne'));
  }
}
