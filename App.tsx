import { useEffect, useState } from "react";

import MainHUD from "./components/MainHUD";
import { useAdaptiveHUD } from "./services/adaptiveHUDEngine";
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

  const { displayItems, activeAlerts, hudState, handleVoiceCommand } =
    useAdaptiveHUD(telemetry);

  return (
    <MainHUD
      telemetry={telemetry}
      displayItems={displayItems}
      activeAlerts={activeAlerts}
      hudState={hudState}
      onVoiceCommand={handleVoiceCommand}
    />
  );
}