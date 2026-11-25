import sys, json, numpy as np, soundfile as sf, sherpa_onnx
M = sys.argv[1]; OUT = sys.argv[2]
tts = sherpa_onnx.OfflineTts(sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    vits=sherpa_onnx.OfflineTtsVitsModelConfig(model=f"{M}/es_ES-davefx-medium.onnx", tokens=f"{M}/tokens.txt", data_dir=f"{M}/espeak-ng-data"),
    num_threads=4)))
LINES = json.load(open(sys.argv[3]))
info = []
for i, (t, speed, text) in enumerate(LINES):
    a = tts.generate(text, sid=0, speed=speed)
    x = np.array(a.samples, dtype=np.float32)
    # recortar silencios
    idx = np.where(np.abs(x) > 0.01)[0]; x = x[max(0, idx[0]-200): idx[-1]+800]
    sf.write(f"{OUT}/vo_{i:02d}.wav", x, a.sample_rate)
    info.append((i, t, round(len(x)/a.sample_rate, 2), round(t+len(x)/a.sample_rate, 2), text))
for r in info: print(*r, sep=" | ")
