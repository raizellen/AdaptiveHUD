import { StyleSheet, Text, View } from "react-native";

import { HUDState } from "../backend/adaptive_engine/displayStateManager";
import { DisplayItem } from "../backend/adaptive_engine/informationManager";
import { TelemetryPriority } from "../backend/adaptive_engine/priorityManager";
import { VoiceCommand } from "../backend/voice/commandParser";
import { Telemetry } from "../services/socket";
import AlertDisplay from "./AlertDisplay";
import TelemetryPanel from "./TelemetryPanel";
import VoiceControlPanel from "./VoiceControlPanel";

interface MainHUDProps {
  telemetry: Telemetry | null;
  displayItems: DisplayItem[];
  activeAlerts: TelemetryPriority[];
  hudState: HUDState;
  onVoiceCommand?: (command: VoiceCommand) => void;
}

// Subtle background tint so the overall HUD state is visible even
// at a glance, on top of the explicit alert banners.
const HUD_STATE_BACKGROUND: Record<HUDState, string> = {
  normal: "#000000",
  warning: "#1a1400",
  emergency: "#1a0000",
};

export default function MainHUD({
  telemetry,
  displayItems,
  activeAlerts,
  hudState,
  onVoiceCommand,
}: MainHUDProps) {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: HUD_STATE_BACKGROUND[hudState] },
      ]}
    >
      <Text style={styles.title}>EVA HUD</Text>

      {!telemetry ? (
        <Text style={styles.status}>
          Connecting to EVA system...
        </Text>
      ) : (
        <>
          <AlertDisplay alerts={activeAlerts} />
          <TelemetryPanel items={displayItems} />
        </>
      )}

      <VoiceControlPanel onCommand={onVoiceCommand} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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