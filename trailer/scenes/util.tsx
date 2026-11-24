import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const usePortrait = () => {
  const { width, height } = useVideoConfig();
  return height > width;
};

// Escala relativa al lado corto (1080 en ambas versiones)
export const useUnit = () => {
  const { width, height } = useVideoConfig();
  return Math.min(width, height) / 1080;
};

export const usePop = (delay = 0, config = { damping: 12, mass: 0.6 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// Fundido de entrada/salida de una escena
export const useSceneFade = (inFrames = 8, outFrames = 8) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  return interpolate(
    frame,
    [0, inFrames, durationInFrames - outFrames, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
};

export const Avatar: React.FC<{ e: string; acc?: string; size: number; style?: React.CSSProperties }> = ({
  e,
  acc,
  size,
  style,
}) => {
  const hat = acc && ['🎩', '👑', '🧢', '🎉', '🎀', '🪖'].includes(acc);
  const eyes = acc === '🕶️';
  return (
    <div style={{ position: 'relative', width: size, height: size, fontSize: size * 0.8, lineHeight: 1, ...style }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</div>
      {acc ? (
        <div
          style={{
            position: 'absolute',
            fontSize: size * (eyes ? 0.42 : 0.45),
            left: hat ? '50%' : eyes ? '50%' : '72%',
            top: hat ? '-22%' : eyes ? '24%' : '58%',
            transform: `translateX(-50%) rotate(${hat ? -12 : 0}deg)`,
          }}
        >
          {acc}
        </div>
      ) : null}
    </div>
  );
};

export const PLAYERS = [
  { e: '🦙', acc: '👑', name: 'Lucía', color: '#ff2bd6' },
  { e: '🦖', acc: '🕶️', name: 'Marcos', color: '#00e5ff' },
  { e: '🐸', acc: '🎩', name: 'Sara', color: '#ffd400' },
  { e: '🐧', acc: '💰', name: 'Hugo', color: '#39ff88' },
  { e: '🦄', acc: '🎉', name: 'Nora', color: '#ff6b35' },
  { e: '🤖', acc: '🧢', name: 'Iker', color: '#2f8bff' },
  { e: '🐼', acc: '🔥', name: 'Alba', color: '#ff3b7f' },
  { e: '🥑', acc: '🎀', name: 'Dani', color: '#19d98b' },
];
