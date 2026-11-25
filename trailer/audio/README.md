# Audio del tráiler

- `voz.json`: guion de la voz en off. Cada línea es `[segundo de inicio, velocidad, texto]`.
- `voz.py`: genera una voz por línea con Piper (voz `es_ES-davefx-medium`) a través de `sherpa-onnx`.
- `musica.py`: compone la música synthwave (90 BPM) y los efectos, sincronizados con las escenas. Mezcla la voz y baja la música cuando hay voz.
- El resultado va a `trailer/public/audio/musica.mp3` y `voz.mp3`, que `Trailer.tsx` reproduce.

## Regenerar

```bash
python3 -m venv .venv && .venv/bin/pip install "sherpa-onnx<2" numpy scipy soundfile
curl -LO https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-es_ES-davefx-medium.tar.bz2
tar -xjf vits-piper-es_ES-davefx-medium.tar.bz2
mkdir -p tmp
.venv/bin/python trailer/audio/voz.py vits-piper-es_ES-davefx-medium tmp trailer/audio/voz.json
.venv/bin/python trailer/audio/musica.py tmp trailer/audio/voz.json tmp
ffmpeg -y -i tmp/musica.wav -b:a 192k trailer/public/audio/musica.mp3
ffmpeg -y -i tmp/voz.wav -b:a 192k trailer/public/audio/voz.mp3
```
