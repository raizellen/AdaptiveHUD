# data validation and processing
#!/usr/bin/env python3
"""
telemetryProcessor.py — the "Python Data Processing Layer" referenced
in backend/adaptive_engine/priorityManager.ts:

    // NOTE: these thresholds are the MVP version of the Adaptive HUD
    // Engine's judgment. Once the Python Data Processing Layer exists,
    // it can take over anomaly detection (rate-of-change, sensor
    // cross-checks, etc.) and hand this manager a verdict instead of
    // raw values — the rest of the engine doesn't need to change.

Raw telemetry (from backend/telemetry/simulator.html today, real
sensors later) is validated and checked for anomalies here *before*
it reaches the rest of the Adaptive HUD Engine, so priorityManager.ts
and friends only ever see plausible, cleaned values.

This runs as a small local HTTP service. backend/server.ts calls into
it for every /telemetry update via backend/data_processing/telemetryManager.ts.

Checks performed, per reading:
  1. Type/shape validation — reject non-numeric junk.
  2. Range validation — clamp to physically POSSIBLE bounds. These are
     wider than the warning/critical thresholds in priorityManager.ts:
     those mean "this is dangerous", these mean "this is impossible,
     the sensor is lying".
  3. Rate-of-change validation — flag a reading that moved further
     than physically plausible since the last reading (e.g. battery
     dropping 40 points in one tick) — almost always a sensor glitch,
     not a real event.

When a reading fails validation, the processor falls back to the last
known-good value for that metric rather than passing garbage
downstream, and records why in the returned anomaly list. The rest of
the pipeline (priorityManager.ts etc.) never has to know this
happened.

SETUP
-----
Uses only the Python standard library — nothing to install.

RUN
---
    python backend/data_processing/telemetryProcessor.py --port 8090

Run this in its own terminal, alongside the Node backend and the
voice listener. backend/server.ts calls it automatically for every
telemetry update; if it isn't running, server.ts falls back to using
raw values unprocessed (see telemetryManager.ts) so development still
works without it — you'll just lose anomaly protection until you
start this.
"""

import argparse
import json
from dataclasses import dataclass
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

METRICS = ["bpm", "spo2", "battery", "temperature"]

# Physically IMPOSSIBLE bounds — wider than the warning/critical
# thresholds in priorityManager.ts. A reading outside these ranges
# isn't "dangerous", it's "the sensor is lying".

# The lower bounds also reject the 0 (or -999) that pulse-oximeter
# sensors report when no finger is on them, so "no signal" shows up
# as an anomaly instead of a critical alert.
PLAUSIBLE_RANGES = {
    "bpm": (20, 250),
    "spo2": (50, 100),
    "battery": (0, 100),
    "temperature": (-100, 100),
}

# Largest change physically plausible between two consecutive
# readings. Assumes readings arrive roughly every few seconds, as
# from the simulator/voice_listener cadence today — tune this once
# with real sensor's actual polling interval.
MAX_DELTA = {
    "bpm": 50,
    "spo2": 10,
    "battery": 10,
    "temperature": 15,
}

DEFAULTS = {"bpm": 75, "spo2": 98, "battery": 100, "temperature": 20}


@dataclass
class Anomaly:
    metric: str
    type: str
    raw_value: Any
    note: str

    def to_dict(self) -> dict:
        return {
            "metric": self.metric,
            "type": self.type,
            "rawValue": self.raw_value,
            "note": self.note,
        }


class TelemetryProcessor:
    """Stateful processor — remembers the last known-good reading per
    metric so it can catch rate-of-change anomalies
    across calls, not just within a single reading."""

    def __init__(self) -> None:
        self.last_good: dict = dict(DEFAULTS)

    def process(self, raw: dict) -> dict:
        anomalies: list[Anomaly] = []
        cleaned: dict = dict(self.last_good)

        for metric in METRICS:
            if metric not in raw:
                continue  # partial update — leave this metric untouched

            value = raw[metric]

            if not isinstance(value, (int, float)) or isinstance(value, bool):
                anomalies.append(Anomaly(
                    metric, "invalid_type", value,
                    f"expected a number, got {type(value).__name__}; "
                    f"keeping last known-good value {self.last_good[metric]}",
                ))
                continue

            value = float(value)
            lo, hi = PLAUSIBLE_RANGES[metric]
            if value < lo or value > hi:
                anomalies.append(Anomaly(
                    metric, "out_of_range", value,
                    f"outside physically plausible range [{lo}, {hi}]; "
                    f"keeping last known-good value {self.last_good[metric]}",
                ))
                continue

            delta = abs(value - self.last_good[metric])
            if delta > MAX_DELTA[metric]:
                anomalies.append(Anomaly(
                    metric, "rate_spike", value,
                    f"changed by {delta:.1f} in one reading "
                    f"(max plausible {MAX_DELTA[metric]}); likely sensor "
                    f"glitch, keeping last known-good value "
                    f"{self.last_good[metric]}",
                ))
                continue

            cleaned[metric] = value
            self.last_good[metric] = value

        return {
            "telemetry": cleaned,
            "anomalies": [a.to_dict() for a in anomalies],
        }

def make_handler(processor: TelemetryProcessor):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, format, *args):
            pass  # keep the terminal quiet; anomalies are printed explicitly below

        def do_POST(self):
            if self.path != "/process":
                self.send_response(404)
                self.end_headers()
                return

            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length)
            try:
                raw = json.loads(body)
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                return

            result = processor.process(raw)
            for anomaly in result["anomalies"]:
                print(f"  anomaly: {anomaly['metric']} ({anomaly['type']}) "
                      f"— {anomaly['note']}")

            payload = json.dumps(result).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8090)
    args = parser.parse_args()

    processor = TelemetryProcessor()
    server = HTTPServer(("localhost", args.port), make_handler(processor))
    print(f"Telemetry Data Processing Layer running on "
          f"http://localhost:{args.port}/process")
    print("Waiting for readings from backend/server.ts...\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()