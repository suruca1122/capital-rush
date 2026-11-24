import React from 'react';
import { Composition } from 'remotion';
import { Trailer, TRAILER_DURATION } from './Trailer';

export const Root: React.FC = () => (
  <>
    <Composition
      id="Trailer"
      component={Trailer}
      durationInFrames={TRAILER_DURATION}
      fps={30}
      width={1920}
      height={1080}
    />
    <Composition
      id="TrailerVertical"
      component={Trailer}
      durationInFrames={TRAILER_DURATION}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
