// EVA timer. A stopwatch by default; once a duration is set it counts
// down instead. All functions are pure and take `now` (epoch ms) as an
// argument so the logic is deterministic and easy to test.

export interface TimerState {
  // When set, the timer counts down from this. null = counts up.
  durationMs: number | null;
  // Time accumulated before the current run started.
  accumulatedMs: number;
  // Epoch ms the current run started, or null while stopped/paused.
  startedAt: number | null;
}

export function createTimer(): TimerState {
  return { durationMs: null, accumulatedMs: 0, startedAt: null };
}

export function isRunning(timer: TimerState): boolean {
  return timer.startedAt !== null;
}

export function getElapsedMs(timer: TimerState, now: number): number {
  const sinceStart =
    timer.startedAt === null ? 0 : Math.max(0, now - timer.startedAt);
  return timer.accumulatedMs + sinceStart;
}

// A countdown that has run out. A stopwatch never expires.
export function isExpired(timer: TimerState, now: number): boolean {
  return (
    timer.durationMs !== null && getElapsedMs(timer, now) >= timer.durationMs
  );
}

// Whole seconds to show on screen. A countdown rounds up so it reads
// the full duration when it starts and only reaches 0 when time is up.
export function getDisplaySeconds(timer: TimerState, now: number): number {
  const elapsed = getElapsedMs(timer, now);

  if (timer.durationMs === null) {
    return Math.floor(elapsed / 1000);
  }

  return Math.ceil(Math.max(0, timer.durationMs - elapsed) / 1000);
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

// Starts, or resumes after a pause. Does nothing if it's already
// running or a countdown has already run out (reset it first).
export function startTimer(timer: TimerState, now: number): TimerState {
  if (isRunning(timer) || isExpired(timer, now)) return timer;
  return { ...timer, startedAt: now };
}

export function pauseTimer(timer: TimerState, now: number): TimerState {
  if (!isRunning(timer)) return timer;
  return {
    ...timer,
    accumulatedMs: getElapsedMs(timer, now),
    startedAt: null,
  };
}

// Back to zero and stopped. A countdown keeps its duration, so it reads
// the full time again.
export function resetTimer(timer: TimerState): TimerState {
  return { ...timer, accumulatedMs: 0, startedAt: null };
}

export function restartTimer(timer: TimerState, now: number): TimerState {
  return startTimer(resetTimer(timer), now);
}

// Loads a countdown but leaves it stopped; "start timer" runs it. Any
// time already on the clock is discarded.
export function setCountdown(durationMs: number): TimerState {
  return { durationMs, accumulatedMs: 0, startedAt: null };
}

// Back to a fresh, stopped stopwatch.
export function clearTimer(): TimerState {
  return createTimer();
}