// ÉCHO — réglages du jeu, palette, constantes et raccourcis mathématiques.
// Script classique chargé dans l'ordre par index.html (portée globale partagée avec les autres fichiers js/).
'use strict';

// =====================================================================
// Réglages (identiques à la version Android)
// =====================================================================
const C = {
  SPEED: 2.6, PR: 0.17, PULSE_SPEED: 7, PULSE_R: 4.2, HEAR_R: 7,
  CONE_R: 7.5, CONE_HEAR: 2.5, CONE_HALF: 0.38,
  DECOY_R: 3.5, DECOY_HEAR: 8, DECOY_RANGE: 3.5,
  BREAK_R: 1.6, BREAK_NOISE: 9, BEACON_LIGHT: 1.5, BEACON_LURE: 4.5, FLOOR_HEAR: 2.5,
  WALL_FADE: 2.6, MAX_ENERGY: 4, REGEN: 3, BEAT_R: 5, JOY_R: 60, AIM_DELAY: 350,
  VIEW_CELLS: 6.2, TRAIL_N: 1024, TRAIL_DT: 0.05, REFLET_DELAY: 120,
};
const COL = {
  BG: '#05070a', WHITE: '#ffffff', BLACK: '#000000', GRAY: '#888888', CYAN: '#5cf2ff', RED: '#ff3b5c', GOLD: '#ffc94d',
  VIOLET: '#c08bff', PINK: '#ff4fd8', ORANGE: '#ff8a3d', PALE: '#ffcdd7', CRACK: '#ffd6aa',
  ICE: '#aae1ff', STAIRS: '#a0b4ff', MOTHER: '#8c143c',
};
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
const RODEUSE = 0, PATROUILLE = 1, AVEUGLE = 2, REFLET = 3, MERE = 4;
const RADIAL = 0, CONE = 1, DECOY = 2;
const TITLE = 0, OPTIONS = 1, PLAY = 2, DEAD = 3, CLEAR = 4;
const TAU = Math.PI * 2;

const hypot = Math.hypot, min = Math.min, max = Math.max, sin = Math.sin, cos = Math.cos, atan2 = Math.atan2, abs = Math.abs;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
