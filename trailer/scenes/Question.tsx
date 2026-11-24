import React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { BODY, C, TITLE, neon } from '../theme';
import { Avatar, PLAYERS, usePop, usePortrait, useSceneFade, useUnit } from './util';

const OPTIONS = [
  { l: 'A', t: '5.600,00 €', c: C.optA },
  { l: 'B', t: '5.624,32 €', c: C.optB, ok: true },
  { l: 'C', t: '5.200,00 €', c: C.optC },
  { l: 'D', t: '5.849,29 €', c: C.optD },
];
const REVEAL = 95;

export const Question: React.FC = () => {
  const u = useUnit();
  const portrait = usePortrait();
  const frame = useCurrentFrame();
  const fade = useSceneFade(6, 8);
  const card = usePop(0, { damping: 14, mass: 0.7 });
  const time = interpolate(frame, [15, REVEAL], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const secs = Math.ceil(time * 20);
  const revealed = frame >= REVEAL;
  const sol = usePop(REVEAL + 8);
  const answered = Math.min(PLAYERS.length, Math.max(0, Math.floor((frame - 30) / 7)));

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', opacity: fade, padding: 70 * u, gap: 34 * u }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 * u, width: '100%', maxWidth: 1500 * u }}>
        <div style={{ fontFamily: TITLE, fontWeight: 700, fontSize: 30 * u, color: C.pink, letterSpacing: 3 * u, textShadow: neon(C.pink, 0.3) }}>
          🚀 INTERÉS COMPUESTO
        </div>
        <div style={{ flex: 1, height: 18 * u, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div
            style={{
              width: `${time * 100}%`,
              height: '100%',
              borderRadius: 99,
              background: time > 0.3 ? `linear-gradient(90deg, ${C.green}, ${C.cyan})` : `linear-gradient(90deg, ${C.red}, ${C.orange})`,
              boxShadow: `0 0 20px ${time > 0.3 ? C.cyan : C.red}`,
            }}
          />
        </div>
        <div style={{ fontFamily: TITLE, fontWeight: 900, fontSize: 48 * u, color: time > 0.3 ? C.text : C.red, width: 90 * u, textAlign: 'right' }}>{secs > 0 ? secs : "⏱"}</div>
      </div>

      <div
        style={{
          fontFamily: BODY,
          fontWeight: 600,
          fontSize: (portrait ? 54 : 56) * u,
          color: C.text,
          textAlign: 'center',
          lineHeight: 1.25,
          maxWidth: 1500 * u,
          padding: `${36 * u}px ${50 * u}px`,
          borderRadius: 30 * u,
          background: 'rgba(255,255,255,0.06)',
          border: '2px solid rgba(255,255,255,0.14)',
          transform: `scale(${card})`,
        }}
      >
        Inviertes <b style={{ color: C.yellow }}>5.000 €</b> al <b style={{ color: C.yellow }}>4 %</b> de interés compuesto anual durante{' '}
        <b style={{ color: C.yellow }}>3 años</b>. ¿Qué capital final obtienes?
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: portrait ? '1fr' : '1fr 1fr',
          gap: 24 * u,
          width: '100%',
          maxWidth: 1500 * u,
        }}
      >
        {OPTIONS.map((o, i) => {
          const p = usePop(10 + i * 5);
          const dim = revealed && !o.ok;
          const okPulse = revealed && o.ok ? 1 + Math.sin((frame - REVEAL) / 3) * 0.03 : 1;
          return (
            <div
              key={o.l}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 26 * u,
                padding: `${22 * u}px ${30 * u}px`,
                borderRadius: 24 * u,
                background: o.c,
                opacity: (dim ? 0.25 : 1) * p,
                transform: `scale(${p * okPulse})`,
                boxShadow: revealed && o.ok ? `0 0 0 6px #fff, 0 0 50px ${C.green}` : `0 8px 0 rgba(0,0,0,0.3)`,
                fontFamily: BODY,
                fontWeight: 800,
                fontSize: 50 * u,
                color: '#fff',
              }}
            >
              <span
                style={{
                  fontFamily: TITLE,
                  width: 70 * u,
                  height: 70 * u,
                  borderRadius: 16 * u,
                  background: 'rgba(0,0,0,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40 * u,
                }}
              >
                {o.l}
              </span>
              {o.t}
              {revealed && o.ok ? <span style={{ marginLeft: 'auto' }}>✅</span> : null}
            </div>
          );
        })}
      </div>

      <div style={{ height: 120 * u, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {revealed ? (
          <div
            style={{
              fontFamily: TITLE,
              fontWeight: 700,
              fontSize: (portrait ? 36 : 44) * u,
              color: C.green,
              textShadow: neon(C.green, 0.4),
              opacity: sol,
              transform: `translateY(${(1 - sol) * 30}px)`,
              textAlign: 'center',
            }}
          >
            Cₙ = C₀·(1 + i)ⁿ = 5.000·1,04³ = 5.624,32 €
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 * u }}>
            <span style={{ fontFamily: BODY, fontSize: 34 * u, color: C.muted, marginRight: 10 * u }}>Han respondido</span>
            {PLAYERS.slice(0, answered).map((p) => (
              <Avatar key={p.name} e={p.e} acc={p.acc} size={70 * u} />
            ))}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};
