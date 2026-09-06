export interface Telemetry {
  oxygen: number;
  co2: number;
  battery: number;
  temperature: number;
}

export interface HUDData {
  telemetry: Telemetry;
  alerts: string[];
}

const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP;

export function connectToBackend(
  onData: (data: HUDData) => void
) {
  const socket = new WebSocket(
    `ws://${BACKEND_IP}:8080`
  );

  socket.onopen = () => {
    console.log("Connected to Node.js backend");
  };

  socket.onmessage = (event) => {
    const data: HUDData = JSON.parse(event.data);
    onData(data);
  };

  socket.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("Disconnected from Node.js backend");
  };

  return socket;
}