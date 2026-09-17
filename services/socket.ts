import { VoiceCommand } from "../backend/voice/commandParser";

export interface Telemetry {
  oxygen: number;
  co2: number;
  battery: number;
  temperature: number;
}

type IncomingMessage =
  | { type: "telemetry"; payload: Telemetry }
  | { type: "voice_command"; payload: VoiceCommand };

const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP;

interface ConnectHandlers {
  onTelemetry: (data: Telemetry) => void;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

export function connectToBackend({
  onTelemetry,
  onVoiceCommand,
}: ConnectHandlers) {
  const socket = new WebSocket(`ws://${BACKEND_IP}:8080`);

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