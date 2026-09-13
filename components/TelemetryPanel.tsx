import { StyleSheet, Text, View } from "react-native";

import { Telemetry } from "../services/socket";

interface TelemetryPanelProps {
  telemetry: Telemetry;
}

export default function TelemetryPanel({
  telemetry,
}: TelemetryPanelProps) {
  return (
    <View style={styles.telemetry}>
      <Text style={styles.data}>O₂: {telemetry.oxygen}%</Text>
      <Text style={styles.data}>CO₂: {telemetry.co2}%</Text>
      <Text style={styles.data}>Battery: {telemetry.battery}%</Text>
      <Text style={styles.data}>
        Temperature: {telemetry.temperature}°C
      </Text>
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
});