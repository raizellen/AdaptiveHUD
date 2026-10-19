# replacement for voice-simulator.html
# remove dependency on broswer's web speech API - only works in on browser

import argparse
import json
import time
import queue
import sys

import requests
import sounddevice as sd
from vosk import KaldiRecognizer, Model

# restricting Vosk to only these phrases (a "grammar") is much more accurate than free-form dictation
VERBS = ["show", "check", "whats", "display", "unhide", "focus", "hide"]
# Mission and timer panels can be shown, focused or hidden the same way.
PANELS = ["mission", "timer"]
PANEL_VERBS = ["show", "display", "focus", "unhide", "hide"]
METRIC_ALIASES = {
  "bpm": ["heart rate", "pulse", "b p m"],
  "spo2": ["blood oxygen", "oxygen", "spo2", "s p o two"],
  "battery": ["battery", "power"],
  "temperature": ["temperature", "temp"],
}
FIXED_PHRASES = [
  "status report",
  "status",
  "report",
  "show alert",
  "show alerts",
  "hide all",
  "hide everything",
  "hide metrics",
  "hide the metrics",
  "hide all metrics",
  "show all",
  "show everything",
  "show metrics",
  "show the metrics",
  "show all metrics",
  "unhide all",
  "unhide everything",
  "unhide metrics",
  "unhide the metrics",
  "unhide all metrics",
  "hows it looking",
  "acknowledge",
  "clear alert",
  "dismiss alert",
  "copy that",
  "mute alerts",
  "mute the alerts",
  "silence alerts",
  "silence the alerts",
  "unmute alerts",
  "unmute the alerts",
  "resume alerts",
  "resume the alerts",
]

# Timer commands. "set timer for <duration>" needs the durations spelled
# out because Vosk can only recognize phrases it has been given, so the
# set below covers the common ones. Anything else can still be typed or
# sent through the web speech path, which the parser also understands.
TIMER_VERBS = ["start", "begin", "resume", "pause", "stop", "reset", "restart", "clear"]
TIMER_SET_PREFIXES = ["set timer for", "set the timer for", "set a timer for"]
TIMER_MINUTES = list(range(1, 61)) + [75, 90, 120]
TIMER_SECONDS = [5, 10, 15, 20, 30, 45]
TIMER_HOURS = [1, 2, 3]
TIMER_HOUR_EXTRA_MINUTES = [15, 30, 45]

ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen",
]
TENS = {
  2: "twenty", 3: "thirty", 4: "forty", 5: "fifty",
  6: "sixty", 7: "seventy", 8: "eighty", 9: "ninety",
}


def number_to_words(n: int) -> str:
  """Spell out a number the way Vosk's English model writes it."""
  if n < 20:
    return ONES[n]
  if n < 100:
    tens, ones = divmod(n, 10)
    return TENS[tens] if ones == 0 else f"{TENS[tens]} {ONES[ones]}"
  hundreds, rest = divmod(n, 100)
  head = f"{ONES[hundreds]} hundred"
  return head if rest == 0 else f"{head} {number_to_words(rest)}"


def unit_phrase(n: int, unit: str) -> str:
  return f"{number_to_words(n)} {unit}" if n == 1 else f"{number_to_words(n)} {unit}s"


def timer_durations() -> set[str]:
  durations = {"an hour", "half an hour"}
  for minutes in TIMER_MINUTES:
    durations.add(unit_phrase(minutes, "minute"))
  for seconds in TIMER_SECONDS:
    durations.add(unit_phrase(seconds, "second"))
  for hours in TIMER_HOURS:
    durations.add(unit_phrase(hours, "hour"))
    for minutes in TIMER_HOUR_EXTRA_MINUTES:
      durations.add(f"{unit_phrase(hours, 'hour')} {unit_phrase(minutes, 'minute')}")
  return durations


def build_grammar() -> list[str]:
  """Build the list of phrases Vosk is allowed to recognize.

  "[unk]" is Vosk's convention for "the speaker said something that
  doesn't match anything in this grammar" — including it lets Vosk
  reject unrelated speech instead of force-fitting it to the closest
  known phrase.
  """
  phrases = set(FIXED_PHRASES)
  for verb in VERBS:
    for aliases in METRIC_ALIASES.values():
      for alias in aliases:
        phrases.add(f"{verb} {alias}")
        phrases.add(f"{verb} the {alias}")
  for verb in PANEL_VERBS:
    for panel in PANELS:
      phrases.add(f"{verb} {panel}")
      phrases.add(f"{verb} the {panel}")
  for verb in TIMER_VERBS:
    phrases.add(f"{verb} timer")
    phrases.add(f"{verb} the timer")
  for prefix in TIMER_SET_PREFIXES:
    for duration in timer_durations():
      phrases.add(f"{prefix} {duration}")
  phrases.add("[unk]")
  return sorted(phrases)


