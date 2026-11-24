import React from 'react';
import { AbsoluteFill, Series } from 'remotion';
import { Background } from './scenes/Background';
import { Intro } from './scenes/Intro';
import { Logo } from './scenes/Logo';
import { Lobby } from './scenes/Lobby';
import { Countdown } from './scenes/Countdown';
import { Question } from './scenes/Question';
import { Race } from './scenes/Race';
import { Topics } from './scenes/Topics';
import { Winner } from './scenes/Winner';
import { CallToAction } from './scenes/CallToAction';

const SCENES: [React.FC, number][] = [
  [Intro, 75],
  [Logo, 105],
  [Lobby, 120],
  [Countdown, 90],
  [Question, 165],
  [Race, 150],
  [Topics, 120],
  [Winner, 120],
  [CallToAction, 135],
];

export const TRAILER_DURATION = SCENES.reduce((s, [, d]) => s + d, 0);

export const Trailer: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      {SCENES.map(([Scene, d], i) => (
        <Series.Sequence key={i} durationInFrames={d}>
          <Scene />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);
