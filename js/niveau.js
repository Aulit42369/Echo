// ÉCHO — construction d'un niveau (étages, Ombres, sortie, éclats).
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Construction d'un niveau
// =====================================================================
const ccx = (m, i) => (i % m.cols) + 0.5;
const ccy = (m, i) => ((i / m.cols) | 0) + 0.5;
const cellOf = (m, x, y) => m.idx(clamp(Math.floor(x), 0, m.cols - 1), clamp(Math.floor(y), 0, m.rows - 1));

function newHunter(type, x, y, atCell) {
  return { type, x, y, atCell, path: [], prevCell: -1, hunting: false, lit: -100, lastPulse: -1, active: type !== REFLET,
    route: null, routeIdx: 0, routeDir: 1, senseTimer: 0, lx: x, ly: y, stepAcc: 0, growth: 0 };
}
const radiusOf = h => h.type === MERE ? min(0.75, 0.3 + 0.035 * h.growth) : 0.36;

function buildFloor(gen, cols, rows, fragileCount) {
  const m = new Maze(cols, rows, gen);
  const f = { maze: m, walls: m.buildWalls(), hunters: [], shards: [], beacons: [], hasExit: false, exitX: 0, exitY: 0,
    exitLit: -100, exitLastPulse: -1, stairsTo: -1, stairsX: 0, stairsY: 0, stairsLit: -100, stairsLastPulse: -1 };
  const interior = shuffle(f.walls.filter(w => w.b >= 0), gen);
  for (let k = 0; k < min(fragileCount, interior.length); k++) interior[k].fragile = true;
  return f;
}

// Cellule loin de `from` par le chemin ET à vol d'oiseau
function farCell(m, from, dist) {
  const fx = ccx(m, from), fy = ccy(m, from), maxE = hypot(m.cols, m.rows);
  let best = 0, score = -1;
  for (let i = 0; i < dist.length; i++) {
    const s = dist[i] * (0.5 + hypot(ccx(m, i) - fx, ccy(m, i) - fy) / maxE);
    if (s > score) { score = s; best = i; }
  }
  return best;
}

function addHunter(f, type, c0, gen) {
  const m = f.maze;
  const h = newHunter(type, ccx(m, c0), ccy(m, c0), c0);
  if (type === PATROUILLE) {
    const dh = m.bfs(c0);
    const ends = [...dh.keys()].filter(i => dh[i] >= 6 && dh[i] <= 11);
    let end;
    if (ends.length) end = ends[rint(gen, ends.length)];
    else { end = 0; for (let i = 0; i < dh.length; i++) if (dh[i] > dh[end]) end = i; }
    h.route = [c0, ...m.path(c0, end)];
  }
  f.hunters.push(h);
}

