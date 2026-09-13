import { StyleSheet, Text, View } from "react-native";

import { VoiceCommand } from "../backend/voice/commandParser";
import { Telemetry } from "../services/socket";
import AlertDisplay from "./AlertDisplay";
import TelemetryPanel from "./TelemetryPanel";
import VoiceControlPanel from "./VoiceControlPanel";

interface MainHUDProps {
  telemetry: Telemetry | null;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

export default function MainHUD({
  telemetry,
  onVoiceCommand,
}: MainHUDProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVA HUD</Text>

      {!telemetry ? (
        <Text style={styles.status}>
          Connecting to EVA system...
        </Text>
      ) : (
        <>
          <AlertDisplay telemetry={telemetry} />
          <TelemetryPanel telemetry={telemetry} />
        </>
      )}

      <VoiceControlPanel onCommand={onVoiceCommand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 32,
    marginBottom: 40,
  },

  status: {
    color: "#fff",
    fontSize: 18,
  },
});