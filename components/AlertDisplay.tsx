import { StyleSheet, Text, View } from "react-native";

import { Telemetry } from "../services/socket";

interface AlertDisplayProps {
  telemetry: Telemetry;
}

interface Alert {
  message: string;
  level: "warning" | "critical";
}

// NOTE: these are placeholder thresholds for the MVP.
// This logic gets replaced/absorbed by the Python Data
// Processing Layer + Adaptive HUD Engine later on.
function getAlerts(telemetry: Telemetry): Alert[] {
  const alerts: Alert[] = [];

  if (telemetry.oxygen < 20) {
    alerts.push({ message: "LOW OXYGEN", level: "critical" });
  } else if (telemetry.oxygen < 40) {
    alerts.push({ message: "Oxygen low", level: "warning" });
  }

  if (telemetry.co2 > 2) {
    alerts.push({ message: "HIGH CO2", level: "critical" });
  }

  if (telemetry.battery < 15) {
    alerts.push({ message: "LOW BATTERY", level: "critical" });
  } else if (telemetry.battery < 30) {
    alerts.push({ message: "Battery low", level: "warning" });
  }

  if (telemetry.temperature > 45 || telemetry.temperature < -10) {
    alerts.push({
      message: "TEMPERATURE OUT OF RANGE",
      level: "critical",
    });
  }

  return alerts;
}

export default function AlertDisplay({
  telemetry,
}: AlertDisplayProps) {
  const alerts = getAlerts(telemetry);

  if (alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert, i) => (
        <View
          key={i}
          style={[
            styles.alert,
            alert.level === "critical"
              ? styles.critical
              : styles.warning,
          ]}
        >
          <Text style={styles.text}>{alert.message}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    width: "100%",
    alignItems: "center",
  },

  alert: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    marginVertical: 4,
    width: "80%",
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