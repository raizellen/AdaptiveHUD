# Adaptive HUD

An adaptive heads-up display interface designed for an astronaut suit in extravehicular activities. The adaptive engine features a context manager, telemetry prioritisation, information manager and a display state manager.

Created for Engineering Capstone: Designing an Astronaut Suit.

## Instructions

  1. install dependencies by running `npm install`
  2. download speech recognition toolkit (see below)
  3. run `npm run dev`

That starts the backend, the telemetry processing layer, the voice listener and Expo together. Press Ctrl+C to stop all of them.

There is no IP address to set: the app finds the backend automatically through Expo (it connects to the same computer that is serving the app). `.env` is optional. See `.env.example` for the one case where you need it.

Options:
  - `npm run dev -- --no-voice`   skip the voice listener (no mic / model yet)
  - `npm run dev -- --no-expo`    skip Expo (run `npx expo start` yourself)
  - `npm run dev -- --device 1`   anything else goes to the voice listener
                                  (here: pick microphone number 1)

Python is found automatically (`py` on Windows, `python3` elsewhere, or a `.venv` folder if you have one). To use a different one, set the `PYTHON` environment variable.

Running the pieces separately (what `npm run dev` does for you)
### Terminal 1 — backend (HTTP + WebSocket, port 8080)
npx tsx backend/server.ts

### Terminal 2 — telemetry data processing layer (port 8090)
py backend/data_processing/telemetryProcessor.py --port 8090

### Terminal 3 — voice listener (no port, just posts to 8080)
py backend/voice/voice_listener.py --model models/vosk-model-small-en-us-0.15

### Terminal 4 — Expo (port 8081, for the phone app bundle)
npx expo start


## Telemetry Simulator

open the following link for telemetry simulation interface

http://localhost:8080/simulator



## Speech Recognition

install python packages and vosk model:
  - `py -m pip install -r requirements.txt`
  - go to https://alphacephei.com/vosk/models download vosk-model-small-en-us-0.15.zip
  - `unzip vosk-model-small-en-us-0.15.zip -d models/` or manually unzip into project folder/models

targeting specific microphones:
  1. run `py backend/voice/voice_listener.py --list-devices`
  2. pass `--device <index number>` when running vosk model
      eg: `py backend/voice/voice_listener.py --model models/vosk-model-small-en-us-0.15 --device 1`

see exact phrases
  `py backend/voice/voice_listener.py --model models\vosk-model-small-en-us-0.15 --list-grammar`
freeform fallback
  `py backend/voice/voice_listener.py --model models\vosk-model-small-en-us-0.15 --no-grammar`