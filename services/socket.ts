export interface Telemetry {
  oxygen: number;
  co2: number;
  battery: number;
  temperature: number;
}

const BACKEND_IP = process.env.EXPO_PUBLIC_BACKEND_IP;

export function connectToBackend(
  onData: (data: Telemetry) => void
) {
  const socket = new WebSocket(
    `ws://${BACKEND_IP}:8080`
  );

  socket.onopen = () => {
    console.log("Connected to EVA backend");
  };

  socket.onmessage = (event) => {
    const data: Telemetry = JSON.parse(event.data);

    console.log("Telemetry received:", data);

    onData(data);
  };

  socket.onerror = (error) => {
    console.log("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("Disconnected from backend");
  };

  return socket;
}