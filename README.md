## INSTRUCTIONS

  1. install dependencies by running `npm install`
  2. make a copy of '.env.example' file and rename it as '.env'
  3. change the listed IP to your machine's IP address.
  4. download speech recognition toolkit (see below)
  5. run `npx tsx backend/server.ts`
  6. keep the backend running and open a new terminal
  7. run `py backend/voice/voice_listener.py --model models/vosk-model-small-en-us-0.15 --host <your-machine-ip>`
  8. open another terminal, ensure you are in the root directory and run `npx expo start`



## TELEMETRY SIMULATION

open the following link for telemetry simulation interface

http://localhost:8080/simulator



## SPEECH RECOGNITION TOOLKIT

install python packages and vosk model:
  - `py -m pip install -r requirements.txt`
  - go to https://alphacephei.com/vosk/models download vosk-model-small-en-us-0.15.zip
  - `unzip vosk-model-small-en-us-0.15.zip -d models/` or manually unzip into project folder/models

targeting a specific micrpophones:
  1. run `py backend/voice/voice_listener.py --list-devices`
  2. pass `--device <index number>` when running vosk model
      eg: `py backend/voice/voice_listener.py --model models/vosk-model-small-en-us-0.15 --device 1`

see exact phrases
  `py backend/voice/voice_listener.py --model models\vosk-model-small-en-us-0.15 --list-grammar`
freeform fallback
  `py backend/voice/voice_listener.py --model models\vosk-model-small-en-us-0.15 --no-grammar`