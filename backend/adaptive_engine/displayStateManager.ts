import { TelemetryPriority } from "./priorityManager";

export type HUDState = "normal" | "warning" | "emergency";

export function determineHUDState(
  activeAlerts: TelemetryPriority[]
): HUDState {
  if (activeAlerts.some((a) => a.level === "critical")) return "emergency";
  if (activeAlerts.some((a) => a.level === "warning")) return "warning";
  return "normal";
}