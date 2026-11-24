import React from 'react';
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from 'remotion';
import { C } from '../theme';

const FLOATERS = ['💰', '📈', '👑', '💶', '🧾', '📒', '⚡', '🏁'];

export const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const s = Math.min(width, height);
  const cell = 90;
  const gridOffset = (frame * 3) % cell;

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at 50% 120%, ${C.pink}40 0%, transparent 55%),
          radial-gradient(ellipse at 10% -10%, ${C.cyan}2a 0%, transparent 50%),
          linear-gradient(180deg, ${C.bg} 0%, ${C.bg2} 100%)`,
        overflow: 'hidden',
      }}
    >
      {/* Sol synthwave */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '30%',
          width: s * 0.6,
          height: s * 0.6,
          transform: `translateX(-50%) translateY(${interpolate(frame, [0, 1200], [20, -20])}px)`,
          borderRadius: '50%',
          background: `linear-gradient(180deg, ${C.yellow} 0%, ${C.orange} 45%, ${C.pink} 80%)`,
          WebkitMaskImage:
            'linear-gradient(180deg, #000 0 48%, transparent 48% 52%, #000 52% 61%, transparent 61% 66%, #000 66% 74%, transparent 74% 80%, #000 80% 86%, transparent 86% 92%, #000 92%)',
          filter: `drop-shadow(0 0 50px ${C.pink}aa)`,
          opacity: 0.35,
        }}
      />
      {/* Rejilla en perspectiva */}
      <div
        style={{
          position: 'absolute',
          left: '-50%',
          right: '-50%',
          bottom: '-10%',
          height: '45%',
          backgroundImage: `linear-gradient(${C.pink} 3px, transparent 3px), linear-gradient(90deg, ${C.pink} 3px, transparent 3px)`,
          backgroundSize: `${cell}px ${cell}px`,
          backgroundPosition: `0 ${gridOffset}px, 0 0`,
          transform: 'perspective(320px) rotateX(60deg)',
          transformOrigin: 'bottom',
          opacity: 0.25,
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 40%)',
        }}
      />
      {/* Emojis flotando */}
      {new Array(16).fill(0).map((_, i) => {
        const speed = 0.8 + random(`sp${i}`) * 1.4;
        const y = height + 100 - ((frame * speed + random(`y${i}`) * (height + 200)) % (height + 200));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: random(`x${i}`) * width,
              top: y,
              fontSize: 30 + random(`s${i}`) * 30,
              opacity: 0.12,
              transform: `rotate(${frame * (random(`r${i}`) - 0.5) * 2}deg)`,
            }}
          >
            {FLOATERS[i % FLOATERS.length]}
          </div>
        );
      })}
      {/* Viñeta y scanlines */}
      <AbsoluteFill
        style={{
          background: 'repeating-linear-gradient(180deg, rgba(0,0,0,0.12) 0 2px, transparent 2px 4px)',
          mixBlendMode: 'multiply',
        }}
      />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 250px rgba(0,0,0,0.8)' }} />
    </AbsoluteFill>
  );
};
