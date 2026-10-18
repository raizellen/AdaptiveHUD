import { TelemetryMetric, VoiceCommand } from "../voice/commandParser";

export type MissionState = "idle" | "eva_active" | "eva_complete";

export interface SystemContext {
  missionState: MissionState;
  alertsMuted: boolean;
  acknowledgedAlerts: Set<TelemetryMetric>;
  focusedMetric: TelemetryMetric | null;
  // When true, no metrics are displayed except the focused one (set by
  // "show <metric>"). "show all" turns this back off.
  allHidden: boolean;
}

export interface VoiceContextAction {
  command: VoiceCommand;
  // Metrics currently in warning/critical state, supplied by the
  // caller so ACKNOWLEDGE_ALERT knows what it's acknowledging.
  activeAlertMetrics?: TelemetryMetric[];
}

// Dispatched by the engine when metrics return to normal, so that an
// earlier acknowledgement doesn't silence the metric's next alert.
export interface MetricsRecoveredAction {
  type: "METRICS_RECOVERED";
  metrics: TelemetryMetric[];
}

export type ContextAction = VoiceContextAction | MetricsRecoveredAction;

export function createInitialContext(): SystemContext {
  return {
    missionState: "eva_active",
    alertsMuted: false,
    acknowledgedAlerts: new Set(),
    focusedMetric: null,
    allHidden: false,
  };
}

export function contextReducer(
  state: SystemContext,
  action: ContextAction
): SystemContext {
  if ("type" in action) {
    const acknowledgedAlerts = new Set(state.acknowledgedAlerts);
    action.metrics.forEach((metric) =>
      acknowledgedAlerts.delete(metric)
    );
    return { ...state, acknowledgedAlerts };
  }

  const { command, activeAlertMetrics = [] } = action;

  switch (command.type) {
    case "MUTE_ALERTS":
      return { ...state, alertsMuted: true };

    case "UNMUTE_ALERTS":
      return { ...state, alertsMuted: false };

    case "FOCUS_METRIC":
      return { ...state, focusedMetric: command.metric ?? null };

    case "HIDE_METRIC":
      // Only hides the metric that is currently displayed; hiding some
      // other metric leaves the current focus alone.
      if (command.metric && command.metric === state.focusedMetric) {
        return { ...state, focusedMetric: null };
      }
      return state;

    case "HIDE_ALL":
      return { ...state, allHidden: true, focusedMetric: null };

    case "SHOW_ALL":
      return { ...state, allHidden: false };

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