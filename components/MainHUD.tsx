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

const LABELS: Record<string, string> = {
  oxygen: "O₂",
  co2: "CO₂",
  battery: "Battery",
  temperature: "Temp",
};

const UNITS: Record<string, string> = {
  oxygen: "%",
  co2: "%",
  battery: "%",
  temperature: "°C",
};

export default function MainHUD({
  telemetry,
  displayItems,
  activeAlerts,
  hudState,
  onVoiceCommand,
}: MainHUDProps) {

  const highlightedItem = displayItems.find(
    (item) => item.highlighted
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: HUD_STATE_BACKGROUND[hudState] },
        // mirror later
        // { transform: [{ scaleX: -1 }] }
      ]}
    >

      {!telemetry ? (
        <View style={styles.centeredFill}>
          <Text style={styles.status}>
            Connecting to EVA system...
          </Text>
        </View>
      ) : (
        <>
          <AlertDisplay alerts={activeAlerts} />

          <View style={styles.body}>
            <View style={styles.telemetryColumn}>
              <TelemetryPanel items={displayItems} />
            </View>

            <View style={styles.fieldContainer}>
              <View style={styles.focus}>
                {highlightedItem && (
                  <>
                    <Text style={styles.focusLabel}>
                      {LABELS[highlightedItem.metric]}
                    </Text>

                    <Text
                      style={[
                        styles.focusValue,
                        highlightedItem.level === "warning" && styles.warning,
                        highlightedItem.level === "critical" && styles.critical,
                      ]}
                    >
                      {highlightedItem.value}
                      {UNITS[highlightedItem.metric]}
                    </Text>
                  </>
                )}
              </View>
            </View>

            <View style={styles.voiceColumn}>
              <VoiceControlPanel onCommand={onVoiceCommand} />
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },

  centeredFill: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  status: {
    color: "#fff",
    fontSize: 18,
  },

  body: {
    flex: 1,
    flexDirection: "row",
  },

  fieldContainer: {
    flex: 2,
    justifyContent: "center",
    alignItems: "center",
  },

  focus: {
    justifyContent: "center",
    alignItems: "center",
  },

  focusLabel: {
    color: "#888",
    fontSize: 20,
    letterSpacing: 2,
    marginBottom: 8,
  },

  focusValue: {
    color: "#fff",
    fontSize: 64,
    fontWeight: "bold",
  },

  warning: {
    color: "#ffd24d",
  },

  critical: {
    color: "#ff5c5c",
  },

  telemetryColumn: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 32,
  },

  voiceColumn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
});