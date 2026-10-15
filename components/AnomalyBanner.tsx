import { StyleSheet, Text, View } from "react-native";

import { TelemetryAnomaly } from "../backend/data_processing/telemetryManager";

interface AnomalyBannerProps {
  anomalies: TelemetryAnomaly[];
}

const LABELS: Record<string, string> = {
  bpm: "HR",
  spo2: "SpO₂",
  battery: "Battery",
  temperature: "Temp",
};

// Short, crew-facing phrasing — the anomaly's own `note` field is
// written for the server console (verbose, includes raw numbers) so
// we don't reuse it verbatim here.
const SHORT_REASON: Record<TelemetryAnomaly["type"], string> = {
  invalid_type: "invalid reading, ignoring",
  out_of_range: "reading out of range, ignoring",
  rate_spike: "reading jumped implausibly, ignoring",
  sensor_mismatch: "unconfirmed by cross-check",
};

// A slim, low-key strip across the top flagging telemetry the Data
// Processing Layer doesn't fully trust yet. Deliberately distinct
// from AlertDisplay: this means "the sensor might be lying", not
// "you're in danger" — so it stays quiet/amber, never red, and never
// blocks or replaces the real alerts below it.
export default function AnomalyBanner({ anomalies }: AnomalyBannerProps) {
  if (anomalies.length === 0) return null;

  const shown = anomalies.slice(0, 2);
  const text = shown
    .map((a) => `${LABELS[a.metric] ?? a.metric} ${SHORT_REASON[a.type]}`)
    .join("  •  ");
  const extra =
    anomalies.length > shown.length
      ? `  •  +${anomalies.length - shown.length} more`
      : "";

  return (
    <View style={styles.container}>
      <Text style={styles.text} numberOfLines={1}>
        SENSOR CHECK — {text}
        {extra}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: "center",
    paddingVertical: 4,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderRadius: 4,
    backgroundColor: "#332600",
  },

  text: {
    color: "#ffd24d",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});