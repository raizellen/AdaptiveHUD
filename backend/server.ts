import fs from "fs";
import path from "path";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

console.log("EVA HUD backend running on port 8080");

wss.on("connection", (socket) => {
  console.log("HUD connected");

  const sendTelemetry = () => {
    const filePath = path.join(
      __dirname,
      "telemetry",
      "telemetry.json"
    );

    const rawData = fs.readFileSync(filePath, "utf-8");
    const telemetry = JSON.parse(rawData);

    socket.send(JSON.stringify(telemetry));
  };

  sendTelemetry();

  const interval = setInterval(sendTelemetry, 1000);

  socket.on("close", () => {
    clearInterval(interval);
    console.log("HUD disconnected");
  });
});