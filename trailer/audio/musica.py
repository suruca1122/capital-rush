"""Genera la música y el efecto de sonido del tráiler (synthwave, 90 BPM) y mezcla la voz en off.

Uso: python musica.py <carpeta_con_vo_XX.wav> <voz.json> <carpeta_salida>
Salida: musica.wav (con ducking bajo la voz) y voz.wav, ambas estéreo de 36 s a 44,1 kHz.
"""
import json, sys
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

SR = 44100
DUR = 36.0
N = int(SR * DUR)
BPM = 90
BEAT = 60 / BPM          # 0,667 s: la cuenta atrás va a un tiempo por número
BAR = 4 * BEAT
rng = np.random.default_rng(7)

# Momentos clave del vídeo (s)
LOGO, LOBBY, COUNT, GO, QUESTION, REVEAL, RACE, TOPICS, WINNER, CTA = 2.5, 6.0, 10.0, 12.0, 13.0, 16.17, 18.5, 23.5, 27.5, 31.5

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)

def lp(x, fc, order=2):
    return sosfilt(butter(order, min(fc, SR / 2 - 100), 'low', fs=SR, output='sos'), x)

def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)

def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)

def blep(p, dt):
    out = np.zeros_like(p)
    a = p < dt; t = p[a] / dt[a] if np.ndim(dt) else p[a] / dt
    out[a] = t + t - t * t - 1
    b = p > 1 - (dt if not np.ndim(dt) else dt); t = (p[b] - 1) / (dt if not np.ndim(dt) else dt[b])
    out[b] = t * t + t + t + 1
    return out

def saw(f, n, phase=0.0):
    t = np.arange(n) / SR
    dt = f / SR
    p = (phase + f * t) % 1.0
    return 2 * p - 1 - blep(p, dt)

def square(f, n):
    return np.sign(np.sin(2 * np.pi * f * np.arange(n) / SR)) * 0.8

def env(n, a=0.005, d=0.2, s=0.0, r=0.05, hold=None):
    t = np.arange(n) / SR
    hold = hold if hold is not None else n / SR
    e = np.where(t < a, t / max(a, 1e-6), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-6)))
    rel = t > hold
    e[rel] *= np.exp(-(t[rel] - hold) / max(r, 1e-6))
    return e

def put(buf, x, t0, gain=1.0):
    i = int(t0 * SR)
    if i >= len(buf):
        return
    x = x[: len(buf) - i]
    buf[i: i + len(x)] += gain * x

