/**
 * driverData.ts
 * Polls the Python backend at http://localhost:5000/api/status every second.
 * Falls back to realistic simulated mock data if the backend is unreachable.
 */

export type DriverStatus = "SAFE" | "WARNING" | "DROWSY" | "DISTRACTED";

export interface DriverAlert {
  id: string;
  time: string;
  type: "info" | "warning" | "danger";
  message: string;
}

export interface DriverData {
  status: DriverStatus;
  drowsinessLevel: number;   // 0–100
  attentionScore: number;    // 0–100
  blinkRate: number;         // blinks per minute
  eyesOpen: boolean;
  yawnCount: number;
  safetyScore: number;       // 0–100
  faceDetected: boolean;
  sessionSeconds: number;
  alerts: DriverAlert[];
  connected: boolean;
  pitch: number;
  yaw: number;
  roll: number;
  stressLevel: number;
  phoneDetected: boolean;
  accidentDetected: boolean;
  emotion: string;
  raw?: any; // To help debug what Python is actually sending
}

// ── API endpoint ──────────────────────────────────────────────────
const API_URL = "/api/status";

// ── Sine-wave simulator for realistic wave shapes ──────────────────
// Each metric has its own independent phase and speed so they move differently
let simTick = 0;

/** Smooth sine-wave value with noise on top — looks like real sensor data */
function sineWave(
  tick: number,
  baseValue: number,
  amplitude: number,
  period: number,
  phaseOffset: number,
  noiseMag: number
): number {
  const sine = Math.sin((tick / period) * 2 * Math.PI + phaseOffset);
  const noise = (Math.random() - 0.5) * 2 * noiseMag;
  return baseValue + sine * amplitude + noise;
}

export function getMockData(prevData?: DriverData): DriverData {
  simTick++;

  // ── Drowsiness: slow rise and fall (period ~60s), base ~25%, amp ±20 ──
  const rawDrowsiness = sineWave(simTick, 30, 22, 60, 0, 4);
  const drowsiness = Math.round(Math.max(5, Math.min(95, rawDrowsiness)));

  // ── Attention: inversely related to drowsiness, faster oscillation ──
  const rawAttention = sineWave(simTick, 78, 18, 45, Math.PI * 0.7, 5);
  const attention = Math.round(Math.max(30, Math.min(100, rawAttention)));

  // ── Blink rate: faster oscillation, realistic 10–22 range ──
  const rawBlink = sineWave(simTick, 16, 5, 30, Math.PI * 1.3, 2);
  const blinkRate = Math.round(Math.max(5, Math.min(30, rawBlink)));

  // ── Safety score: composite of above ──
  const rawSafety = 100 - drowsiness * 0.5 - (100 - attention) * 0.3;
  const safetyScore = Math.round(Math.max(30, Math.min(100, rawSafety)));

  // ── Status logic ──
  const isDrowsy      = drowsiness > 65;
  const isDistracted  = attention < 55;
  const isWarning     = drowsiness > 40 || attention < 68;

  const status: DriverStatus = isDrowsy
    ? "DROWSY"
    : isDistracted
    ? "DISTRACTED"
    : isWarning
    ? "WARNING"
    : "SAFE";

  // ── Alerts ──
  const prevAlerts = prevData?.alerts ?? [];
  const alerts = [...prevAlerts];

  if (
    prevData &&
    status !== "SAFE" &&
    prevData.status === "SAFE" &&
    alerts.length < 20
  ) {
    alerts.unshift({
      id: `alert-${Date.now()}`,
      time: new Date().toLocaleTimeString("en-US", { hour12: false }),
      type: isDrowsy ? "danger" : "warning",
      message: isDrowsy
        ? "Drowsiness detected — please take a break."
        : isDistracted
        ? "Driver appears distracted. Focus on the road."
        : "Caution: attention score dropping.",
    });
  }

  // Yawn: rare event (1% per tick)
  const prevYawns = prevData?.yawnCount ?? 0;
  const yawnCount = prevYawns + (Math.random() < 0.012 ? 1 : 0);

  // Pitch, Yaw, Roll: head movements
  const rawPitch = sineWave(simTick, 0, 5, 20, 0, 1.2);
  const rawYaw = sineWave(simTick, 0, 8, 30, Math.PI / 4, 1.8);
  const rawRoll = sineWave(simTick, 0, 3, 15, Math.PI / 2, 0.7);

  const pitch = Math.round(rawPitch * 10) / 10;
  const yaw = Math.round(rawYaw * 10) / 10;
  const roll = Math.round(rawRoll * 10) / 10;

  // Stress level: calculated from drowsiness and distraction
  const stressLevel = Math.round(Math.max(10, Math.min(95, drowsiness * 0.5 + (100 - attention) * 0.4 + 12)));

  // Phone detection is handled by real YOLOv8 only — never simulate it
  const isHoldingPhone = false;

  // Accident detected: preserve from UI trigger
  const accidentDetected = prevData?.accidentDetected ?? false;

  // Emotion status: simulate NEUTRAL vs HAPPY vs TIRED vs DISTRACTED
  let emotion = "NEUTRAL";
  if (drowsiness > 60) emotion = "TIRED";
  else if (simTick % 30 < 6) emotion = "HAPPY";

  return {
    status,
    drowsinessLevel: drowsiness,
    attentionScore: attention,
    blinkRate,
    eyesOpen: drowsiness < 68,
    yawnCount,
    safetyScore,
    faceDetected: true,
    sessionSeconds: (prevData?.sessionSeconds ?? 0) + 1,
    alerts,
    connected: false,
    pitch,
    yaw,
    roll,
    stressLevel,
    phoneDetected: isHoldingPhone,
    accidentDetected,
    emotion,
    raw: { demo_mode: true }
  };
}

