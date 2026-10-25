// ÉCHO — canvas et état du jeu.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Canvas
// =====================================================================
const cv = document.getElementById('echo');
const ctx = cv.getContext('2d');
let vw = 0, vh = 0, dpr = 1, cell = 1, vignette = null;
function resize() {
  dpr = min(window.devicePixelRatio || 1, 2.5);
  vw = window.innerWidth; vh = window.innerHeight;
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
  cell = min(vw, vh) / C.VIEW_CELLS;
  vignette = ctx.createRadialGradient(vw / 2, vh / 2, 0, vw / 2, vh / 2, max(vw, vh) * 0.75);
  vignette.addColorStop(0, 'rgba(255,59,92,0)');
  vignette.addColorStop(0.4, 'rgba(255,59,92,0)');
  vignette.addColorStop(1, 'rgba(255,59,92,1)');
}
addEventListener('resize', resize);
resize();

// =====================================================================
// État du jeu
// =====================================================================
let state = TITLE, t = 0, stateT = 0, level = 1, dailyMode = false, defiJour = Defi.today(), dailySeed = Defi.seed('echo', defiJour.key);
let easy = store.get('easy', false), realistic = store.get('realistic', false), audioMode = store.get('audio', false);
let gyro = store.get('gyro', false) && tilt.available;
let best = store.get('best', 0), totalStars = 0, dailyBest = store.get('daily_' + defiJour.num, 0);
let floors = [], floorIdx = 0, reflet = null;
let cur = null, maze = null, walls = [], hunters = [], shards = [];
let pulses = [], decoys = [], particles = [], scheduled = [];
let pulseSeq = 0, px = 0.5, py = 0.5, vx = 0, vy = 0, facing = 0, camX = 0.5, camY = 0.5;
let energy = C.MAX_ENERGY, decoysLeft = 0, decoysMax = 0, beaconsLeft = 0, beaconsMax = 0, echoesUsed = 0, par3 = 3, par2 = 6, stars = 0;
let dailyTime = 0, dailyScore = 0, newRecord = false;
let answerAt = -1, hintT = -100, floorBannerT = -100;
let beatTimer = 0, beatFlash = 0, shake = 0, levelStartT = 0, shardsTaken = 0, shardsTotal = 0, shakeX = 0, shakeY = 0;
let stairsArmed = true, pushX = 0, pushY = 0, bumpCd = 0, scanTimer = 0, goalTimer = 0, shardTimer = 0;
const trailX = new Float32Array(C.TRAIL_N), trailY = new Float32Array(C.TRAIL_N), trailF = new Uint8Array(C.TRAIL_N);
let trailCount = 0, trailAcc = 0, trailOn = false;
const nb = [0, 0, 0, 0];
totalStars = sumStars();
if (gyro) tilt.start();

const easyOn = () => easy && !dailyMode;
const realOn = () => realistic && !dailyMode;
const isBoss = () => !dailyMode && level % 10 === 0;
function setFloor(i) { floorIdx = i; cur = floors[i]; maze = cur.maze; walls = cur.walls; hunters = cur.hunters; shards = cur.shards; }

function sumStars() { let s = 0; for (let l = 1; l <= best + 1; l++) s += store.get('stars_' + l, 0); return s; }
function say(s) { if (audioMode) speech.say(s); }

function hintsFor() {
  if (dailyMode) return LL('hint_daily');
  if (isBoss()) return LL('hint_boss');
  return level >= 1 && level <= 7 ? LL('hint' + level) : [];
}
