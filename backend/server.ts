import fs from "fs";
import http from "http";
import path from "path";
import { WebSocket, WebSocketServer } from "ws";

const PORT = 8080;
const TELEMETRY_FILE = path.join(__dirname, "telemetry", "telemetry.json");
const SIMULATOR_FILE = path.join(__dirname, "telemetry", "simulator.html");

export interface Telemetry {
  oxygen: number;
  co2: number;
  battery: number;
  temperature: number;
}

function loadTelemetry(): Telemetry {
  const raw = fs.readFileSync(TELEMETRY_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveTelemetry(data: Telemetry) {
  fs.writeFileSync(TELEMETRY_FILE, JSON.stringify(data, null, 2));
}

let currentTelemetry: Telemetry = loadTelemetry();

function broadcast(data: Telemetry) {
  const payload = JSON.stringify(data);
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

const httpServer = http.createServer((req, res) => {
  // Serve the laptop telemetry simulator page
  if (req.method === "GET" && req.url === "/simulator") {
    const html = fs.readFileSync(SIMULATOR_FILE, "utf-8");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
    return;
  }

  // Simulator posts new sensor values here
  if (req.method === "POST" && req.url === "/telemetry") {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        const update = JSON.parse(body);
        currentTelemetry = { ...currentTelemetry, ...update };
        saveTelemetry(currentTelemetry);
        broadcast(currentTelemetry);

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true, telemetry: currentTelemetry }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Invalid JSON body" }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (socket) => {
  console.log("HUD connected");

  // Send the current snapshot immediately on connect
  socket.send(JSON.stringify(currentTelemetry));

  socket.on("close", () => {
    console.log("HUD disconnected");
  });
});

httpServer.listen(PORT, () => {
  console.log(`EVA HUD backend running on port ${PORT}`);
  console.log(
    `Telemetry simulator available at http://localhost:${PORT}/simulator`
  );
});