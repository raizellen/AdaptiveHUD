import { StyleSheet, Text, View } from "react-native";

import { DisplayItem } from "../backend/adaptive_engine/informationManager";

interface TelemetryPanelProps {
  items: DisplayItem[];
}

const LABELS: Record<string, string> = {
  oxygen: "O₂",
  co2: "CO₂",
  battery: "Battery",
  temperature: "Temperature",
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
        <Text
          key={item.metric}
          style={[
            styles.data,
            item.highlighted && styles.highlighted,
            item.level === "warning" && styles.warning,
            item.level === "critical" && styles.critical,
          ]}
        >
          {LABELS[item.metric]}: {item.value}
          {UNITS[item.metric]}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  telemetry: {
    alignItems: "flex-start",
  },

  data: {
    color: "#fff",
    fontSize: 20,
    marginVertical: 8,
  },

  highlighted: {
    fontSize: 26,
    fontWeight: "bold",
  },

  warning: {
    color: "#ffd24d",
  },

  critical: {
    color: "#ff5c5c",
  },
});