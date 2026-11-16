// ---------- Avatares ----------
const AVATARS = ['🦙','🦖','🐸','🐧','🦄','🐙','🦥','🐔','🤖','👽','🦝','🐼','🦊','🐷','🥑','🍕','👻','🐵','🦆','🐢','🦩','🐳','🤠','🐹','🦔','🐌','🥦','🌮'];
const ACCESSORIES = [
  { e: '', label: 'Nada', cls: '' },
  { e: '🕶️', label: 'Gafas', cls: 'eyes' },
  { e: '🎩', label: 'Chistera', cls: 'hat' },
  { e: '👑', label: 'Corona', cls: 'hat' },
  { e: '🧢', label: 'Gorra', cls: 'hat' },
  { e: '🎉', label: 'Fiesta', cls: 'hat' },
  { e: '🎀', label: 'Lazo', cls: 'hat' },
  { e: '🪖', label: 'Casco', cls: 'hat' },
  { e: '💰', label: 'Pasta', cls: 'hand' },
  { e: '💸', label: 'Billetes', cls: 'hand' },
  { e: '🧋', label: 'Bubble tea', cls: 'hand' },
  { e: '🔥', label: 'Fuego', cls: 'hand' },
];
const accClass = (e) => (ACCESSORIES.find((a) => a.e === e) || {}).cls || 'hand';

function avatarHTML(avatar, acc, extra = '') {
  return `<span class="av ${extra}"><span class="av-base">${avatar}</span>${acc ? `<span class="av-acc ${accClass(acc)}">${acc}</span>` : ''}</span>`;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtSec = (ms) => (ms / 1000).toFixed(1).replace('.', ',') + ' s';
const LETTERS = ['A', 'B', 'C', 'D'];

// ---------- Sonidos sintetizados (sin archivos) ----------
const Sfx = (() => {
  let ctx = null, muted = false;
  const ac = () => { if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === 'suspended') ctx.resume(); return ctx; };
  function tone(freq, dur = 0.15, type = 'square', vol = 0.08, when = 0, slide = 0) {
    if (muted) return;
    try {
      const c = ac(), t = c.currentTime + when;
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  return {
    unlock: () => { try { ac(); } catch (e) {} },
    toggle: () => (muted = !muted),
    get muted() { return muted; },
    pop: () => tone(600, 0.12, 'sine', 0.12, 0, 1200),
    tick: () => tone(1000, 0.05, 'square', 0.05),
    tock: () => tone(1400, 0.08, 'square', 0.08),
    go: () => { tone(523, 0.12, 'square', 0.07); tone(659, 0.12, 'square', 0.07, 0.1); tone(784, 0.25, 'square', 0.07, 0.2); },
    correct: () => { tone(880, 0.1, 'triangle', 0.15); tone(1320, 0.25, 'triangle', 0.15, 0.09); },
    wrong: () => { tone(220, 0.25, 'sawtooth', 0.08, 0, 110); },
    whoosh: () => tone(200, 0.5, 'sawtooth', 0.04, 0, 1600),
    reveal: () => { tone(392, 0.1, 'square', 0.06); tone(523, 0.1, 'square', 0.06, 0.08); tone(659, 0.3, 'square', 0.06, 0.16); },
    fanfare: () => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i === 5 ? 0.6 : 0.15, 'square', 0.07, i * 0.14)); },
  };
})();

// ---------- Confeti ----------
function confetti(duration = 4000) {
  const cv = document.createElement('canvas');
  cv.className = 'confetti';
  document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  const resize = () => { cv.width = innerWidth; cv.height = innerHeight; };
  resize();
  const colors = ['#ff2bd6', '#00e5ff', '#ffd400', '#39ff88', '#ff6b35', '#ffffff'];
  const parts = Array.from({ length: 220 }, () => ({
    x: Math.random() * cv.width, y: -20 - Math.random() * cv.height * 0.6,
    w: 6 + Math.random() * 8, h: 8 + Math.random() * 10, vy: 2 + Math.random() * 4, vx: -2 + Math.random() * 4,
    r: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, c: colors[Math.floor(Math.random() * colors.length)],
    e: Math.random() < 0.12 ? ['💸', '💰', '🪙', '⭐'][Math.floor(Math.random() * 4)] : null,
  }));
  const end = performance.now() + duration;
  (function frame(now) {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of parts) {
      p.x += p.vx; p.y += p.vy; p.r += p.vr;
      if (p.y > cv.height + 20 && now < end) { p.y = -20; p.x = Math.random() * cv.width; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r);
      if (p.e) { ctx.font = '28px serif'; ctx.fillText(p.e, -14, 10); }
      else { ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); }
      ctx.restore();
    }
    if (now < end + 3000) requestAnimationFrame(frame); else cv.remove();
  })(performance.now());
}

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}