def reverb(x, secs=1.8, seed=0, mix=0.3):
    r = np.random.default_rng(seed)
    n = int(secs * SR)
    ir = r.standard_normal(n) * np.exp(-np.arange(n) / SR * 6.0 / secs)
    ir = lp(ir, 6000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = fftconvolve(x, ir)[: len(x)]
    return (1 - mix) * x + mix * wet

# ---------------------------------------------------------------- armonía
# La menor: Am – F – C – G (i–VI–III–VII); en el final, F – G – Am con más brillo
PROG = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
def chord_at(t):
    return PROG[int(t // BAR) % 4]

def section(t):
    if t < LOGO: return 'intro'
    if t < LOBBY: return 'logo'
    if t < COUNT: return 'lobby'
    if t < GO: return 'count'
    if t < WINNER: return 'groove'
    if t < CTA: return 'winner'
    return 'outro'

beats = np.arange(0, DUR, BEAT)

# ---------------------------------------------------------------- pista: pad
padL = np.zeros(N); padR = np.zeros(N)
for b in np.arange(0, DUR, BAR):
    n = int(BAR * SR) + int(0.6 * SR)
    for k, note in enumerate(chord_at(b + 0.01)):
        f = midi(note)
        for det, side in ((-0.12, 0), (0.0, 2), (0.12, 1)):
            v = saw(f * 2 ** (det / 12), n, phase=rng.random()) * env(n, a=0.4, d=9, s=0.8, r=0.4, hold=BAR)
            v = lp(v, 1800)
            if side in (0, 2): put(padL, v, b, 0.05)
            if side in (1, 2): put(padR, v, b, 0.05)

# ---------------------------------------------------------------- pista: arpegio (semicorcheas)
arp = np.zeros(N)
step = BEAT / 4
for i, t in enumerate(np.arange(0, DUR, step)):
    sec = section(t)
    if sec in ('count',) or t > 34.6:
        continue
    ch = chord_at(t)
    pattern = [0, 1, 2, 3, 2, 1, 3, 4]
    tone = pattern[i % 8]
    note = ch[tone % 3] + 12 * (1 + tone // 3)
    n = int(0.25 * SR)
    # el filtro se va abriendo durante la intro y el logo
    cutoff = np.interp(t, [0, LOBBY, GO, WINNER - 1.5, WINNER], [500, 2600, 3200, 6000, 4200])
    v = (saw(midi(note), n) * 0.6 + square(midi(note) * 1.005, n) * 0.4) * env(n, a=0.002, d=0.09)
    put(arp, lp(v, cutoff), t, 0.07 if sec != 'outro' else 0.035)

# ---------------------------------------------------------------- pista: bajo (corcheas, con octava)
bass = np.zeros(N)
for i, t in enumerate(np.arange(0, DUR, BEAT / 2)):
    sec = section(t)
    if sec in ('intro', 'logo', 'count') or t > 34.6:
        continue
    root = chord_at(t)[0] - 12 - (12 if chord_at(t)[0] > 52 else 0)
    note = root + (12 if i % 2 else 0)
    n = int(BEAT / 2 * SR)
    v = lp(saw(midi(note), n), 500) * 0.7 + np.sin(2 * np.pi * midi(root) * np.arange(n) / SR) * 0.5
    put(bass, v * env(n, a=0.003, d=0.25, s=0.4, r=0.02, hold=BEAT / 2 - 0.03), t, 0.22 if sec != 'outro' else 0.12)

# ---------------------------------------------------------------- batería
def kick():
    n = int(0.45 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) + 0.3 * np.exp(-t * 300) * rng.standard_normal(n) * 0.2

def snare():
    n = int(0.3 * SR); t = np.arange(n) / SR
    return bp(rng.standard_normal(n), 1200, 8000) * np.exp(-t * 16) * 0.8 + np.sin(2 * np.pi * 185 * t) * np.exp(-t * 25) * 0.6

def hat(open_=False):
    n = int((0.25 if open_ else 0.06) * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 8000) * np.exp(-t * (12 if open_ else 70))

def crash(secs=2.5):
    n = int(secs * SR); t = np.arange(n) / SR
    return hp(rng.standard_normal(n), 4000) * np.exp(-t * 2.2)

drums = np.zeros(N)
pump = np.ones(N)  # sidechain del bombo sobre pad y bajo
K = kick()
for i, t in enumerate(beats):
    sec = section(t)
    if sec in ('lobby', 'groove', 'winner') or (sec == 'outro' and t < 34.6 and i % 2 == 0):
        put(drums, K, t, 0.75)
        i0 = int(t * SR); m = min(int(0.3 * SR), N - i0)
        pump[i0: i0 + m] = np.minimum(pump[i0: i0 + m], 1 - 0.55 * np.exp(-np.arange(m) / SR * 14))
    if sec in ('groove', 'winner') and i % 2 == 1:
        put(drums, snare(), t, 0.45)
    if sec in ('lobby', 'groove', 'winner'):
        put(drums, hat(), t + BEAT / 2, 0.12)
        put(drums, hat(), t, 0.06)
        if sec != 'lobby':
            put(drums, hat(), t + BEAT / 4, 0.05); put(drums, hat(), t + 3 * BEAT / 4, 0.05)

# redoble de caja antes del ganador
roll_start = WINNER - 2 * BEAT
for k, t in enumerate(np.arange(roll_start, WINNER, BEAT / 8)):
    put(drums, snare(), t, 0.1 + 0.3 * k / 16)

# ---------------------------------------------------------------- melodía del ganador
lead = np.zeros(N)
MELODY = [(0, 76, 1), (1, 79, 1), (2, 81, 2), (4, 79, 0.5), (4.5, 76, 0.5), (5, 74, 1), (6, 76, 2)]
for b0, note, d in MELODY:
    t = WINNER + 0.05 + b0 * BEAT * 0.75
    n = int(d * BEAT * 0.75 * SR)
    tt = np.arange(n) / SR
    f = midi(note) * (1 + 0.006 * np.sin(2 * np.pi * 5.5 * tt) * np.clip(tt * 3, 0, 1))
    v = saw(f, n) * 0.5 + np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.3
    put(lead, lp(v, 3500) * env(n, a=0.01, d=1.5, s=0.7, r=0.08, hold=n / SR - 0.06), t, 0.12)

# ---------------------------------------------------------------- golpes, subidas y efectos
fx = np.zeros(N)
def impact(secs=3.0):
    n = int(secs * SR); t = np.arange(n) / SR
    boom = np.sin(2 * np.pi * np.cumsum(30 + 80 * np.exp(-t * 6)) / SR) * np.exp(-t * 2.2)
    return boom + crash(secs) * 0.5

def riser(secs):
    n = int(secs * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n)
    out = np.zeros(n); seg = int(0.05 * SR)
    for s in range(0, n, seg):
        fc = 300 + 7000 * (s / n) ** 2
        out[s: s + seg] = bp(x[s: s + seg], fc, min(fc * 2.5, 18000))
    return out * (t / secs) ** 2

def whoosh(secs=0.6):
    n = int(secs * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n); seg = int(0.02 * SR)
    for s in range(0, n, seg):
        fc = 600 + 5000 * np.sin(np.pi * s / n)
        out[s: s + seg] = bp(x[s: s + seg], fc, fc * 1.8)
    return out * np.sin(np.pi * t / secs) ** 2

def blip(note, secs=0.18, vol=1.0):
    n = int(secs * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * midi(note) * t) + 0.3 * square(midi(note), n)) * np.exp(-t * 18) * vol

def bell(notes, gap=0.09):
    n = int(1.2 * SR); t = np.arange(n) / SR
    out = np.zeros(n + int(gap * SR * len(notes)))
    for k, note in enumerate(notes):
        f = midi(note)
        v = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 6)) * np.exp(-t * 4)
        out[int(k * gap * SR): int(k * gap * SR) + n] += v
    return out

put(fx, riser(2.3), LOGO - 2.3, 0.12)
put(fx, impact(), LOGO, 0.6)
for t in (LOBBY, QUESTION, RACE, TOPICS):
    put(fx, whoosh(), t - 0.3, 0.18)
for i in range(8):                       # avatares entrando en la sala
    put(fx, blip(84 + [0, 3, 5, 7, 10, 12, 15, 17][i], 0.12), LOBBY + (22 + 8 * i) / 30, 0.12)
for k in range(3):                        # 3, 2, 1
    put(fx, blip(81, 0.35), COUNT + k * BEAT, 0.3)
put(fx, blip(93, 0.6), GO, 0.2)
put(fx, impact(2.5), GO, 0.25)
put(fx, riser(1.8), REVEAL - 1.8, 0.05)
put(fx, bell([84, 88, 91, 96]), REVEAL - 0.1, 0.12)
put(fx, impact(), WINNER, 0.55)
for k in range(10):                       # confeti
    put(fx, hp(rng.standard_normal(int(0.05 * SR)), 3000) * np.exp(-np.arange(int(0.05 * SR)) / SR * 80), WINNER + 0.6 + rng.random() * 0.8, 0.15)
put(fx, impact(4.0), CTA, 0.4)

# acorde final largo
final = np.zeros(N)
n = int(1.6 * SR)
for note in (45, 57, 60, 64, 69, 72, 76):
    v = saw(midi(note), n, rng.random()) * env(n, a=0.01, d=1.2, s=0.0)
    put(final, lp(v, 2500), 34.6, 0.05)

# ---------------------------------------------------------------- mezcla
def section_gain(x, curve):
    return x * np.interp(np.arange(N) / SR, *zip(*curve))

pad_curve = [(0, 0.0), (1.2, 1.0), (COUNT, 1.0), (COUNT + 0.05, 0.55), (GO, 0.55), (GO + 0.01, 1.0), (DUR, 1.0)]
padL = section_gain(padL, pad_curve) * pump; padR = section_gain(padR, pad_curve) * pump
bass *= pump
drums_st = reverb(drums, 0.8, 1, 0.12)
arpL = reverb(arp, 1.6, 2, 0.35); arpR = reverb(np.roll(arp, int(0.011 * SR)), 1.6, 3, 0.35)
leadL = reverb(lead, 2.0, 4, 0.35); leadR = reverb(lead, 2.0, 5, 0.35)
fxL = reverb(fx, 2.2, 6, 0.3); fxR = reverb(fx, 2.2, 7, 0.3)
finL = reverb(final, 2.5, 8, 0.4); finR = reverb(final, 2.5, 9, 0.4)
padL = reverb(padL, 2.5, 10, 0.4); padR = reverb(padR, 2.5, 11, 0.4)

music = np.stack([
    padL + arpL + bass + drums_st + leadL * 0.9 + finL,
    padR + arpR + bass + drums_st + leadR * 1.1 + finR,
], axis=1)
sfx = np.stack([fxL, fxR], axis=1)

# ---------------------------------------------------------------- voz
vo_dir, lines_path, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
lines = json.load(open(lines_path))
voice = np.zeros(N)
for i, (t0, _, _) in enumerate(lines):
    x, sr = sf.read(f"{vo_dir}/vo_{i:02d}.wav", dtype='float32')
    if sr != SR:
        x = resample_poly(x, SR, sr)
    x = hp(x, 90)
    x = x / (np.max(np.abs(x)) + 1e-9)
    put(voice, x, t0)
# compresión suave y un poco de presencia
voice = np.sign(voice) * (1 - np.exp(-np.abs(voice) * 2.2)) / (1 - np.exp(-2.2))
voice = voice + 0.25 * bp(voice, 2500, 6000)
voice_st = np.stack([reverb(voice, 1.0, 12, 0.1)] * 2, axis=1)

# ducking: la música baja cuando habla la voz
e = np.abs(voice)
win = int(0.08 * SR)
e = np.convolve(e, np.ones(win) / win, 'same')
e = np.clip(e / (np.percentile(e[e > 0.01], 60) + 1e-9), 0, 1)
# envolvente con ataque rápido y liberación lenta (vectorizada por bloques)
blk = 256
lev = 0.0; duck = np.ones(N)
for s in range(0, N, blk):
    m = e[s: s + blk].max()
    lev = m if m > lev else lev * np.exp(-blk / (0.35 * SR))
    duck[s: s + blk] = 1 - 0.65 * min(lev, 1)
music *= duck[:, None]

music = music + sfx * 0.9
fade = np.clip((DUR - np.arange(N) / SR) / 0.8, 0, 1)
music *= fade[:, None]

def normalize(x, peak):
    return x * (peak / (np.max(np.abs(x)) + 1e-9))

music = np.tanh(normalize(music, 1.1)) * 0.8   # saturación suave como limitador
voice_st = normalize(voice_st, 0.85)
sf.write(f"{out_dir}/musica.wav", music.astype(np.float32), SR, subtype='PCM_16')
sf.write(f"{out_dir}/voz.wav", voice_st.astype(np.float32), SR, subtype='PCM_16')
print('ok', music.shape, voice_st.shape)
