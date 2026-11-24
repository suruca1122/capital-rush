import React from 'react';
import { AbsoluteFill, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { Avatar, PLAYERS, usePop, useSceneFade, useUnit } from './util';

const CONFETTI = [C.pink, C.cyan, C.yellow, C.green, C.orange, '#ffffff'];

const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      {new Array(120).fill(0).map((_, i) => {
        const start = random(`d${i}`) * 40;
        const t = Math.max(0, frame - 18 - start);
        const x = random(`x${i}`) * width + Math.sin((t + i) / 8) * 40;
        const y = -40 + t * (6 + random(`v${i}`) * 8);
        if (y > height + 40) return null;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: 14,
              height: 24,
              background: CONFETTI[i % CONFETTI.length],
              transform: `rotate(${t * 12 + i * 30}deg) rotateX(${t * 18}deg)`,
              opacity: t > 0 ? 1 : 0,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Step: React.FC<{ place: number; pl: (typeof PLAYERS)[number]; h: number; delay: number; color: string }> = ({ place, pl, h, delay, color }) => {
  const u = useUnit();
  const p = usePop(delay, { damping: 12, mass: 0.7 });
  const frame = useCurrentFrame();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 * u }}>
      <div style={{ transform: `translateY(${(1 - p) * -300 + (place === 1 ? Math.sin(frame / 5) * 8 : 0)}px)`, opacity: p }}>
        <Avatar e={pl.e} acc={place === 1 ? '👑' : pl.acc} size={(place === 1 ? 170 : 130) * u} />
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: 38 * u, color: C.text, opacity: p }}>{pl.name}</div>
      <div
        style={{
          width: 260 * u,
          height: h * u * p,
          borderRadius: `${20 * u}px ${20 * u}px 0 0`,
          background: `linear-gradient(180deg, ${color}, ${color}55)`,
          boxShadow: `0 0 40px ${color}88`,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 20 * u,
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: 80 * u,
          color: C.bg,
          overflow: 'hidden',
        }}
      >
        {place}
      </div>
    </div>
  );
};

export const Winner: React.FC = () => {
  const u = useUnit();
  const fade = useSceneFade(6, 10);
  const title = usePop(20, { damping: 9, mass: 0.6 });
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, gap: 50 * u }}>
      <div
        style={{
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: 92 * u,
          color: C.yellow,
          textShadow: neon(C.yellow, 0.8),
          transform: `scale(${title})`,
          textAlign: 'center',
          padding: '0 40px',
        }}
      >
        👑 ¡LARGA VIDA AL REY! 👑
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 * u }}>
        <Step place={2} pl={PLAYERS[1]} h={220} delay={8} color={C.cyan} />
        <Step place={1} pl={PLAYERS[0]} h={320} delay={14} color={C.yellow} />
        <Step place={3} pl={PLAYERS[4]} h={160} delay={4} color={C.pink} />
      </div>
      <Confetti />
    </AbsoluteFill>
  );
};
