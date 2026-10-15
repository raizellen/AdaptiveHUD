// Talks to the "Python Data Processing Layer" referenced in
// backend/adaptive_engine/priorityManager.ts's threshold comment:
// telemetryProcessor.py validates raw readings, catches anomalies
// (out-of-range values, implausible jumps) and hands back a cleaned verdict.
// The rest of the engine (priorityManager.ts etc.) keeps consuming plain
// telemetry values, unaware anything happened.
//
// Run the processor with:
//   py backend/data_processing/telemetryProcessor.py --port 8090
//
// If it isn't running, processTelemetry() falls back to passing raw
// values through unprocessed (with a one-time console warning) so
// the rest of the app keeps working without anomaly protection.

export type TelemetryMetric = "bpm" | "spo2" | "battery" | "temperature";
export type TelemetryReading = Record<TelemetryMetric, number>;

export interface TelemetryAnomaly {
  metric: TelemetryMetric;
  type: "invalid_type" | "out_of_range" | "rate_spike" | "sensor_mismatch";
  rawValue: unknown;
  note: string;
}

export interface ProcessedTelemetry {
  telemetry: TelemetryReading;
  anomalies: TelemetryAnomaly[];
}

const PROCESSOR_URL =
  process.env.TELEMETRY_PROCESSOR_URL ?? "http://localhost:8090/process";

let warnedUnavailable = false;

export async function processTelemetry(
  raw: Partial<TelemetryReading>
): Promise<ProcessedTelemetry> {
  try {
    const response = await fetch(PROCESSOR_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(raw),
      signal: AbortSignal.timeout(1000),
    });

    if (!response.ok) {
      throw new Error(`processor responded with ${response.status}`);
    }

    warnedUnavailable = false; // it's back — allow the warning again if it drops later
    return (await response.json()) as ProcessedTelemetry;
  } catch (err) {
    if (!warnedUnavailable) {
      console.warn(
        `Telemetry Data Processing Layer unavailable (${
          (err as Error).message
        }). Using raw telemetry unprocessed — run ` +
          `"python backend/data_processing/telemetryProcessor.py" for ` +
          `anomaly detection.`
      );
      warnedUnavailable = true;
    }
    return { telemetry: raw as TelemetryReading, anomalies: [] };
  }
}