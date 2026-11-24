import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { usePop, usePortrait, useSceneFade, useUnit } from './util';

const FEATURES = [
  { e: '👥', t: 'De 2 a 14 jugadores' },
  { e: '📱', t: 'Desde el móvil, sin instalar nada' },
  { e: '🖥️', t: 'El profe proyecta la carrera' },
];

const Feature: React.FC<{ i: number }> = ({ i }) => {
  const u = useUnit();
  const p = usePop(30 + i * 8);
  const f = FEATURES[i];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 * u, opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <span style={{ fontSize: 50 * u }}>{f.e}</span>
      <span style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40 * u, color: C.text }}>{f.t}</span>
    </div>
  );
};

export const CallToAction: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const frame = useCurrentFrame();
  const fade = useSceneFade(8, 1);
  const logo = usePop(0, { damping: 12, mass: 0.7 });
  const cta = usePop(62, { damping: 10, mass: 0.6 });
  const pulse = 1 + Math.sin(frame / 6) * 0.03;
  const endFade = interpolate(frame, [120, 135], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade * endFade, gap: 44 * u, padding: 60 * u }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 * u, transform: `scale(${logo})`, flexDirection: portrait ? 'column' : 'row' }}>
        <span style={{ fontSize: 130 * u, filter: `drop-shadow(0 0 30px ${C.yellow})` }}>👑</span>
        <span
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: 100 * u,
            textAlign: 'center',
            backgroundImage: `linear-gradient(100deg, ${C.yellow}, ${C.pink}, ${C.cyan})`,
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 0 16px ${C.pink}aa)`,
          }}
        >
          LA CARRERA DEL REY
        </span>
      </div>
      <div style={{ display: 'flex', gap: `${20 * u}px ${60 * u}px`, flexWrap: 'wrap', justifyContent: 'center', flexDirection: portrait ? 'column' : 'row', alignItems: 'center' }}>
        {FEATURES.map((_, i) => (
          <Feature key={i} i={i} />
        ))}
      </div>
      <div
        style={{
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: 58 * u,
          color: C.bg,
          background: `linear-gradient(90deg, ${C.green}, ${C.cyan})`,
          padding: `${26 * u}px ${60 * u}px`,
          borderRadius: 99,
          boxShadow: `0 0 50px ${C.cyan}`,
          transform: `scale(${cta * pulse})`,
          marginTop: 20 * u,
          textAlign: 'center',
        }}
      >
        ¿QUIÉN SERÁ EL REY DE TU CLASE?
      </div>
      <div style={{ fontFamily: BODY, fontSize: 30 * u, color: C.muted, opacity: cta, textShadow: neon(C.pink, 0.1) }}>
        Gratis · Funciona en cualquier navegador
      </div>
    </AbsoluteFill>
  );
};
