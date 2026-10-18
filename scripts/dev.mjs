// Starts everything the HUD needs with one command: `npm run dev`
//
//   server     backend/server.ts                       (port 8080)
//   processor  backend/data_processing/telemetryProcessor.py  (port 8090)
//   voice      backend/voice/voice_listener.py         (posts to the server)
//   expo       npx expo start                          (port 8081, the app)
//
// Ctrl+C stops all of them. No dependencies: only Node's own modules.
//
// Options (pass after `--`, e.g. `npm run dev -- --no-voice`):
//   --no-voice   don't start the voice listener (no mic / model yet)
//   --no-expo    don't start Expo (run `npx expo start` in another terminal)
//   anything else is passed to the voice listener,
//   e.g. `npm run dev -- --device 1` to pick a microphone.
//
// Python: uses $PYTHON if set, then .venv/ if there is one, then `py` on
// Windows or `python3` elsewhere.

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const useColor = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

const argv = process.argv.slice(2);

if (argv.includes("--help") || argv.includes("-h")) {
  console.log(
    [
      "Usage: npm run dev [-- options]",
      "",
      "  --no-voice   don't start the voice listener",
      "  --no-expo    don't start Expo",
      "  (other options are passed to the voice listener, e.g. --device 1)",
    ].join("\n")
  );
  process.exit(0);
}

const skipVoice = argv.includes("--no-voice");
const skipExpo = argv.includes("--no-expo");
const voiceArgs = argv.filter((a) => a !== "--no-voice" && a !== "--no-expo");

const VOSK_MODEL = path.join("models", "vosk-model-small-en-us-0.15");

function findPython() {
  if (process.env.PYTHON) return process.env.PYTHON;

  const venvPython = isWindows
    ? path.join(root, ".venv", "Scripts", "python.exe")
    : path.join(root, ".venv", "bin", "python");
  if (existsSync(venvPython)) return venvPython;

  return isWindows ? "py" : "python3";
}

const tsxCli = path.join(root, "node_modules", "tsx", "dist", "cli.mjs");
const expoCli = path.join(root, "node_modules", "expo", "bin", "cli");

if (!existsSync(tsxCli) || !(skipExpo || existsSync(expoCli))) {
  console.error("Dependencies are missing. Run `npm install` first.");
  process.exit(1);
}

const python = findPython();

// `critical` processes take everything down with them if they exit.
// `inherit` hands Expo the real terminal so its QR code and key
// shortcuts keep working; the rest are shown with a [name] prefix.
const services = [
  {
    name: "server",
    color: 36,
    critical: true,
    command: process.execPath,
    args: [tsxCli, "backend/server.ts"],
  },
  {
    name: "processor",
    color: 33,
    command: python,
    args: ["backend/data_processing/telemetryProcessor.py", "--port", "8090"],
  },
];

if (skipVoice) {
  // nothing to add
} else if (!existsSync(path.join(root, VOSK_MODEL))) {
  console.log(
    `[voice] skipped: no speech model at ${VOSK_MODEL.replaceAll("\\", "/")}` +
      " (see the README), or use --no-voice to hide this message"
  );
} else {
  services.push({
    name: "voice",
    color: 35,
    // The listener prints a live "...partial" line while you speak;
    // that's noise once it's mixed with other output.
    dropLine: (line) => line.startsWith("..."),
    command: python,
    args: [
      "backend/voice/voice_listener.py",
      "--model",
      VOSK_MODEL,
      ...voiceArgs,
    ],
  });
}

if (!skipExpo) {
  services.push({
    name: "expo",
    color: 32,
    critical: true,
    inherit: true,
    command: process.execPath,
    args: [expoCli, "start"],
  });
}

const running = new Map();
let shuttingDown = false;

function paint(code, text) {
  return useColor ? `\x1b[${code}m${text}\x1b[0m` : text;
}

function label(service) {
  return paint(service.color, `[${service.name}]`.padEnd(12));
}

function log(service, line) {
  console.log(`${label(service)}${line}`);
}

function pipeLines(stream, service) {
  let pending = "";

  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r\n|\n|\r/);
    pending = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      if (service.dropLine?.(line)) continue;
      log(service, line);
    }
  });
  stream.on("end", () => {
    if (pending.trim() && !service.dropLine?.(pending)) log(service, pending);
  });
}

function stopProcess(child) {
  if (child.exitCode !== null || child.signalCode !== null || !child.pid) {
    return;
  }

  if (isWindows) {
    // Ends the whole process tree, not just the launcher (e.g. py.exe).
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
  } else {
    child.kill("SIGTERM");
  }
}

function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of running.values()) stopProcess(child);

  // Force-quit if something refuses to stop.
  const timer = setTimeout(() => process.exit(code), 3000);
  timer.unref();

  setInterval(() => {
    if (running.size === 0) process.exit(code);
  }, 100);
}

function start(service) {
  const child = spawn(service.command, service.args, {
    cwd: root,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: "1",
      // Piped output isn't a terminal, so ask for colour explicitly, but
      // only when this terminal actually shows it.
      ...(useColor ? { FORCE_COLOR: "1" } : {}),
    },
    stdio: service.inherit ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  running.set(service.name, child);

  if (!service.inherit) {
    pipeLines(child.stdout, service);
    pipeLines(child.stderr, service);
  }

  child.on("error", (error) => {
    running.delete(service.name);
    log(service, `could not start: ${error.message}`);
    if (service.command === python && error.code === "ENOENT") {
      log(service, "Python wasn't found. Set the PYTHON environment variable.");
    }
    if (service.critical) shutdown(1);
  });

  child.on("exit", (code, signal) => {
    running.delete(service.name);
    if (shuttingDown) return;

    const how = signal ? `signal ${signal}` : `code ${code}`;
    log(service, `exited (${how})`);

    if (service.critical) {
      log(service, "stopping everything else");
      shutdown(code ?? 1);
    }
  });
}

console.log(
  paint(
    1,
    `Starting: ${services.map((s) => s.name).join(", ")}  (Ctrl+C stops all)`
  )
);
console.log("Telemetry simulator: http://localhost:8080/simulator");
console.log(
  "The app finds the backend through Expo, so there's no IP to set.\n"
);

services.forEach(start);

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