function startLevel() {
  defiPanneau(false);
  const gen = dailyMode ? mulberry32(dailySeed) : mulberry32((Math.random() * 2 ** 31) | 0);
  const boss = isBoss();
  const twoFloors = !dailyMode && !boss && level >= 6 && level % 2 === 0;
  let cols, rows, fragileCount; const types = [];
  if (dailyMode) {
    cols = 12; rows = 18; types.push(RODEUSE, RODEUSE, PATROUILLE, AVEUGLE); fragileCount = 5; decoysMax = 2; beaconsMax = 2;
  } else {
    cols = min(5 + level, 16); rows = min(8 + Math.floor(level * 3 / 2), 26);
    if (boss) { types.push(MERE); for (let i = 0; i < Math.floor(level / 10); i++) types.push(RODEUSE); }
    else {
      for (let i = 0; i < min(1 + Math.floor((level - 1) / 2), 4); i++) types.push(RODEUSE);
      if (level >= 3) types.push(PATROUILLE);
      if (level >= 8) types.push(PATROUILLE);
      if (level >= 5) types.push(AVEUGLE);
      if (level >= 10) types.push(AVEUGLE);
    }
    if (level >= 7) types.push(REFLET);
    fragileCount = level >= 3 ? min(2 + Math.floor(level / 2), 8) : 0;
    decoysMax = level >= 2 ? 2 : 0;
    beaconsMax = level >= 4 ? 2 : 0;
  }

  floors = [];
  const f0 = buildFloor(gen, cols, rows, fragileCount);
  floors.push(f0);
  const m0 = f0.maze, dist0 = m0.bfs(0);
  let far0 = 1; for (let i = 0; i < dist0.length; i++) far0 = max(far0, dist0[i]);
  let spots0, spots1 = [], f1 = null;
  if (twoFloors) {
    const stairs = farCell(m0, 0, dist0);
    f0.stairsTo = 1; f0.stairsX = ccx(m0, stairs); f0.stairsY = ccy(m0, stairs);
    f1 = buildFloor(gen, cols, rows, fragileCount);
    floors.push(f1);
    f1.stairsTo = 0; f1.stairsX = f0.stairsX; f1.stairsY = f0.stairsY;
    const dist1 = f1.maze.bfs(stairs);
    const exitCell = farCell(f1.maze, stairs, dist1);
    f1.hasExit = true; f1.exitX = ccx(f1.maze, exitCell); f1.exitY = ccy(f1.maze, exitCell);
    par3 = max(2, Math.floor((dist0[stairs] + dist1[exitCell]) / 5));
    spots0 = shuffle([...dist0.keys()].filter(i => dist0[i] >= max(6, Math.floor(far0 / 3)) && i !== stairs), gen);
    spots1 = shuffle([...dist1.keys()].filter(i => dist1[i] >= 5 && i !== exitCell), gen);
  } else {
    const exitCell = farCell(m0, 0, dist0);
    f0.hasExit = true; f0.exitX = ccx(m0, exitCell); f0.exitY = ccy(m0, exitCell);
    par3 = max(2, Math.floor(dist0[exitCell] / 5));
    spots0 = shuffle([...dist0.keys()].filter(i => dist0[i] >= max(6, Math.floor(far0 / 3)) && i !== exitCell), gen);
  }
  par2 = par3 * 2;

  reflet = null;
  let s0 = 0, s1 = 0, alt = 0;
  for (const type of types) {
    if (type === REFLET) { reflet = newHunter(REFLET, 0.5, 0.5, 0); f0.hunters.push(reflet); continue; }
    const lower = f1 && (type !== RODEUSE || alt++ % 2 === 1);
    if (lower && s1 < spots1.length) addHunter(f1, type, spots1[s1++], gen);
    else if (s0 < spots0.length) addHunter(f0, type, spots0[s0++], gen);
  }

  floors.forEach((f, fi) => {
    const m = f.maze;
    const from = fi === 0 ? 0 : cellOf(m, f.stairsX, f.stairsY);
    const d = m.bfs(from);
    const used = new Set(f.hunters.map(h => h.atCell));
    if (f.hasExit) used.add(cellOf(m, f.exitX, f.exitY));
    if (f.stairsTo >= 0) used.add(cellOf(m, f.stairsX, f.stairsY));
    const sp = shuffle([...d.keys()].filter(i => d[i] >= 3 && !used.has(i)), gen);
    const count = floors.length === 1 ? 3 : fi === 0 ? 2 : 1;
    for (let k = 0; k < min(count, sp.length); k++) f.shards.push({ x: ccx(m, sp[k]), y: ccy(m, sp[k]), lit: -100, lastPulse: -1, taken: false });
  });
  shardsTotal = floors.reduce((a, f) => a + f.shards.length, 0);
  setFloor(0);

  px = 0.5; py = 0.5; vx = 0; vy = 0; facing = 0; camX = px; camY = py;
  pulses = []; decoys = []; particles = []; scheduled = [];
  energy = C.MAX_ENERGY; decoysLeft = decoysMax; beaconsLeft = beaconsMax; echoesUsed = 0; answerAt = -1; hintT = -100; beatTimer = 0;
  shardsTaken = 0; trailCount = 0; trailAcc = 0; trailOn = false; newRecord = false; stairsArmed = true;
  scanTimer = 0.5; goalTimer = 1.5; shardTimer = 1; floorBannerT = -100;
  tilt.recenter();
  state = PLAY; stateT = t; levelStartT = t;
  pushGameHistory();
  keepAwake();

  let intro = dailyMode ? L('sDaily') : L('sLevel', level) + (boss ? ' ' + L('sBoss') : '');
  if (twoFloors) intro += ' ' + L('sTwoFloors');
  if (level === 1 && !dailyMode) intro += ' ' + L('sTutorial');
  else intro += hintsFor().map(h => ' ' + h + '.').join('');
  say(intro);
}
