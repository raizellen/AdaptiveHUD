export type VoiceCommandType =
  | "STATUS_REPORT"
  | "ACKNOWLEDGE_ALERT"
  | "FOCUS_METRIC"
  | "HIDE_METRIC"
  | "HIDE_ALL"
  | "SHOW_ALL"
  | "MUTE_ALERTS"
  | "UNMUTE_ALERTS"
  | "UNKNOWN";

export type TelemetryMetric =
  | "bpm"
  | "spo2"
  | "battery"
  | "temperature";

export interface VoiceCommand {
  type: VoiceCommandType;
  metric?: TelemetryMetric;
  rawText: string;
}

interface Rule {
  type: VoiceCommandType;
  patterns: RegExp[];
  metric?: TelemetryMetric;
}

const METRIC_ALIASES: Record<TelemetryMetric, string[]> = {
  bpm: ["heart rate", "pulse", "b p m"],
  spo2: ["blood oxygen", "oxygen", "spo2", "s p o two"],
  battery: ["battery", "power"],
  temperature: ["temperature", "temp"],
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function buildMetricRules(): Rule[] {
  const rules: Rule[] = [];

  (Object.keys(METRIC_ALIASES) as TelemetryMetric[]).forEach(
    (metric) => {
      METRIC_ALIASES[metric].forEach((alias) => {
        rules.push({
          type: "FOCUS_METRIC",
          metric,
          patterns: [
            new RegExp(
              `(show|check|whats|display)\\s+(the\\s+)?${alias}`
            ),
          ],
        });
        rules.push({
          type: "HIDE_METRIC",
          metric,
          patterns: [
            new RegExp(`hide\\s+(the\\s+)?${alias}`),
          ],
        });
      });
    }
  );

  return rules;
}

// Order matters: more specific rules should come before generic ones.
const RULES: Rule[] = [
  {
    type: "STATUS_REPORT",
    patterns: [/\b(status report|status|report|hows it looking)\b/],
  },
  {
    // Acknowledging only dismisses the current alert. It comes back if
    // the metric returns to normal and then goes abnormal again.
    type: "ACKNOWLEDGE_ALERT",
    patterns: [
      /\b(acknowledge|clear alert|dismiss alert|copy that)\b/,
    ],
  },
  {
    // "hide all alerts" / "show all alerts" are deliberately excluded so
    // they don't get mistaken for metric visibility commands.
    type: "HIDE_ALL",
    patterns: [
      /\bhide\s+(the\s+)?(all|everything|metrics)\b(?!\s+alerts?\b)/,
    ],
  },
  {
    type: "SHOW_ALL",
    patterns: [
      /\b(show|display)\s+(me\s+)?(the\s+)?(all|everything|metrics)\b(?!\s+alerts?\b)/,
    ],
  },
  {
    type: "MUTE_ALERTS",
    patterns: [/\b(mute|silence)\s+(the\s+)?alerts?\b/],
  },
  {
    type: "UNMUTE_ALERTS",
    patterns: [/\b(unmute|resume|show)\s+(the\s+)?alerts?\b/],
  },
  ...buildMetricRules(),
];

export function parseVoiceCommand(rawText: string): VoiceCommand {
  const text = normalize(rawText);

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { type: rule.type, metric: rule.metric, rawText };
    }
  }

  return { type: "UNKNOWN", rawText };
}