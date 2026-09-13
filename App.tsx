import { useEffect, useState } from "react";

import { VoiceCommand } from "./backend/voice/commandParser";
import MainHUD from "./components/MainHUD";
import {
  connectToBackend,
  Telemetry,
} from "./services/socket";

export default function App() {
  const [telemetry, setTelemetry] =
    useState<Telemetry | null>(null);

  useEffect(() => {
    const socket = connectToBackend(setTelemetry);

    return () => {
      socket.close();
    };
  }, []);

  const handleVoiceCommand = (command: VoiceCommand) => {
    // TODO (next step): route this into the Adaptive HUD Engine
    // (Telemetry Priority Manager / HUD Display State Manager)
    // instead of just logging it.
    console.log("Voice command received:", command);
  };

  return (
    <MainHUD
      telemetry={telemetry}
      onVoiceCommand={handleVoiceCommand}
    />
  );
}