// ── Pre-seed 30 historical points so charts are full on load ──────

export interface HistoryPoint { time: string; value: number; }

function makeTimeLabel(secondsAgo: number): string {
  const d = new Date(Date.now() - secondsAgo * 1000);
  return `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

export function seedHistory(count = 30): {
  drowsiness: HistoryPoint[];
  attention: HistoryPoint[];
  blink: HistoryPoint[];
} {
  // Temporarily run the simulator backwards to create history
  const savedTick = simTick;
  simTick = 0; // reset so seed starts from tick 0

  const drowsiness: HistoryPoint[] = [];
  const attention:  HistoryPoint[] = [];
  const blink:      HistoryPoint[] = [];

  for (let i = count; i >= 1; i--) {
    simTick++;
    const rawD = sineWave(simTick, 30, 22, 60, 0, 4);
    const rawA = sineWave(simTick, 78, 18, 45, Math.PI * 0.7, 5);
    const rawB = sineWave(simTick, 16, 5, 30, Math.PI * 1.3, 2);

    const t = makeTimeLabel(count - simTick);
    drowsiness.push({ time: t, value: Math.round(Math.max(5, Math.min(95, rawD))) });
    attention.push({ time: t, value: Math.round(Math.max(30, Math.min(100, rawA))) });
    blink.push({ time: t, value: Math.round(Math.max(5, Math.min(30, rawB))) });
  }

  simTick = savedTick; // restore so live ticks continue from where they left off
  return { drowsiness, attention, blink };
}

// ── Fetch from Python backend ──────────────────────────────────────

export async function fetchDriverData(prev?: DriverData): Promise<DriverData> {
  try {
    const res = await fetch(API_URL, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();

    const parseBool = (val: any, def: boolean) => {
      if (val === undefined || val === null) return def;
      if (typeof val === "boolean") return val;
      if (typeof val === "number") return val !== 0;
      if (typeof val === "string") {
        const lower = val.toLowerCase().trim();
        return !(lower === "false" || lower === "0" || lower === "closed" || lower === "no");
      }
      return def;
    };

    const parseNum = (val: any, def: number) => {
      if (val === undefined || val === null) return def;
      const parsed = Number(val);
      return isNaN(parsed) ? def : parsed;
    };

    const isEyesOpen = parseBool(
      raw.eyes_open ?? raw.eyesOpen ?? raw.eyesStatus ?? raw.eyes_status ?? raw.eye_state ?? raw.is_eyes_open,
      true
    );

    const pitch = parseNum(raw.pitch, 0);
    const yaw = parseNum(raw.yaw, 0);
    const roll = parseNum(raw.roll, 0);
    const stressLevel = parseNum(raw.stress_level ?? raw.stressLevel, 15);
    const phoneDetected = parseBool(raw.phone_detected ?? raw.phoneDetected, false);
    const accidentDetected = parseBool(raw.accident_detected ?? raw.accidentDetected, false);
    const emotion = raw.emotion ?? "NEUTRAL";

    return {
      status:           raw.status           ?? "SAFE",
      drowsinessLevel:  parseNum(raw.drowsiness_level ?? raw.drowsinessLevel, 0),
      attentionScore:   parseNum(raw.attention_score ?? raw.attentionScore, 100),
      blinkRate:        parseNum(raw.blink_rate ?? raw.blinkRate, 15),
      eyesOpen:         isEyesOpen,
      yawnCount:        parseNum(raw.yawn_count ?? raw.yawnCount, 0),
      safetyScore:      parseNum(raw.safety_score ?? raw.safetyScore, 100),
      faceDetected:     parseBool(raw.face_detected ?? raw.faceDetected, true),
      sessionSeconds:   parseNum(raw.session_seconds ?? raw.sessionSeconds, 0),
      pitch,
      yaw,
      roll,
      stressLevel,
      phoneDetected,
      accidentDetected,
      emotion,
      alerts: (raw.alerts ?? []).map(
        (a: { time: string; type: string; message: string }, i: number) => ({
          id: `be-${i}`,
          time: a.time,
          type: a.type as "info" | "warning" | "danger",
          message: a.message,
        })
      ),
      connected: true,
      raw: raw,
    };
  } catch (err) {
    // Only log once to avoid spam
    if (typeof window !== "undefined" && !(window as any).__dmsWarnedOffline) {
      console.warn("[DMS] Backend not reachable, using demo data.", err);
      (window as any).__dmsWarnedOffline = true;
    }
    return getMockData(prev);
  }
}
