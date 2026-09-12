export type EVATelemetry = {
  oxygen?: number;
  pressure?: number;
  temperature?: number;
  battery?: number;
  heartRate?: number;
};

export const fakeTelemetry: EVATelemetry = {
  oxygen: 87,
  pressure: 4.3,
  temperature: 21,
  battery: 76,
  heartRate: 92,
};