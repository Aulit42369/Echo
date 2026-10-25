// ÉCHO — hasard reproductible (mulberry32, shuffle) et génération du labyrinthe — parité Android.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Hasard reproductible (défi du jour)
// =====================================================================
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const rint = (rng, n) => Math.floor(rng() * n);
function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) { const j = rint(rng, i + 1); const tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp; }
  return arr;
}

// =====================================================================
// Labyrinthe
// =====================================================================
const N = 1, E = 2, S = 4, W = 8;
const DIRS = [N, E, S, W];
const DX = { 1: 0, 2: 1, 4: 0, 8: -1 }, DY = { 1: -1, 2: 0, 4: 1, 8: 0 }, OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };

class Maze {
  constructor(cols, rows, rng) {
    this.cols = cols; this.rows = rows;
    this.cells = new Uint8Array(cols * rows).fill(15);
    this.carve(rng);
    this.braid(rng, 0.15);
  }
  idx(c, r) { return r * this.cols + c; }
  has(c, r, w) { return (this.cells[r * this.cols + c] & w) !== 0; }
  inside(c, r) { return c >= 0 && c < this.cols && r >= 0 && r < this.rows; }
  removeWall(c, r, d) {
    this.cells[this.idx(c, r)] &= ~d;
    this.cells[this.idx(c + DX[d], r + DY[d])] &= ~OPP[d];
  }
  carve(rng) {
    const visited = new Uint8Array(this.cols * this.rows);
    const stack = [0]; visited[0] = 1;
    const opts = [];
    while (stack.length) {
      const cur = stack[stack.length - 1];
      const c = cur % this.cols, r = (cur / this.cols) | 0;
      opts.length = 0;
      for (const d of DIRS) {
        const nc = c + DX[d], nr = r + DY[d];
        if (this.inside(nc, nr) && !visited[this.idx(nc, nr)]) opts.push(d);
      }
      if (!opts.length) { stack.pop(); continue; }
      const d = opts[rint(rng, opts.length)];
      this.removeWall(c, r, d);
      const next = this.idx(c + DX[d], r + DY[d]);
      visited[next] = 1; stack.push(next);
    }
  }
  braid(rng, p) {
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const v = this.cells[this.idx(c, r)];
      const bits = (v & 1) + ((v >> 1) & 1) + ((v >> 2) & 1) + ((v >> 3) & 1);
      if (bits !== 3 || rng() > p) continue;
      const opts = DIRS.filter(d => this.has(c, r, d) && this.inside(c + DX[d], r + DY[d]));
      if (opts.length) this.removeWall(c, r, opts[rint(rng, opts.length)]);
    }
  }
  isOpen(i, d) {
    const c = i % this.cols, r = (i / this.cols) | 0;
    return this.inside(c + DX[d], r + DY[d]) && !this.has(c, r, d);
  }
  neighbors(i, out) {
    const c = i % this.cols, r = (i / this.cols) | 0;
    let n = 0;
    if (r > 0 && !this.has(c, r, N)) out[n++] = i - this.cols;
    if (r < this.rows - 1 && !this.has(c, r, S)) out[n++] = i + this.cols;
    if (c < this.cols - 1 && !this.has(c, r, E)) out[n++] = i + 1;
    if (c > 0 && !this.has(c, r, W)) out[n++] = i - 1;
    return n;
  }
  bfs(from) {
    const n = this.cols * this.rows, dist = new Int32Array(n).fill(-1), q = new Int32Array(n), nb = [0, 0, 0, 0];
    let h = 0, tl = 0; dist[from] = 0; q[tl++] = from;
    while (h < tl) {
      const cur = q[h++], k = this.neighbors(cur, nb);
      for (let j = 0; j < k; j++) { const v = nb[j]; if (dist[v] < 0) { dist[v] = dist[cur] + 1; q[tl++] = v; } }
    }
    return dist;
  }
  path(from, to) {
    if (from === to) return [];
    const n = this.cols * this.rows, parent = new Int32Array(n).fill(-1), q = new Int32Array(n), nb = [0, 0, 0, 0];
    let h = 0, tl = 0; parent[from] = from; q[tl++] = from;
    while (h < tl) {
      const cur = q[h++]; if (cur === to) break;
      const k = this.neighbors(cur, nb);
      for (let j = 0; j < k; j++) { const v = nb[j]; if (parent[v] < 0) { parent[v] = cur; q[tl++] = v; } }
    }
    if (parent[to] < 0) return [];
    const res = []; let cur = to;
    while (cur !== from) { res.push(cur); cur = parent[cur]; }
    return res.reverse();
  }
  open(a, b) {
    if (a < 0 || b < 0) return;
    const diff = b - a;
    const d = diff === -this.cols ? N : diff === this.cols ? S : diff === 1 ? E : diff === -1 ? W : 0;
    if (d) this.removeWall(a % this.cols, (a / this.cols) | 0, d);
  }
  buildWalls() {
    const list = [];
    const mk = (x1, y1, x2, y2, a, b) => list.push({ x1, y1, x2, y2, a, b, mx: (x1 + x2) / 2, my: (y1 + y2) / 2,
      lit: -100, lastPulse: -1, seen: false, fragile: false, broken: false });
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const i = this.idx(c, r);
      if (this.has(c, r, N)) mk(c, r, c + 1, r, i, r > 0 ? i - this.cols : -1);
      if (this.has(c, r, W)) mk(c, r, c, r + 1, i, c > 0 ? i - 1 : -1);
      if (r === this.rows - 1 && this.has(c, r, S)) mk(c, r + 1, c + 1, r + 1, i, -1);
      if (c === this.cols - 1 && this.has(c, r, E)) mk(c + 1, r, c + 1, r + 1, i, -1);
    }
    return list;
  }
}
