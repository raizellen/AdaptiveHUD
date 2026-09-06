import { useEffect, useState } from "react";

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

  return <MainHUD telemetry={telemetry} />;
}