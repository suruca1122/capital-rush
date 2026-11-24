import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { usePop, usePortrait, useSceneFade, useUnit } from './util';

export const Logo: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const frame = useCurrentFrame();
  const fade = useSceneFade(1, 10);
  const crown = usePop(4, { damping: 8, mass: 0.8 });
  const title = usePop(16, { damping: 14, mass: 0.7 });
  const sub = usePop(32);
  const shine = interpolate(frame, [30, 70], [-30, 130], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const words = portrait ? ['LA CARRERA', 'DEL REY'] : ['LA CARRERA DEL REY'];

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade }}>
      <div
        style={{
          fontSize: 220 * u,
          transform: `translateY(${(1 - crown) * -500}px) rotate(${Math.sin(frame / 8) * 6}deg)`,
          filter: `drop-shadow(0 0 40px ${C.yellow})`,
          marginBottom: 10 * u,
        }}
      >
        👑
      </div>
      {words.map((w) => (
        <div
          key={w}
          style={{
            fontFamily: TITLE,
            fontWeight: 900,
            fontSize: (portrait ? 130 : 132) * u,
            letterSpacing: 6 * u,
            lineHeight: 1.05,
            textAlign: 'center',
            backgroundImage: `linear-gradient(100deg, ${C.yellow} 0%, ${C.pink} 45%, #fff ${shine}%, ${C.cyan} ${shine + 10}%, ${C.pink} 100%)`,
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            filter: `drop-shadow(0 0 18px ${C.pink}aa)`,
            transform: `scale(${title})`,
          }}
        >
          {w}
        </div>
      ))}
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 40 * u,
          letterSpacing: 8 * u,
          color: C.cyan,
          textShadow: neon(C.cyan, 0.4),
          marginTop: 30 * u,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 30}px)`,
          textAlign: 'center',
          padding: '0 40px',
        }}
      >
        MATEMÁTICA FINANCIERA · CONTABILIDAD · IVA
      </div>
    </AbsoluteFill>
  );
};
