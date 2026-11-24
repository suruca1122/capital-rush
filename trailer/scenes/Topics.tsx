import React from 'react';
import { AbsoluteFill } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { usePop, usePortrait, useSceneFade, useUnit } from './util';

const TOPICS = [
  { e: '📈', t: 'Interés simple', c: C.cyan },
  { e: '🚀', t: 'Interés compuesto', c: C.pink },
  { e: '✂️', t: 'Descuento simple', c: C.yellow },
  { e: '🧮', t: 'Descuento compuesto', c: C.orange },
  { e: '📒', t: 'Cuentas PGC Pymes', c: C.green },
  { e: '⚖️', t: 'Masas patrimoniales', c: C.optB },
  { e: '🧾', t: 'Operaciones de IVA', c: C.optA },
];

const Card: React.FC<{ i: number }> = ({ i }) => {
  const u = useUnit();
  const p = usePop(6 + i * 6, { damping: 11, mass: 0.6 });
  const tp = TOPICS[i];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 22 * u,
        padding: `${24 * u}px ${34 * u}px`,
        borderRadius: 26 * u,
        background: `${tp.c}1f`,
        border: `3px solid ${tp.c}`,
        boxShadow: `0 0 30px ${tp.c}55`,
        transform: `scale(${p}) rotate(${(1 - p) * (i % 2 ? 8 : -8)}deg)`,
        opacity: p > 0.01 ? 1 : 0,
      }}
    >
      <span style={{ fontSize: 60 * u }}>{tp.e}</span>
      <span style={{ fontFamily: BODY, fontWeight: 800, fontSize: 44 * u, color: C.text }}>{tp.t}</span>
    </div>
  );
};

export const Topics: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const fade = useSceneFade(6, 8);
  const head = usePop(0);
  const foot = usePop(55);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, gap: 46 * u, padding: 60 * u }}>
      <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 70 * u, color: C.text, textShadow: neon(C.pink, 0.5), transform: `scale(${head})`, textAlign: 'center' }}>
        Tú eliges los temas
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          flexDirection: portrait ? 'column' : 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 26 * u,
          maxWidth: 1600 * u,
        }}
      >
        {TOPICS.map((_, i) => (
          <Card key={i} i={i} />
        ))}
      </div>
      <div
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: 40 * u,
          color: C.yellow,
          opacity: foot,
          transform: `translateY(${(1 - foot) * 30}px)`,
          textAlign: 'center',
        }}
      >
        🎲 Datos aleatorios: las preguntas nunca se repiten · resolución paso a paso
      </div>
    </AbsoluteFill>
  );
};
