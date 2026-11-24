import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { Avatar, PLAYERS, usePop, usePortrait, useSceneFade, useUnit } from './util';

// Posición (0..1) de cada corredor tras cada pregunta
const STAGES = [
  [0.1, 0.08, 0.12, 0.05, 0.09],
  [0.38, 0.3, 0.2, 0.25, 0.33],
  [0.6, 0.62, 0.36, 0.41, 0.48],
  [0.82, 0.74, 0.55, 0.52, 0.66],
];
const FASTEST = [null, 0, 1, 0];
const STEP = 32;

export const Race: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fade = useSceneFade(6, 10);
  const head = usePop(0);
  const runners = PLAYERS.slice(0, 5);
  const stage = Math.min(STAGES.length - 1, Math.floor(frame / STEP));
  const prog = spring({ frame: frame - stage * STEP, fps, config: { damping: 14, mass: 0.6 } });
  const fastest = FASTEST[stage];
  const laneH = (portrait ? 150 : 128) * u;
  const avatar = laneH * 0.72;

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, padding: `${60 * u}px ${40 * u}px`, gap: 40 * u }}>
      <div
        style={{
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: 62 * u,
          color: C.text,
          textAlign: 'center',
          textShadow: neon(C.cyan, 0.5),
          transform: `scale(${head})`,
        }}
      >
        Acierta rápido. <span style={{ color: C.yellow, textShadow: neon(C.yellow, 0.5) }}>Avanza más.</span>
      </div>
      <div style={{ width: '100%', maxWidth: 1700 * u, position: 'relative' }}>
        {runners.map((r, i) => {
          const prev = STAGES[Math.max(0, stage - 1)][i];
          const cur = STAGES[stage][i];
          const x = stage === 0 ? cur : interpolate(prog, [0, 1], [prev, cur]);
          const hop = stage > 0 && prev !== cur ? Math.sin(Math.min(1, prog) * Math.PI) * 30 * u : 0;
          return (
            <div
              key={r.name}
              style={{
                height: laneH,
                position: 'relative',
                borderBottom: '2px dashed rgba(255,255,255,0.15)',
                background: i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  height: 8 * u,
                  width: `calc(${x * 88}% + ${avatar / 2}px)`,
                  transform: 'translateY(-50%)',
                  background: `linear-gradient(90deg, transparent, ${r.color})`,
                  opacity: 0.6,
                  borderRadius: 99,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: `${x * 88}%`,
                  top: (laneH - avatar) / 2 - hop,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12 * u,
                }}
              >
                <Avatar e={r.e} acc={r.acc} size={avatar} />
                {fastest === i ? (
                  <div
                    style={{
                      fontFamily: TITLE,
                      fontWeight: 900,
                      fontSize: 30 * u,
                      color: C.bg,
                      background: C.yellow,
                      padding: `${6 * u}px ${14 * u}px`,
                      borderRadius: 12 * u,
                      boxShadow: `0 0 25px ${C.yellow}`,
                      transform: `scale(${prog})`,
                    }}
                  >
                    ⚡ BONUS
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
        {/* Meta y trono */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 24 * u,
            backgroundImage: 'repeating-conic-gradient(#fff 0 25%, #000 0 50%)',
            backgroundSize: `${24 * u}px ${24 * u}px`,
          }}
        />
        <div style={{ position: 'absolute', right: -10 * u, top: -110 * u, fontSize: 100 * u, filter: `drop-shadow(0 0 25px ${C.yellow})` }}>👑</div>
      </div>
      <div style={{ fontFamily: BODY, fontSize: 36 * u, color: C.muted, textAlign: 'center' }}>
        El más rápido se lleva el <b style={{ color: C.yellow }}>bonus ⚡</b> · Gana quien llega antes al trono
      </div>
    </AbsoluteFill>
  );
};
