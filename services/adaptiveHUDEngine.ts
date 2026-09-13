import { useCallback, useMemo, useReducer } from "react";

import {
    contextReducer,
    createInitialContext,
    SystemContext,
} from "../backend/adaptive_engine/contextManager";
import {
    determineHUDState,
    HUDState,
} from "../backend/adaptive_engine/displayStateManager";
import {
    DisplayItem,
    selectDisplayInformation,
} from "../backend/adaptive_engine/informationManager";
import {
    evaluateTelemetryPriority,
    getActiveAlerts,
    TelemetryPriority,
} from "../backend/adaptive_engine/priorityManager";
import { VoiceCommand } from "../backend/voice/commandParser";
import { Telemetry } from "./socket";

export interface AdaptiveHUDResult {
  context: SystemContext;
  priorities: TelemetryPriority[];
  activeAlerts: TelemetryPriority[];
  displayItems: DisplayItem[];
  hudState: HUDState;
  handleVoiceCommand: (command: VoiceCommand) => void;
}

export function useAdaptiveHUD(
  telemetry: Telemetry | null
): AdaptiveHUDResult {
  const [context, dispatch] = useReducer(
    contextReducer,
    undefined,
    createInitialContext
  );

  const priorities = useMemo(
    () => (telemetry ? evaluateTelemetryPriority(telemetry) : []),
    [telemetry]
  );

  const activeAlerts = useMemo(
    () =>
      getActiveAlerts(
        priorities,
        context.acknowledgedAlerts,
        context.alertsMuted
      ),
    [priorities, context.acknowledgedAlerts, context.alertsMuted]
  );

  const displayItems = useMemo(
    () => selectDisplayInformation(priorities, context),
    [priorities, context]
  );

  const hudState = useMemo(
    () => determineHUDState(activeAlerts),
    [activeAlerts]
  );

  const handleVoiceCommand = useCallback(
    (command: VoiceCommand) => {
      const activeAlertMetrics = priorities
        .filter((p) => p.level !== "normal")
        .map((p) => p.metric);

      dispatch({ command, activeAlertMetrics });
    },
    [priorities]
  );

  return {
    context,
    priorities,
    activeAlerts,
    displayItems,
    hudState,
    handleVoiceCommand,
  };
}