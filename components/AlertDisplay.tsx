import { StyleSheet, Text, View } from "react-native";

import { TelemetryPriority } from "../backend/adaptive_engine/priorityManager";

interface AlertDisplayProps {
  alerts: TelemetryPriority[];
}

const METRIC_LABELS: Record<string, string> = {
  oxygen: "OXYGEN",
  co2: "CO2",
  battery: "BATTERY",
  temperature: "TEMPERATURE",
};

export default function AlertDisplay({ alerts }: AlertDisplayProps) {
  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert) => (
        <View
          key={alert.metric}
          style={[
            styles.alert,
            alert.level === "critical" ? styles.critical : styles.warning,
          ]}
        >
          <Text style={styles.text}>
            {alert.level === "critical" ? "CRITICAL: " : "WARNING: "}
            {METRIC_LABELS[alert.metric]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Wraps left-to-right instead of stacking, so alerts sit as a slim
  // horizontal banner across the top rather than eating vertical
  // space, which is scarcer on a landscape screen.
  container: {
    paddingTop: 4,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },

  alert: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginHorizontal: 6,
    marginVertical: 4,
    alignItems: "center",
  },

  warning: {
    backgroundColor: "#8a6d1a",
  },

  critical: {
    backgroundColor: "#8a1a1a",
  },

  text: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});