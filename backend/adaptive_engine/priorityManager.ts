import { Telemetry } from "../../services/socket";
import { TelemetryMetric } from "../voice/commandParser";

export type PriorityLevel = "normal" | "warning" | "critical";

export interface TelemetryPriority {
  metric: TelemetryMetric;
  value: number;
  level: PriorityLevel;
  rank: number;
}

interface ThresholdRule {
  warning: (value: number) => boolean;
  critical: (value: number) => boolean;
}

// NOTE: these thresholds are the MVP version of the Adaptive HUD
// Engine's judgment. Once the Python Data Processing Layer exists,
// it can take over anomaly detection (rate-of-change, sensor
// cross-checks, etc.) and hand this manager a verdict instead of
// raw values — the rest of the engine doesn't need to change.
const THRESHOLDS: Record<TelemetryMetric, ThresholdRule> = {
  oxygen: {
    warning: (v) => v < 40,
    critical: (v) => v < 20,
  },
  co2: {
    warning: (v) => v > 1.2,
    critical: (v) => v > 2,
  },
  battery: {
    warning: (v) => v < 30,
    critical: (v) => v < 15,
  },
  temperature: {
    warning: (v) => v > 35 || v < 0,
    critical: (v) => v > 45 || v < -10,
  },
};

const LEVEL_WEIGHT: Record<PriorityLevel, number> = {
  critical: 2,
  warning: 1,
  normal: 0,
};

function levelFor(metric: TelemetryMetric, value: number): PriorityLevel {
  const rule = THRESHOLDS[metric];
  if (rule.critical(value)) return "critical";
  if (rule.warning(value)) return "warning";
  return "normal";
}

export function evaluateTelemetryPriority(
  telemetry: Telemetry
): TelemetryPriority[] {
  const metrics: TelemetryMetric[] = [
    "oxygen",
    "co2",
    "battery",
    "temperature",
  ];

  const evaluated = metrics.map((metric) => ({
    metric,
    value: telemetry[metric],
    level: levelFor(metric, telemetry[metric]),
  }));

  const sorted = [...evaluated].sort(
    (a, b) => LEVEL_WEIGHT[b.level] - LEVEL_WEIGHT[a.level]
  );

  return sorted.map((item, index) => ({ ...item, rank: index + 1 }));
}

// Alerts that should actually be surfaced right now: not muted,
// and not already acknowledged by the crew.
export function getActiveAlerts(
  priorities: TelemetryPriority[],
  acknowledgedAlerts: Set<TelemetryMetric>,
  alertsMuted: boolean
): TelemetryPriority[] {
  if (alertsMuted) return [];

  return priorities.filter(
    (p) => p.level !== "normal" && !acknowledgedAlerts.has(p.metric)
  );
}