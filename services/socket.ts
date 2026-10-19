import Constants from "expo-constants";
import { Platform } from "react-native";

import { TelemetryAnomaly } from "../backend/data_processing/telemetryManager";
import { Mission } from "../backend/mission/missionManager";
import { VoiceCommand } from "../backend/voice/commandParser";
import { resolveBackendHost } from "./backendHost";

export interface Telemetry {
  bpm: number;
  spo2: number;
  battery: number;
  temperature: number;
}

type IncomingMessage =
  | { type: "telemetry"; payload: Telemetry }
  | { type: "voice_command"; payload: VoiceCommand; id?: string }
  | { type: "telemetry_anomaly"; payload: TelemetryAnomaly[] }
  | { type: "mission"; payload: Mission };

const BACKEND_PORT = 8080;

// Found automatically from the Expo dev server, so there's no IP to edit
// each time the laptop's address changes. EXPO_PUBLIC_BACKEND_IP is only
// a fallback (see backendHost.ts).
function getBackendUrl(): string {
  const host = resolveBackendHost({
    hostUri: Constants.expoConfig?.hostUri,
    manualIp: process.env.EXPO_PUBLIC_BACKEND_IP,
    webHostname: Platform.OS === "web" ? window.location.hostname : null,
  });

  return `ws://${host}:${BACKEND_PORT}`;
}

interface ConnectHandlers {
  onTelemetry: (data: Telemetry) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
  onAnomalies?: (anomalies: TelemetryAnomaly[]) => void;
  onMission?: (mission: Mission) => void;
}

export function connectToBackend({
  onTelemetry,
  onVoiceCommand,
  onAnomalies,
  onMission,
}: ConnectHandlers) {
  const url = getBackendUrl();
  console.log("Connecting to EVA backend at", url);
  const socket = new WebSocket(url);

  socket.onopen = () => {
    console.log("Connected to EVA backend");
  };

  socket.onmessage = (event) => {
    const message: IncomingMessage = JSON.parse(event.data);

    if (message.type === "telemetry") {
      console.log("Telemetry received:", message.payload);
      onTelemetry(message.payload);
    } else if (message.type === "voice_command") {
      console.log("Remote voice command received:", message.payload);
      onVoiceCommand?.(message.payload);
      // Tell the backend the command has been applied so it can log how
      // long the voice command took (see logVoiceLatency in server.ts).
      if (message.id && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "voice_ack", id: message.id }));
      }
    } else if (message.type === "telemetry_anomaly") {
      if (message.payload.length > 0) {
        console.log("Telemetry anomalies received:", message.payload);
      }
      onAnomalies?.(message.payload);
    } else if (message.type === "mission") {
      onMission?.(message.payload);
    }
  };

  socket.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("Disconnected from backend");
  };

  return socket;
}