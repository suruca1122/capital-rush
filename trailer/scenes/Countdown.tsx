import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { C, TITLE, neon } from '../theme';
import { useUnit } from './util';

const STEPS = [
  { t: '3', c: C.cyan },
  { t: '2', c: C.pink },
  { t: '1', c: C.yellow },
  { t: '¡YA!', c: C.green },
];

export const Countdown: React.FC = () => {
  const u = useUnit();
  const frame = useCurrentFrame();
  const per = 20;
  const idx = Math.min(STEPS.length - 1, Math.floor(frame / per));
  const local = frame - idx * per;
  const last = idx === STEPS.length - 1;
  const scale = interpolate(local, [0, 6, per], [2.4, 1, last ? 1.15 : 0.85], { extrapolateRight: 'clamp' });
  const opacity = last
    ? interpolate(frame, [60, 64, 82, 90], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(local, [0, 4, per - 4, per], [0, 1, 1, 0]);
  const step = STEPS[idx];
  const ring = interpolate(local, [0, per], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          position: 'absolute',
          width: 500 * u,
          height: 500 * u,
          borderRadius: '50%',
          border: `8px solid ${step.c}`,
          opacity: (1 - ring) * 0.8,
          transform: `scale(${0.6 + ring * 1.6})`,
          boxShadow: `0 0 40px ${step.c}`,
        }}
      />
      <div
        style={{
          fontFamily: TITLE,
          fontWeight: 900,
          fontSize: (last ? 260 : 380) * u,
          color: step.c,
          textShadow: neon(step.c, 1.2),
          transform: `scale(${scale})`,
          opacity,
        }}
      >
        {step.t}
      </div>
    </AbsoluteFill>
  );
};
