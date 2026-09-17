import { StyleSheet, Text, View } from "react-native";

import { DisplayItem } from "../backend/adaptive_engine/informationManager";

interface TelemetryPanelProps {
  items: DisplayItem[];
}

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

export default function TelemetryPanel({ items }: TelemetryPanelProps) {
  return (
    <View style={styles.telemetry}>
      {items.map((item) => (
        <View key={item.metric} style={styles.card}>
          <Text style={[styles.label, item.highlighted && { fontWeight: 'bold' }]}>{LABELS[item.metric]}</Text>
          <Text
            style={[
              styles.data,
              item.highlighted && styles.highlighted,
              item.level === "warning" && styles.warning,
              item.level === "critical" && styles.critical,
            ]}
          >
            {item.value}
            {UNITS[item.metric]}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  // Wraps left-to-right instead of stacking top-to-bottom, so metrics
  telemetry: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 12,
  },

  card: {
    alignItems: "center",
    justifyContent: "center",
    width: 90,
    height: 80,
  },

  label: {
    color: "#888",
    fontSize: 16,
    letterSpacing: 1,
    marginBottom: 4,
  },

  data: {
    color: "#fff",
    fontSize: 28,
  },

  highlighted: {
    fontSize: 30,
    fontWeight: "bold",
  },

  warning: {
    color: "#ffd24d",
  },

  critical: {
    color: "#ff5c5c",
  },
});