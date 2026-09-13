import { TelemetryMetric } from "../voice/commandParser";
import { SystemContext } from "./contextManager";
import { PriorityLevel, TelemetryPriority } from "./priorityManager";

export interface DisplayItem {
  metric: TelemetryMetric;
  value: number;
  level: PriorityLevel;
  highlighted: boolean;
}

// Reduces clutter: anything abnormal always gets shown. If the crew
// asked to focus on a metric by voice, that one gets bubbled to the
// top regardless of severity. Otherwise remaining slots fill with
// normal-status metrics up to maxItems.
export function selectDisplayInformation(
  priorities: TelemetryPriority[],
  context: SystemContext,
  maxItems: number = 4
): DisplayItem[] {
  const items: DisplayItem[] = priorities.map((p) => ({
    metric: p.metric,
    value: p.value,
    level: p.level,
    highlighted: p.metric === context.focusedMetric,
  }));

  if (context.focusedMetric) {
    const focused = items.filter((i) => i.highlighted);
    const rest = items.filter((i) => !i.highlighted);
    return [...focused, ...rest].slice(0, maxItems);
  }

  const abnormal = items.filter((i) => i.level !== "normal");
  const normal = items.filter((i) => i.level === "normal");

  return [...abnormal, ...normal].slice(0, maxItems);
}