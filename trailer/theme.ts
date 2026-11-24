import { loadFont as loadOrbitron } from '@remotion/google-fonts/Orbitron';
import { loadFont as loadOutfit } from '@remotion/google-fonts/Outfit';

// Misma identidad visual que el juego (public/css/style.css)
export const C = {
  bg: '#0b0420',
  bg2: '#1a0b3d',
  pink: '#ff2bd6',
  cyan: '#00e5ff',
  yellow: '#ffd400',
  green: '#39ff88',
  orange: '#ff6b35',
  red: '#ff3b5c',
  text: '#f3eaff',
  muted: '#a99bd1',
  optA: '#ff3b7f',
  optB: '#2f8bff',
  optC: '#ffb800',
  optD: '#19d98b',
};

export const TITLE = loadOrbitron('normal', { weights: ['700', '900'], subsets: ['latin'] }).fontFamily;
export const BODY = loadOutfit('normal', { weights: ['400', '600', '800'], subsets: ['latin'] }).fontFamily;

export const neon = (color: string, strength = 1) =>
  `0 0 ${10 * strength}px ${color}, 0 0 ${30 * strength}px ${color}aa, 0 0 ${60 * strength}px ${color}55`;
