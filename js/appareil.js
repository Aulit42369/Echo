// ÉCHO — vibrations, voix, gyroscope, sauvegarde locale, langue.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Vibrations (Android : Chrome / PWA ; absent sur iPhone)
// =====================================================================
const haptics = {
  vib(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} },
  heartbeat(i) { this.vib([Math.round(30 + 30 * i), 110, Math.round(18 + 25 * i)]); },
  tick(ms = 14) { this.vib(ms); },
  boom() { this.vib([80, 60, 300]); },
  success() { this.vib([30, 70, 30, 70, 60]); },
};

// =====================================================================
// Voix (mode audio)
// =====================================================================
const speech = {
  say(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = I18N.langs[lang].tts; u.rate = 1.05;
      speechSynthesis.speak(u);
    } catch (e) {}
  },
};

// =====================================================================
// Inclinaison (gyroscope)
// =====================================================================
const tilt = {
  available: 'DeviceOrientationEvent' in window,
  listening: false, beta: 0, gamma: 0, b0: 0, g0: 0, calibrate: true, has: false,
  onEvent(e) {
    if (e.beta === null || e.gamma === null) return;
    tilt.beta = e.beta; tilt.gamma = e.gamma;
    if (tilt.calibrate) { tilt.b0 = tilt.beta; tilt.g0 = tilt.gamma; tilt.calibrate = false; }
    tilt.has = true;
  },
  async start() {
    if (this.listening || !this.available) return;
    try {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const r = await DeviceOrientationEvent.requestPermission();
        if (r !== 'granted') return;
      }
    } catch (e) { return; }
    addEventListener('deviceorientation', this.onEvent);
    this.listening = true; this.calibrate = true;
  },
  stop() { if (!this.listening) return; removeEventListener('deviceorientation', this.onEvent); this.listening = false; this.has = false; },
  recenter() { this.calibrate = true; },
  vector() {
    if (!this.has) return [0, 0];
    let x = (this.gamma - this.g0) / 18, y = (this.beta - this.b0) / 18;
    const l = hypot(x, y);
    if (l < 0.12) return [0, 0];
    if (l > 1) { x /= l; y /= l; }
    return [x, y];
  },
};

// =====================================================================
// Sauvegarde locale
// =====================================================================
const store = {
  get(k, d) { try { const v = localStorage.getItem('echo_' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('echo_' + k, JSON.stringify(v)); } catch (e) {} },
};
function detectLang() {
  const prefs = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || 'en'];
  for (const p of prefs) { const i = I18N.langs.findIndex(l => l.code === String(p).slice(0, 2).toLowerCase()); if (i >= 0) return i; }
  return 1;
}
lang = store.get('lang', -1);
if (lang < 0 || lang >= I18N.langs.length) lang = detectLang();
document.documentElement.lang = I18N.langs[lang].code;
