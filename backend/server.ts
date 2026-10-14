import fs from "fs";
import http from "http";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";

import {
  processTelemetry,
  TelemetryAnomaly,
} from "./data_processing/telemetryManager";
import { parseVoiceCommand, VoiceCommand } from "./voice/commandParser";

const PORT = 8080;
const TELEMETRY_FILE = path.join(__dirname, "telemetry", "telemetry.json");
const SIMULATOR_FILE = path.join(__dirname, "telemetry", "simulator.html");
const VOICE_SIMULATOR_FILE = path.join(
  __dirname,
  "voice",
  "voice-simulator.html"
);

export interface Telemetry {
  oxygen: number;
  co2: number;
  battery: number;
  temperature: number;
}

// Every WS message is tagged so the phone knows how to route it.
type OutgoingMessage =
  | { type: "telemetry"; payload: Telemetry }
  | { type: "voice_command"; payload: VoiceCommand }
  | { type: "telemetry_anomaly"; payload: TelemetryAnomaly[] };

function loadTelemetry(): Telemetry {
  const raw = fs.readFileSync(TELEMETRY_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveTelemetry(data: Telemetry) {
  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2));
}

let currentTelemetry: Telemetry = loadTelemetry();

function broadcast(message: OutgoingMessage) {
  const payload = JSON.stringify(message);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => resolve(body));
  });
}

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/simulator") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(SIMULATOR_FILE, "utf-8"));
    return;
  }

  if (req.method === "POST" && req.url === "/telemetry") {
    const body = await readBody(req);
    try {
      const update = JSON.parse(body);
      const merged = { ...currentTelemetry, ...update };

      // The Data Processing Layer validates the merged reading,
      // clamps/rejects anything implausible, and flags anomalies —
      // see backend/data_processing/telemetryManager.ts.
      const { telemetry: processed, anomalies } = await processTelemetry(
        merged
      );

      anomalies.forEach((a) =>
        console.warn(`Telemetry anomaly: ${a.metric} (${a.type}) — ${a.note}`)
      );

      currentTelemetry = processed;
      saveTelemetry(currentTelemetry);
      broadcast({ type: "telemetry", payload: currentTelemetry });
      // Always broadcast, even when empty — an empty array is how the
      // HUD knows to clear a previously-shown anomaly banner.
      broadcast({ type: "telemetry_anomaly", payload: anomalies });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ ok: true, telemetry: currentTelemetry, anomalies })
      );
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Invalid JSON body" }));
    }
    return;
  }

  // Laptop voice simulator posts recognized speech text here
  if (req.method === "POST" && req.url === "/voice-transcript") {
    const body = await readBody(req);
    try {
      const { text } = JSON.parse(body);
      const command = parseVoiceCommand(text ?? "");
      broadcast({ type: "voice_command", payload: command });

      console.log(`Voice transcript: "${text}" -> ${command.type}`);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, command }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "Invalid JSON body" }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  console.log("HUD connected");

  socket.send(
    JSON.stringify({ type: "telemetry", payload: currentTelemetry })
  );

  socket.on("close", () => {
    console.log("HUD disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`EVA HUD backend running on port ${PORT}`);
  console.log(`Telemetry simulator: http://localhost:${PORT}/simulator`);
});