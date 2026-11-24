import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { Avatar, PLAYERS, usePop, usePortrait, useSceneFade, useUnit } from './util';

const Chip: React.FC<{ i: number; size: number }> = ({ i, size }) => {
  const p = usePop(22 + i * 8, { damping: 9, mass: 0.5 });
  const pl = PLAYERS[i];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        transform: `scale(${p}) translateY(${(1 - p) * 40}px)`,
        opacity: p > 0.01 ? 1 : 0,
      }}
    >
      <div
        style={{
          width: size * 1.35,
          height: size * 1.35,
          borderRadius: '50%',
          background: `${pl.color}22`,
          border: `3px solid ${pl.color}`,
          boxShadow: `0 0 25px ${pl.color}88`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Avatar e={pl.e} acc={pl.acc} size={size} />
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 800, fontSize: size * 0.32, color: C.text }}>{pl.name}</div>
    </div>
  );
};

export const Lobby: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const frame = useCurrentFrame();
  const fade = useSceneFade(8, 8);
  const head = usePop(0);
  const code = usePop(8);
  const count = Math.min(PLAYERS.length, Math.max(0, Math.floor((frame - 22) / 8) + 1));
  const avatarSize = 110 * u;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, gap: 40 * u, padding: 60 * u }}>
      <div
        style={{
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: 64 * u,
          color: C.text,
          textShadow: neon(C.pink, 0.5),
          opacity: head,
          transform: `translateY(${(1 - head) * -40}px)`,
          textAlign: 'center',
        }}
      >
        Entra desde el móvil 📱
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 * u, transform: `scale(${code})`, flexDirection: portrait ? 'column' : 'row' }}>
        <div style={{ fontFamily: BODY, fontSize: 36 * u, color: C.muted }}>Código de sala</div>
        <div style={{ display: 'flex', gap: 14 * u }}>
          {'REYX'.split('').map((l, i) => (
            <div
              key={i}
              style={{
                fontFamily: TITLE,
                fontWeight: 900,
                fontSize: 90 * u,
                width: 120 * u,
                height: 140 * u,
                borderRadius: 20 * u,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.yellow,
                background: 'rgba(255,255,255,0.06)',
                border: `2px solid rgba(255,255,255,0.14)`,
                textShadow: neon(C.yellow, 0.5),
                transform: `translateY(${Math.sin((frame + i * 6) / 7) * 6}px)`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${portrait ? 4 : 8}, auto)`,
          gap: `${30 * u}px ${36 * u}px`,
          marginTop: 10 * u,
        }}
      >
        {PLAYERS.map((_, i) => (
          <Chip key={i} i={i} size={avatarSize} />
        ))}
      </div>
      <div style={{ fontFamily: BODY, fontWeight: 600, fontSize: 40 * u, color: C.green, opacity: interpolate(frame, [30, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
        {count} {count === 1 ? 'jugador' : 'jugadores'} listos · elige tu avatar gracioso
      </div>
    </AbsoluteFill>
  );
};
