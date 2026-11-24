import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { usePop, useSceneFade, useUnit } from './util';

const Line: React.FC<{ text: string; delay: number; color: string; size: number; font: string }> = ({ text, delay, color, size, font }) => {
  const p = usePop(delay);
  return (
    <div
      style={{
        fontFamily: font,
        fontWeight: 900,
        fontSize: size,
        color,
        textShadow: neon(color, 0.6),
        opacity: p,
        transform: `translateY(${(1 - p) * 60}px) scale(${0.8 + 0.2 * p})`,
        textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
};

export const Intro: React.FC = () => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const fade = useSceneFade(1, 10);
  const flicker = frame > 40 && frame < 46 && frame % 2 === 0 ? 0.4 : 1;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', gap: 20 * u, opacity: fade * flicker, padding: 60 }}>
      <Line text="¿Interés compuesto?" delay={0} color={C.cyan} size={78 * u} font={TITLE} />
      <Line text="¿Descuento racional?" delay={14} color={C.pink} size={78 * u} font={TITLE} />
      <Line text="¿El IVA de la 472?" delay={28} color={C.yellow} size={78 * u} font={TITLE} />
      <div
        style={{
          fontFamily: BODY,
          fontSize: 44 * u,
          color: C.text,
          marginTop: 30 * u,
          opacity: interpolate(frame, [45, 58], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Repasar nunca fue tan rápido.
      </div>
    </AbsoluteFill>
  );
};
