import { StyleSheet, Text, View } from "react-native";

import { Telemetry } from "../services/socket";

interface MainHUDProps {
  telemetry: Telemetry | null;
}

export default function MainHUD({
  telemetry,
}: MainHUDProps) {
  if (!telemetry) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>EVA HUD</Text>

        <Text style={styles.status}>
          Connecting to EVA system...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EVA HUD</Text>

      <View style={styles.telemetry}>
        <Text style={styles.data}>
          O₂: {telemetry.oxygen}%
        </Text>

        <Text style={styles.data}>
          CO₂: {telemetry.co2}
        </Text>

        <Text style={styles.data}>
          Battery: {telemetry.battery}%
        </Text>

        <Text style={styles.data}>
          Temperature: {telemetry.temperature}°C
        </Text>
      </View>
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

  telemetry: {
    alignItems: "flex-start",
  },

  data: {
    color: "#fff",
    fontSize: 20,
    marginVertical: 8,
  },

  status: {
    color: "#fff",
    fontSize: 18,
  },
});