def parse_args() -> argparse.Namespace:
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument(
    "--model",
    default="model",
    help="Path to an unzipped Vosk model directory (default: ./model)",
  )
  parser.add_argument(
    "--host",
    default="localhost",
    help="Backend host/IP (default: localhost, as this runs on the same computer as the backend)",
  )
  parser.add_argument(
    "--port",
    type=int,
    default=8080,
    help="Backend port (default: 8080, matches server.ts)",
  )
  parser.add_argument(
    "--device",
    type=int,
    default=None,
    help="Input device index (run with --list-devices to see options)",
  )
  parser.add_argument(
    "--list-devices",
    action="store_true",
    help="List available audio input devices and exit",
  )
  parser.add_argument(
    "--sample-rate",
    type=int,
    default=16000,
    help="Sample rate in Hz (16000 matches most Vosk models)",
  )
  parser.add_argument(
    "--no-grammar",
    dest="grammar",
    action="store_false",
    help="Disable restricted vocabulary; recognize free-form speech "
    "instead (usually less accurate for short fixed commands)",
  )
  parser.add_argument(
    "--list-grammar",
    action="store_true",
    help="Print the restricted vocabulary phrases and exit",
  )
  parser.set_defaults(grammar=True)
  return parser.parse_args()


def send_transcript(url: str, text: str, recognised_at_ms: float) -> None:
  """POST a recognized phrase to the same endpoint voice-simulator.html uses.

  recognised_at_ms is when Vosk finished the phrase; the server uses it to
  report how long the command took to reach it (same laptop, same clock).
  """
  try:
    response = requests.post(
      url,
      json={"text": text, "recognisedAt": recognised_at_ms},
      timeout=5,
    )
    response.raise_for_status()
    command = response.json().get("command", {})
    print(f'  "{text}" -> {command.get("type", "ERROR")}')
  except requests.RequestException as exc:
    print(f'  "{text}" -> SEND FAILED ({exc})')


def main() -> None:
  args = parse_args()

  if args.list_devices:
    print(sd.query_devices())
    return

  if args.list_grammar:
    for phrase in build_grammar():
      print(phrase)
    return

  print("Loading Vosk model from:", args.model)
  try:
    model = Model(args.model)
  except Exception as exc:  # Vosk raises a plain Exception on bad path
    print(f"Couldn't load model at '{args.model}': {exc}")
    print("Download one from https://alphacephei.com/vosk/models")
    sys.exit(1)

  if args.grammar:
    grammar = build_grammar()
    recognizer = KaldiRecognizer(model, args.sample_rate, json.dumps(grammar))
    print(f"Restricted vocabulary active ({len(grammar)} phrases). "
      "Use --no-grammar for free-form recognition or "
      "--list-grammar to see them.")
  else:
    recognizer = KaldiRecognizer(model, args.sample_rate)
    print("Free-form recognition (no grammar restriction).")

  audio_queue: "queue.Queue[bytes]" = queue.Queue()
  endpoint = f"http://{args.host}:{args.port}/voice-transcript"

  def audio_callback(indata, frames, time_info, status):
    if status:
      print(f"Audio status: {status}", file=sys.stderr)
    audio_queue.put(bytes(indata))

  print(f"Posting recognized speech to {endpoint}")
  print("Listening... (Ctrl+C to stop)\n")

  try:
    with sd.RawInputStream(
      samplerate=args.sample_rate,
      blocksize=8000,
      device=args.device,
      dtype="int16",
      channels=1,
      callback=audio_callback,
    ):
      while True:
        data = audio_queue.get()
        if recognizer.AcceptWaveform(data):
          recognised_at_ms = time.time() * 1000
          result = json.loads(recognizer.Result())
          text = result.get("text", "").strip()
          if text:
            send_transcript(endpoint, text, recognised_at_ms)
        else:
          # Partial result — mirrors the "interim" transcript
          # shown live in the HTML simulator.
          partial = json.loads(recognizer.PartialResult())
          partial_text = partial.get("partial", "").strip()
          if partial_text:
            print(f"...{partial_text}", end="\r", flush=True)
  except KeyboardInterrupt:
    print("\nStopped.")
  except Exception as exc:
    print(f"\nAudio input error: {exc}")
    print("Run with --list-devices to check your microphone setup.")
    sys.exit(1)


if __name__ == "__main__":
  main()