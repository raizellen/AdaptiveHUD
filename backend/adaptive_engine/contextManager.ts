import { TelemetryMetric, VoiceCommand } from "../voice/commandParser";

export type MissionState = "idle" | "eva_active" | "eva_complete";

export interface SystemContext {
  missionState: MissionState;
  alertsMuted: boolean;
  acknowledgedAlerts: Set<TelemetryMetric>;
  focusedMetric: TelemetryMetric | null;
}

export interface ContextAction {
  command: VoiceCommand;
  // Metrics currently in warning/critical state, supplied by the
  // caller so ACKNOWLEDGE_ALERT knows what it's acknowledging.
  activeAlertMetrics?: TelemetryMetric[];
}

export function createInitialContext(): SystemContext {
  return {
    missionState: "eva_active",
    alertsMuted: false,
    acknowledgedAlerts: new Set(),
    focusedMetric: null,
  };
}

export function contextReducer(
  state: SystemContext,
  action: ContextAction
): SystemContext {
  const { command, activeAlertMetrics = [] } = action;

  switch (command.type) {
    case "MUTE_ALERTS":
      return { ...state, alertsMuted: true };

    case "UNMUTE_ALERTS":
      return { ...state, alertsMuted: false };

    case "FOCUS_METRIC":
      return { ...state, focusedMetric: command.metric ?? null };

    case "ACKNOWLEDGE_ALERT": {
      const acknowledgedAlerts = new Set(state.acknowledgedAlerts);
      activeAlertMetrics.forEach((metric) =>
        acknowledgedAlerts.add(metric)
      );
      return { ...state, acknowledgedAlerts };
    }

    case "STATUS_REPORT":
    case "UNKNOWN":
    default:
      return state;
  }
}