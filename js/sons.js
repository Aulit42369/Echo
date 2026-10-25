// ÉCHO — sons synthétisés (Web Audio), panoramique stéréo.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Son : tout est synthétisé (Web Audio), avec panoramique stéréo
// =====================================================================
const RATE = 22050;
class Sound {
  constructor() { this.ctx = null; this.buf = {}; this.loop = null; this.lv = -1; this.lr = -1; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch (e) { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = 0.9; this.master.connect(this.ctx.destination);
    this.build();
    const s = this.ctx.createBufferSource(); s.buffer = this.buf.drone; s.loop = true;
    const g = this.ctx.createGain(); g.gain.value = 0;
    s.connect(g); g.connect(this.master); s.start();
    this.loop = { s, g };
  }
  suspend() { if (this.ctx && this.ctx.state === 'running') this.ctx.suspend().catch(() => {}); }
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {}); }
  synth(dur, gen) { const n = Math.floor(dur * RATE), a = new Float32Array(n); for (let i = 0; i < n; i++) a[i] = gen(i / RATE); return a; }
  echo(src, delay, gain, taps) {
    const d = Math.floor(delay * RATE), out = new Float32Array(src.length + d * taps);
    out.set(src); for (let i = d; i < out.length; i++) out[i] += out[i - d] * gain; return out;
  }
  add(name, data) {
    let peak = 1e-4; for (let i = 0; i < data.length; i++) peak = max(peak, abs(data[i]));
    const k = 0.9 / peak; for (let i = 0; i < data.length; i++) data[i] *= k;
    const b = this.ctx.createBuffer(1, data.length, RATE); b.getChannelData(0).set(data); this.buf[name] = b;
  }
  build() {
    const rnd = () => Math.random() * 2 - 1;
    const exp = Math.exp;
    let ph = 0;
    this.add('ping', this.echo(this.synth(0.9, t => { const f = 1150 + 450 * exp(-t * 12); ph += TAU * f / RATE;
      return (sin(ph) * 0.75 + sin(2 * ph) * 0.12) * min(1, t * 300) * exp(-t * 7); }), 0.16, 0.35, 3));
    this.add('answer', this.echo(this.synth(1.1, t => { const env = min(1, t * 50) * exp(-t * 4.5) * (1 + 0.15 * sin(TAU * 7 * t));
      return (sin(TAU * 660 * t) * 0.5 + sin(TAU * 990 * t) * 0.3 + sin(TAU * 1320 * t) * 0.1) * env; }), 0.12, 0.3, 2));
    let hp = 0;
    const beat = tt => tt < 0 ? 0 : min(1, tt * 500) * exp(-tt * 16);
    this.add('thump', this.synth(0.45, t => { const f = 50 + 40 * exp(-t * 30); hp += TAU * f / RATE; return sin(hp) * (beat(t) + 0.6 * beat(t - 0.15)); }));
    let lp = 0;
    this.add('growl', this.synth(0.9, t => { const f = 70 + 6 * sin(TAU * 5 * t); const saw = 2 * ((f * t) % 1) - 1;
      lp += (rnd() - lp) * 0.08; return (saw * 0.55 + lp * 1.4) * min(1, t / 0.12) * exp(-t * 3); }));
    this.add('shard', this.echo(this.synth(0.45, t => { const f = t < 0.08 ? 1568 : 2349, st = t < 0.08 ? 0 : 0.08;
      return sin(TAU * f * t) * min(1, (t - st) * 400) * exp(-(t - st) * 14); }), 0.09, 0.3, 2));
    let dp = 0;
    this.add('death', this.synth(1.6, t => { const f = 35 + 365 * exp(-t * 3); dp += f / RATE; const saw = 2 * (dp % 1) - 1;
      return (saw * 0.5 + rnd() * 0.4 * exp(-t * 4)) * min(1, t * 200) * exp(-t * 1.6); }));
    const notes = [523.25, 659.25, 783.99, 1046.5];
    this.add('win', this.echo(this.synth(1.4, t => { let v = 0; for (let k = 0; k < 4; k++) { const dt = t - k * 0.11;
      if (dt >= 0) v += (sin(TAU * notes[k] * dt) + 0.3 * sin(TAU * 2 * notes[k] * dt)) * min(1, dt * 300) * exp(-dt * 5) * 0.4; } return v; }), 0.15, 0.3, 2));
    this.add('empty', this.synth(0.12, t => sin(TAU * 180 * t) * exp(-t * 40)));
    let cp = 0;
    this.add('cone', this.echo(this.synth(0.45, t => { const f = 1700 + 600 * exp(-t * 18); cp += TAU * f / RATE;
      return sin(cp) * min(1, t * 500) * exp(-t * 11); }), 0.11, 0.25, 2));
    let tl = 0;
    this.add('throw', this.synth(0.3, t => { tl += (rnd() - tl) * (0.05 + 0.4 * t); return tl * 3 * min(1, t * 30) * exp(-t * 9); }));
    let cl = 0;
    this.add('crack', this.echo(this.synth(0.8, t => { cl += (rnd() - cl) * 0.35;
      const clicks = Math.random() < 0.004 * exp(-t * 4) ? rnd() * 3 : 0;
      return cl * 1.5 * exp(-t * 7) + sin(TAU * 90 * t) * exp(-t * 9) * 0.8 + clicks; }), 0.13, 0.3, 2));
    this.add('step', this.synth(0.16, t => sin(TAU * 70 * t) * exp(-t * 35) + rnd() * 0.4 * exp(-t * 90)));
    this.add('open', this.synth(0.22, t => (sin(TAU * 520 * t) * 0.8 + sin(TAU * 1040 * t) * 0.1) * min(1, t * 120) * exp(-t * 16)));
    this.add('bump', this.synth(0.14, t => sin(TAU * 120 * t) * exp(-t * 40) + rnd() * 0.3 * exp(-t * 70)));
    this.add('beacon', this.echo(this.synth(0.8, t => { const a = sin(TAU * 784 * t) * min(1, t * 200) * exp(-t * 5);
      const b = t > 0.09 ? sin(TAU * 1175 * (t - 0.09)) * exp(-(t - 0.09) * 5) : 0; return (a + b) * 0.6; }), 0.14, 0.3, 2));
    let sl = 0;
    this.add('snuff', this.synth(0.6, t => { sl += (rnd() - sl) * max(0.02, 0.3 - 0.4 * t);
      return sl * 2 * exp(-t * 6) + sin(TAU * (300 - 200 * t) * t) * 0.4 * exp(-t * 5); }));
    const down = [880, 660, 523.25, 392];
    this.add('stairs', this.echo(this.synth(0.9, t => { let v = 0; for (let k = 0; k < 4; k++) { const dt = t - k * 0.08;
      if (dt >= 0) v += sin(TAU * down[k] * dt) * min(1, dt * 300) * exp(-dt * 7) * 0.4; } return v; }), 0.12, 0.3, 2));
    this.add('drone', this.synth(2.0, t => { const swell = 0.75 + 0.25 * sin(TAU * 0.5 * t);
      return (sin(TAU * 55 * t) * 0.5 + sin(TAU * 55.5 * t) * 0.4 + sin(TAU * 82.5 * t) * 0.18 + sin(TAU * 110 * t) * 0.08) * swell; }));
  }
  play(name, vol = 1, pan = 0, rate = 1, delay = 0) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const b = this.buf[name]; if (!b) return;
    const s = this.ctx.createBufferSource(); s.buffer = b; s.playbackRate.value = clamp(rate, 0.5, 2);
    const g = this.ctx.createGain(); g.gain.value = clamp(vol, 0, 1);
    s.connect(g);
    if (this.ctx.createStereoPanner) { const p = this.ctx.createStereoPanner(); p.pan.value = clamp(pan, -1, 1); g.connect(p); p.connect(this.master); }
    else g.connect(this.master);
    s.start(this.ctx.currentTime + delay);
  }
  setLoop(vol, rate) {
    if (!this.loop) return;
    const now = this.ctx.currentTime;
    if (abs(vol - this.lv) > 0.01) { this.lv = vol; this.loop.g.gain.setTargetAtTime(clamp(vol, 0, 1) * 0.6, now, 0.15); }
    if (abs(rate - this.lr) > 0.01) { this.lr = rate; this.loop.s.playbackRate.setTargetAtTime(clamp(rate, 0.5, 2), now, 0.15); }
  }
}
const sound = new Sound();
