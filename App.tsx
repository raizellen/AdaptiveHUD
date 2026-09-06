import { useEffect, useState } from "react";

import MainHUD from "./components/MainHUD";
import {
  connectToBackend,
  HUDData,
} from "./services/socket";

export default function App() {

  const [hudData, setHudData] = useState<HUDData | null>(null);

  useEffect(() => {

    const socket = connectToBackend(setHudData);

    return () => {
      socket.close();
    };

  }, []);

  return <MainHUD data={hudData} />;
}