import { EVATelemetry } from './telemetry';

export type Workload = 'low' | 'medium' | 'high';

export function getVisibleTelemetry(
  telemetry: EVATelemetry,
  workload: Workload
) {
  if (workload === 'high') {
    return {
      oxygen: telemetry.oxygen,
      battery: telemetry.battery,
    };
  }

  if (workload === 'medium') {
    return {
      oxygen: telemetry.oxygen,
      pressure: telemetry.pressure,
      battery: telemetry.battery,
    };
  }

  return telemetry;
}