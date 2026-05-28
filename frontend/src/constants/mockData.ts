// ────────────────────────────────────────────────────────────────
// AI Driver Monitoring – Mock Data & Constants
// ────────────────────────────────────────────────────────────────

export type DriverStatus = "SAFE" | "WARNING" | "DROWSY" | "DISTRACTED";

export interface MockDriverData {
  driverName: string;
  driverId: string;
  vehicleId: string;
  status: DriverStatus;
  fatigueScore: number;        // 0-100 (0=fully alert, 100=critically fatigued)
  attentionScore: number;      // 0-100
  safetyScore: number;         // 0-100
  blinkCount: number;          // blinks per minute
  yawnCount: number;
  heartRate: number;
  tripDuration: number;        // minutes
  distanceTraveled: number;    // km
  speed: number;               // km/h
  eyeOpenness: number;         // 0-100%
  headPoseX: number;           // horizontal tilt
  headPoseY: number;           // vertical tilt
  faceDetected: boolean;
  eyesOpen: boolean;
  drowsinessDetected: boolean;
  yawningDetected: boolean;
  distracted: boolean;
  lastUpdated: string;
}

export const INITIAL_DRIVER_DATA: MockDriverData = {
  driverName: "Alex Mercer",
  driverId: "DRV-8821",
  vehicleId: "VH-TES-001",
  status: "SAFE",
  fatigueScore: 22,
  attentionScore: 87,
  safetyScore: 91,
  blinkCount: 16,
  yawnCount: 1,
  heartRate: 72,
  tripDuration: 47,
  distanceTraveled: 63.4,
  speed: 92,
  eyeOpenness: 88,
  headPoseX: 2,
  headPoseY: -1,
  faceDetected: true,
  eyesOpen: true,
  drowsinessDetected: false,
  yawningDetected: false,
  distracted: false,
  lastUpdated: new Date().toISOString(),
};

// ── Chart history data ────────────────────────────────────────────

export interface TimeSeriesPoint {
  time: string;
  value: number;
}

export function generateBlinkHistory(): TimeSeriesPoint[] {
  const times = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45"];
  const values = [17, 15, 14, 18, 22, 19, 16, 13, 11, 16];
  return times.map((t, i) => ({ time: t, value: values[i] }));
}

export function generateAttentionHistory(): TimeSeriesPoint[] {
  const times = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45"];
  const values = [92, 89, 85, 91, 78, 72, 80, 88, 84, 87];
  return times.map((t, i) => ({ time: t, value: values[i] }));
}

export function generateFatigueHistory(): TimeSeriesPoint[] {
  const times = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45"];
  const values = [10, 12, 15, 18, 28, 35, 30, 25, 22, 22];
  return times.map((t, i) => ({ time: t, value: values[i] }));
}

// ── AI Assistant Messages ─────────────────────────────────────────

export interface AIMessage {
  id: string;
  type: "info" | "warning" | "danger" | "success";
  text: string;
  timestamp: string;
}

export const INITIAL_AI_MESSAGES: AIMessage[] = [
  {
    id: "m1",
    type: "success",
    text: "Vision systems nominal. Driver recognition confirmed.",
    timestamp: "10:44:02",
  },
  {
    id: "m2",
    type: "info",
    text: "Attention tracking active. Eye movement patterns stable.",
    timestamp: "10:43:18",
  },
  {
    id: "m3",
    type: "warning",
    text: "Slight head tilt detected. Monitoring posture.",
    timestamp: "10:41:55",
  },
  {
    id: "m4",
    type: "success",
    text: "Trip initiated. Safety protocols engaged.",
    timestamp: "10:01:00",
  },
];

// ── Trip Timeline ────────────────────────────────────────────────

export interface TripEvent {
  id: string;
  time: string;
  event: string;
  type: "normal" | "warning" | "alert" | "info";
}

export const TRIP_TIMELINE: TripEvent[] = [
  { id: "t1", time: "10:01", event: "Trip started – Safety protocols initialized", type: "info" },
  { id: "t2", time: "10:08", event: "Driver fully alert – All systems green", type: "normal" },
  { id: "t3", time: "10:22", event: "Mild fatigue detected – Audio alert triggered", type: "warning" },
  { id: "t4", time: "10:27", event: "Yawn detected – Recommendation issued", type: "alert" },
  { id: "t5", time: "10:31", event: "Driver re-engaged – Fatigue score dropped", type: "normal" },
  { id: "t6", time: "10:44", event: "Current: All metrics within safe range", type: "info" },
];

// ── Driving Insights ─────────────────────────────────────────────

export const DRIVING_INSIGHTS = [
  { label: "Avg Blink Rate",  value: "16/min",   status: "normal",  icon: "eye" },
  { label: "Attention Dips",  value: "3 events",  status: "warning", icon: "alert" },
  { label: "Yawn Events",     value: "2 total",   status: "warning", icon: "yawn" },
  { label: "Focus Score",     value: "87%",        status: "normal",  icon: "brain" },
  { label: "Rest Advised In", value: "43 min",     status: "info",    icon: "clock" },
  { label: "Risk Level",      value: "LOW",        status: "normal",  icon: "shield" },
];

// ── Status color map ────────────────────────────────────────────

export const STATUS_COLORS: Record<DriverStatus, { glow: string; text: string; bg: string; border: string }> = {
  SAFE:       { glow: "#22c55e", text: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/40" },
  WARNING:    { glow: "#eab308", text: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/40" },
  DROWSY:     { glow: "#ef4444", text: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/40" },
  DISTRACTED: { glow: "#f97316", text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/40" },
};

// ── Loading screen messages ──────────────────────────────────────

export const LOADING_MESSAGES = [
  "Initializing AI Driver Monitoring...",
  "Calibrating Vision System...",
  "Loading Safety Protocols...",
  "Engaging Neural Processing Engine...",
  "Synchronizing Sensor Array...",
  "Establishing Secure Connection...",
  "AI Systems Online.",
];
