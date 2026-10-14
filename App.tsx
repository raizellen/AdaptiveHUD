import { useEffect, useRef, useState } from "react";

import { TelemetryAnomaly } from "./backend/data_processing/telemetryManager";
import { VoiceCommand } from "./backend/voice/commandParser";
import MainHUD from "./components/MainHUD";
import { useAdaptiveHUD } from "./services/adaptiveHUDEngine";
import {
  connectToBackend,
  Telemetry,
} from "./services/socket";

export default function App() {
  const [telemetry, setTelemetry] =
    useState<Telemetry | null>(null);
  const [anomalies, setAnomalies] = useState<TelemetryAnomaly[]>([]);

  const {
    displayItems,
    activeAlerts,
    hudState,
    handleVoiceCommand,
  } = useAdaptiveHUD(telemetry);

  // handleVoiceCommand is recreated whenever telemetry changes, but
  // the socket effect below only connects once — keep a ref so the
  // socket always calls the *latest* version without reconnecting.
  const handleVoiceCommandRef = useRef(handleVoiceCommand);
  handleVoiceCommandRef.current = handleVoiceCommand;

  useEffect(() => {
    const socket = connectToBackend({
      onTelemetry: setTelemetry,
      onVoiceCommand: (command: VoiceCommand) =>
        handleVoiceCommandRef.current(command),
      onAnomalies: setAnomalies,
    });

    return () => {
      socket.close();
    };
  }, []);

  return (
    <MainHUD
      telemetry={telemetry}
      displayItems={displayItems}
      activeAlerts={activeAlerts}
      anomalies={anomalies}
      hudState={hudState}
      onVoiceCommand={handleVoiceCommand}
    />
  );
}