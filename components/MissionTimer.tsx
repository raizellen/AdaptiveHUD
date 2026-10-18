import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import {
  formatClock,
  getDisplaySeconds,
  getElapsedMs,
  isExpired,
  isRunning,
  TimerState,
} from "../backend/adaptive_engine/timerManager";

interface MissionTimerProps {
  timer: TimerState;
}

export default function MissionTimer({ timer }: MissionTimerProps) {
  // The timer state only changes on voice commands; this tick just
  // re-renders so the clock face keeps up while it's running.
  const [, setTick] = useState(0);

  const now = Date.now();
  const running = isRunning(timer);
  const expired = isExpired(timer, now);
  const countingDown = timer.durationMs !== null;

  useEffect(() => {
    if (!running || expired) return;

    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, [running, expired]);

  const paused = !running && !expired && getElapsedMs(timer, now) > 0;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {countingDown ? "TIME REMAINING" : "EVA TIME"}
      </Text>

      <Text style={[styles.clock, expired && styles.expired]}>
        {formatClock(getDisplaySeconds(timer, now))}
      </Text>

      {expired && <Text style={[styles.status, styles.expired]}>TIME UP</Text>}
      {paused && <Text style={[styles.status, styles.paused]}>PAUSED</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 28,
  },

  label: {
    color: "#888",
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 4,
  },

  clock: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "bold",
    // Fixed-width digits so the clock doesn't jitter as it ticks.
    fontVariant: ["tabular-nums"],
  },

  status: {
    fontSize: 14,
    letterSpacing: 2,
    marginTop: 4,
  },

  paused: {
    color: "#ffd24d",
  },

  expired: {
    color: "#ff5c5c",
  },
});