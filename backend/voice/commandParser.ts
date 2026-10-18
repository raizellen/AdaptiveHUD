export type VoiceCommandType =
  | "STATUS_REPORT"
  | "ACKNOWLEDGE_ALERT"
  | "FOCUS_METRIC"
  | "HIDE_METRIC"
  | "HIDE_ALL"
  | "SHOW_ALL"
  | "MUTE_ALERTS"
  | "UNMUTE_ALERTS"
  | "TIMER_START"
  | "TIMER_SET"
  | "TIMER_PAUSE"
  | "TIMER_RESET"
  | "TIMER_RESTART"
  | "TIMER_CLEAR"
  | "UNKNOWN";

export type TelemetryMetric =
  | "bpm"
  | "spo2"
  | "battery"
  | "temperature";

export interface VoiceCommand {
  type: VoiceCommandType;
  metric?: TelemetryMetric;
  // Only set for TIMER_SET.
  durationSeconds?: number;
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
    .replace(/-/g, " ") // "twenty-five" -> "twenty five"
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

const NUMBER_WORDS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,
  thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90,
};

const UNIT_SECONDS: Record<string, number> = {
  hour: 3600, hours: 3600, hr: 3600, hrs: 3600,
  minute: 60, minutes: 60, min: 60, mins: 60,
  second: 1, seconds: 1, sec: 1, secs: 1,
};

// Longest timer we'll accept.
const MAX_TIMER_SECONDS = 24 * 60 * 60;

// Turns a spoken or typed duration into seconds, or null if it can't
// be understood. Handles digits ("5 minutes", "1 hour 30 minutes") and
// number words ("five minutes", "twenty five minutes", "an hour",
// "half an hour"). Speech engines differ on which they produce, so
// both are accepted.
export function parseDurationSeconds(text: string): number | null {
  const tokens = normalize(text).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  if (tokens.join(" ") === "half an hour") return 30 * 60;

  let total = 0;
  let current: number | null = null;
  let article = false; // saw "a" / "an", as in "an hour"
  let sawUnit = false;

  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      current = parseInt(token, 10);
    } else if (token in NUMBER_WORDS) {
      current = (current ?? 0) + NUMBER_WORDS[token];
    } else if (token === "hundred") {
      current = (current ?? 1) * 100;
    } else if (token === "a" || token === "an") {
      article = true;
    } else if (token === "and") {
      continue;
    } else if (token in UNIT_SECONDS) {
      const amount: number | null = current ?? (article ? 1 : null);
      if (amount === null) return null;
      total += amount * UNIT_SECONDS[token];
      current = null;
      article = false;
      sawUnit = true;
    } else {
      return null;
    }
  }

  // A trailing number with no unit ("set timer for five") is ambiguous.
  if (current !== null || !sawUnit) return null;
  if (total <= 0 || total > MAX_TIMER_SECONDS) return null;

  return total;
}

// "set timer for 5 minutes" / "set the timer to ten minutes" /
// "set a 5 minute timer". Returns seconds, or null if it isn't a
// set-timer request or the duration isn't understood.
function parseSetTimerSeconds(text: string): number | null {
  const forPhrase = text.match(
    /\bset\s+(?:a\s+|the\s+)?timer(?:\s+(?:for|to))?\s+(.+)$/
  );
  if (forPhrase) return parseDurationSeconds(forPhrase[1]);

  // The duration comes before "timer" here, and may start with "a"/"an"
  // ("an hour"), so it's captured whole.
  const adjective = text.match(/\bset\s+(.+?)\s+timer\b/);
  if (adjective) return parseDurationSeconds(adjective[1]);

  return null;
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
  // "start" also covers resume. "restart" can't be caught by the start
  // rule because \b doesn't match inside a word.
  {
    type: "TIMER_START",
    patterns: [/\b(start|begin|resume)\s+(the\s+)?timer\b/],
  },
  {
    type: "TIMER_PAUSE",
    patterns: [/\b(stop|pause)\s+(the\s+)?timer\b/],
  },
  {
    // Back to zero and stopped; a countdown keeps its duration.
    type: "TIMER_RESET",
    patterns: [/\breset\s+(the\s+)?timer\b/],
  },
  {
    // Reset and start again straight away.
    type: "TIMER_RESTART",
    patterns: [/\brestart\s+(the\s+)?timer\b/],
  },
  {
    // Drops any countdown and goes back to a plain stopwatch.
    type: "TIMER_CLEAR",
    patterns: [/\bclear\s+(the\s+)?timer\b/],
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

  const timerSeconds = parseSetTimerSeconds(text);
  if (timerSeconds !== null) {
    return { type: "TIMER_SET", durationSeconds: timerSeconds, rawText };
  }

  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(text))) {
      return { type: rule.type, metric: rule.metric, rawText };
    }
  }

  return { type: "UNKNOWN", rawText };
}