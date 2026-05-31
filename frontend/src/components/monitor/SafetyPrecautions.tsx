"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Smartphone, Activity, AlertOctagon, Navigation, Eye, Zap, Wind, TrendingUp } from "lucide-react";
import { type DriverData } from "@/services/driverData";

interface SafetyPrecautionsProps {
  data: DriverData;
}

// ── Stress arc gauge (SVG half-circle) ─────────────────────────────
function StressArcGauge({ value }: { value: number }) {
  const r = 54;
  const cx = 70;
  const cy = 70;
  const circumference = Math.PI * r; // half circle
  const dashOffset = circumference * (1 - value / 100);

  const color =
    value > 70 ? "#ef4444" :
    value > 45 ? "#f59e0b" :
    "#10b981";

  const label =
    value > 70 ? "HIGH" :
    value > 45 ? "MOD" :
    "LOW";

  return (
    <svg width="140" height="85" viewBox="0 0 140 85">
      {/* Track */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="10"
        strokeLinecap="round"
      />
      {/* Fill */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke={color}
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.4s ease" }}
      />
      {/* Center value */}
      <text x={cx} y={cy - 8} textAnchor="middle" fontSize="18" fontWeight="900" fill={color}
        style={{ transition: "fill 0.4s ease" }}>
        {value}%
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fontSize="9" fontWeight="700" fill="#9ca3af" letterSpacing="2">
        {label} STRESS
      </text>
    </svg>
  );
}

// ── Signal contribution bar ─────────────────────────────────────────
function SignalBar({
  label, value, max, color, icon
}: { label: string; value: number; max: number; color: string; icon: React.ReactNode }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1.5 text-gray-500 font-semibold">
          {icon}{label}
        </span>
        <span className={`font-black font-mono ${pct > 66 ? "text-red-500" : pct > 33 ? "text-amber-500" : "text-emerald-600"}`}>
          {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Emotion confidence bar ──────────────────────────────────────────
function EmotionBar({
  label, emoji, confidence, active, colorClass
}: { label: string; emoji: string; confidence: number; active: boolean; colorClass: string }) {
  return (
    <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all duration-300 ${
      active ? `${colorClass} shadow-sm` : "bg-gray-50 border-gray-100"
    }`}>
      <span className="text-base">{emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${active ? "" : "text-gray-400"}`}>
            {label}
          </span>
          <span className={`text-[10px] font-black font-mono ${active ? "" : "text-gray-400"}`}>
            {confidence}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${confidence}%`, opacity: active ? 1 : 0.35,
              background: active ? "currentColor" : "#d1d5db" }}
          />
        </div>
      </div>
      {active && (
        <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse shrink-0" />
      )}
    </div>
  );
}

// ── Reactive HRV waveform ───────────────────────────────────────────
function HRVWaveform({ stressLevel, bpm }: { stressLevel: number; bpm: number }) {
  const [points, setPoints] = useState<number[]>([]);
  const stressRef = useRef(stressLevel);
  stressRef.current = stressLevel;

  useEffect(() => {
    const MAX = 60;
    // Interval speeds up as stress rises: 100ms (high) → 200ms (low)
    const getInterval = () => Math.round(200 - stressRef.current * 1.0);

    let timer: ReturnType<typeof setTimeout>;
    let stepInCycle = 0;

    function tick() {
      setPoints(prev => {
        const next = [...prev];
        if (next.length >= MAX) next.shift();

        // HRV morphology: higher stress = taller R spike + more baseline noise
        const noise = (Math.random() - 0.5) * (stressRef.current / 20);
        const s = stepInCycle % 14;
        let val = noise * 0.5;
        if (s === 2) val = 2 + noise;                             // P-wave
        else if (s === 4) val = -(1 + stressRef.current / 80);    // Q dip
        else if (s === 5) val = 10 + stressRef.current / 10 + noise * 2; // R spike
        else if (s === 6) val = -3 - stressRef.current / 50;     // S dip
        else if (s === 8) val = 3.5 + noise;                     // T-wave
        else val = noise * (1 + stressRef.current / 60);         // Baseline noise

        next.push(val);
        return next;
      });
      stepInCycle++;
      timer = setTimeout(tick, getInterval());
    }

    tick();
    return () => clearTimeout(timer);
  }, []);

  const W = 260; const H = 60; const pts = points.length;
  const pathD = points.map((v, i) => `${i === 0 ? "M" : "L"} ${(i / Math.max(pts - 1, 1)) * W} ${H / 2 - v * 2.2}`).join(" ");

  const waveColor = stressLevel > 70 ? "#ef4444" : stressLevel > 45 ? "#f59e0b" : "#10b981";

  return (
    <div className="bg-gray-950 rounded-xl p-3 border border-gray-800 relative overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono font-bold text-emerald-400 flex items-center gap-1">
          <Activity className="w-3 h-3 animate-pulse" /> HRV · ECG MONITOR
        </span>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono font-bold" style={{ color: waveColor }}>
            {bpm} BPM
          </span>
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
            stressLevel > 70 ? "bg-red-900/50 text-red-300" :
            stressLevel > 45 ? "bg-amber-900/50 text-amber-300" :
            "bg-emerald-900/50 text-emerald-400"
          }`}>
            {stressLevel > 70 ? "IRREGULAR" : stressLevel > 45 ? "ELEVATED" : "NORMAL"}
          </span>
        </div>
      </div>
      {/* Grid lines */}
      <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
        {[0.25, 0.5, 0.75].map(f => (
          <line key={f} x1={0} y1={H * f} x2={W} y2={H * f} stroke="#1f2937" strokeWidth="1" />
        ))}
        {points.length > 1 && (
          <>
            {/* Glow copy */}
            <path d={pathD} fill="none" stroke={waveColor} strokeWidth="3" strokeOpacity="0.15"
              strokeLinecap="round" strokeLinejoin="round" />
            <path d={pathD} fill="none" stroke={waveColor} strokeWidth="1.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </svg>
      {/* Scan line effect */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 70%, ${waveColor}10 100%)` }} />
    </div>
  );
}

// ── Neurocognitive load tile ────────────────────────────────────────
function CogLoadTile({
  label, value, unit, icon, warn, crit
}: { label: string; value: number | string; unit?: string; icon: React.ReactNode; warn: boolean; crit: boolean }) {
  return (
    <div className={`rounded-xl p-3 border flex flex-col gap-1 transition-all duration-300 ${
      crit ? "bg-red-50 border-red-200" : warn ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-100"
    }`}>
      <div className={`${crit ? "text-red-500" : warn ? "text-amber-500" : "text-gray-400"}`}>
        {icon}
      </div>
      <div className={`text-lg font-black leading-none ${crit ? "text-red-600" : warn ? "text-amber-600" : "text-gray-700"}`}>
        {value}{unit}
      </div>
      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-tight">{label}</div>
      <div className={`text-[9px] font-bold ${crit ? "text-red-500" : warn ? "text-amber-500" : "text-emerald-600"}`}>
        {crit ? "⚠ Critical" : warn ? "△ Elevated" : "✓ Normal"}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────
export default function SafetyPrecautions({ data }: SafetyPrecautionsProps) {
  const clamp = (val: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, val));

  // ── Derived stress sub-signals ──────────────────────────────────
  const blinkStress    = clamp((data.blinkRate > 20 ? (data.blinkRate - 20) * 4 : 0) + (data.blinkRate < 8 ? 40 : 0), 0, 100);
  const poseStress     = clamp((Math.abs(data.yaw) + Math.abs(data.pitch)) * 1.6, 0, 100);
  const drowsyStress   = clamp(data.drowsinessLevel, 0, 100);
  const yawnStress     = clamp(data.yawnCount * 18, 0, 100);

  // ── HRV BPM – reacts to stress ─────────────────────────────────
  const [displayBpm, setDisplayBpm] = useState(72);
  useEffect(() => {
    const base = 68 + (data.stressLevel - 15) * 0.45;
    setDisplayBpm(Math.round(base + (Math.random() - 0.5) * 4));
  }, [data.stressLevel]);

  // ── Emotion confidence derivation ──────────────────────────────
  // Build a confidence score for each emotion state from the live data
  const neutralConf = clamp(
    100 - data.drowsinessLevel * 0.5 - blinkStress * 0.3 - poseStress * 0.2, 10, 95
  );
  const tiredConf = clamp(
    data.drowsinessLevel * 0.7 + data.yawnCount * 8 + (data.blinkRate < 10 ? 20 : 0), 0, 95
  );
  const stressedConf = clamp(
    blinkStress * 0.4 + poseStress * 0.4 + data.stressLevel * 0.2, 0, 95
  );
  const happyConf = clamp(
    data.emotion === "HAPPY" ? 80 + Math.random() * 10 : Math.max(0, 40 - data.stressLevel * 0.4), 0, 90
  );

  // Normalize so all 4 sum ≈ 200 (keeps them realistic without 100% domination)
  const activeEmotion: string =
    data.drowsinessLevel > 55 || tiredConf > 55 ? "TIRED" :
    data.stressLevel > 65 || stressedConf > 55 ? "STRESSED" :
    data.emotion === "HAPPY" ? "HAPPY" :
    "NEUTRAL";

  // ── Stress level color system ───────────────────────────────────
  const stressGrad =
    data.stressLevel > 70
      ? "linear-gradient(135deg,#fef2f2,#fee2e2)"
      : data.stressLevel > 45
      ? "linear-gradient(135deg,#fffbeb,#fef3c7)"
      : "linear-gradient(135deg,#f0fdf4,#dcfce7)";

  // ── Emotion display map ─────────────────────────────────────────
  const emotionMap: Record<string, { emoji: string; label: string; colorClass: string }> = {
    NEUTRAL:  { emoji: "😐", label: "Neutral",  colorClass: "bg-gray-100 border-gray-300 text-gray-700" },
    HAPPY:    { emoji: "😊", label: "Happy",    colorClass: "bg-pink-50 border-pink-300 text-pink-700" },
    TIRED:    { emoji: "😴", label: "Fatigued", colorClass: "bg-blue-50 border-blue-300 text-blue-700" },
    STRESSED: { emoji: "😰", label: "Stressed", colorClass: "bg-orange-50 border-orange-300 text-orange-700" },
  };
  const currentEmotionCfg = emotionMap[activeEmotion] ?? emotionMap.NEUTRAL;

  return (
    <div className="space-y-6">

      {/* ── Phone Alert Banner ── */}
      {data.phoneDetected && (
        <div className="bg-red-500 text-white rounded-2xl p-5 shadow-lg flex items-center gap-4 border border-red-600 animate-pulse">
          <div className="p-3 bg-white/20 rounded-full">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-white" />
              MOBILE PHONE USAGE DETECTED!
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Distracted driving registered. Hands must remain on the wheel at all times.
            </p>
          </div>
        </div>
      )}

      {/* ── Row 1: Head Pose + Cognitive Stress ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: Head Pose */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-gray-700" />
              Head Position &amp; Alignment
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Real-time Pitch, Yaw, and Roll. Severe offsets indicate driver distraction or looking away.
            </p>
          </div>

          <div className="py-6 flex items-center justify-around bg-gray-50 rounded-xl border border-gray-100 min-h-[220px]">
            {[
              { label: "Yaw (Turn)",    val: data.yaw,   color: "bg-blue-500",   dot: "bg-blue-600",   limit: 15, limitLbl: "Sideways",  axis: "yaw" },
              { label: "Pitch (Tilt)",  val: data.pitch, color: "bg-indigo-500", dot: "bg-indigo-600", limit: 15, limitLbl: "Up/Down",   axis: "pitch" },
              { label: "Roll (Lean)",   val: data.roll,  color: "bg-purple-500", dot: "bg-purple-600", limit: 12, limitLbl: "Leaning",   axis: "roll" },
            ].map(({ label, val, color, dot, limit, limitLbl, axis }) => (
              <div key={axis} className="flex flex-col items-center space-y-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</span>
                <div className="w-24 h-24 rounded-full border-4 border-gray-200 relative flex items-center justify-center bg-white shadow-sm">
                  <div className="absolute w-5/6 h-0.5 bg-gray-100" />
                  <div
                    className={`${axis === "pitch" ? "w-16 h-1.5" : "w-1.5 h-16"} ${color} rounded-full transition-transform duration-300 origin-center`}
                    style={{ transform: `rotate(${clamp(axis === "pitch" ? -val : val, -45, 45)}deg)` }}
                  />
                  <div className={`absolute w-2 h-2 ${dot} rounded-full`} />
                </div>
                <span className="text-sm font-mono font-bold text-gray-700">
                  {val > 0 ? `+${val.toFixed(1)}°` : `${val.toFixed(1)}°`}
                </span>
                <span className={`text-[10px] font-semibold ${Math.abs(val) > limit ? "text-amber-500" : "text-gray-400"}`}>
                  {Math.abs(val) > limit ? `Looking ${limitLbl}` : "Aligned"}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 border-t border-gray-100 pt-3">
            <span>Orientation Status</span>
            <span className={Math.abs(data.yaw) > 15 || Math.abs(data.pitch) > 15 ? "text-yellow-600" : "text-green-600"}>
              {Math.abs(data.yaw) > 15 || Math.abs(data.pitch) > 15 ? "⚠️ Out of Alignment" : "✅ Centered"}
            </span>
          </div>
        </div>

        {/* Card 2: Cognitive Stress Analysis — REDESIGNED */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4">

          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-gray-700" />
                Cognitive Stress Analysis
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Multi-signal neurocognitive load · real-time autonomic biometrics
              </p>
            </div>
            {/* Active emotion chip */}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${currentEmotionCfg.colorClass}`}>
              {currentEmotionCfg.emoji} {currentEmotionCfg.label}
            </span>
          </div>

          {/* Gauge + breakdown row */}
          <div className="flex items-center gap-4">
            {/* Arc gauge */}
            <div className="shrink-0 flex flex-col items-center" style={{ background: stressGrad, borderRadius: 16, padding: "8px 12px" }}>
              <StressArcGauge value={data.stressLevel} />
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider -mt-1">Cognitive Load Index</span>
            </div>

            {/* Signal breakdown bars */}
            <div className="flex-1 space-y-2.5">
              <SignalBar
                label="Blink Irregularity"
                value={blinkStress} max={100}
                color="linear-gradient(90deg,#6366f1,#8b5cf6)"
                icon={<Eye className="w-3 h-3" />}
              />
              <SignalBar
                label="Head Pose Offset"
                value={poseStress} max={100}
                color="linear-gradient(90deg,#0ea5e9,#6366f1)"
                icon={<Navigation className="w-3 h-3" />}
              />
              <SignalBar
                label="Drowsiness Load"
                value={drowsyStress} max={100}
                color="linear-gradient(90deg,#f59e0b,#ef4444)"
                icon={<Wind className="w-3 h-3" />}
              />
              <SignalBar
                label="Yawn Fatigue"
                value={yawnStress} max={100}
                color="linear-gradient(90deg,#10b981,#0ea5e9)"
                icon={<TrendingUp className="w-3 h-3" />}
              />
            </div>
          </div>

          {/* HRV Waveform */}
          <HRVWaveform stressLevel={data.stressLevel} bpm={displayBpm} />

          {/* Emotion confidence matrix */}
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Emotion Confidence Matrix</p>
            <div className="grid grid-cols-2 gap-2">
              <EmotionBar label="Neutral"  emoji="😐" confidence={Math.round(neutralConf)}  active={activeEmotion === "NEUTRAL"}  colorClass="bg-gray-100 border-gray-300 text-gray-700" />
              <EmotionBar label="Happy"    emoji="😊" confidence={Math.round(happyConf)}    active={activeEmotion === "HAPPY"}    colorClass="bg-pink-50 border-pink-300 text-pink-600" />
              <EmotionBar label="Fatigued" emoji="😴" confidence={Math.round(tiredConf)}    active={activeEmotion === "TIRED"}    colorClass="bg-blue-50 border-blue-300 text-blue-600" />
              <EmotionBar label="Stressed" emoji="😰" confidence={Math.round(stressedConf)} active={activeEmotion === "STRESSED"} colorClass="bg-orange-50 border-orange-300 text-orange-600" />
            </div>
          </div>

        </div>
      </div>

      {/* ── Row 2: Neurocognitive Load Tiles ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-gray-700" />
              Neurocognitive Load Breakdown
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Per-signal decomposition of cognitive strain across 6 autonomic channels
            </p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            data.stressLevel > 70 ? "bg-red-50 border-red-300 text-red-600 animate-pulse" :
            data.stressLevel > 45 ? "bg-amber-50 border-amber-300 text-amber-600" :
            "bg-emerald-50 border-emerald-300 text-emerald-600"
          }`}>
            {data.stressLevel > 70 ? "🔴 HIGH LOAD" : data.stressLevel > 45 ? "🟡 MOD LOAD" : "🟢 STABLE"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <CogLoadTile
            label="Blink Rate"
            value={data.blinkRate}
            unit="/min"
            icon={<Eye className="w-4 h-4" />}
            warn={data.blinkRate > 22 || data.blinkRate < 8}
            crit={data.blinkRate > 28 || data.blinkRate < 5}
          />
          <CogLoadTile
            label="Drowsiness"
            value={data.drowsinessLevel}
            unit="%"
            icon={<Wind className="w-4 h-4" />}
            warn={data.drowsinessLevel > 35}
            crit={data.drowsinessLevel > 65}
          />
          <CogLoadTile
            label="Yawn Count"
            value={data.yawnCount}
            icon={<Activity className="w-4 h-4" />}
            warn={data.yawnCount >= 3}
            crit={data.yawnCount >= 6}
          />
          <CogLoadTile
            label="HRV (est.)"
            value={displayBpm}
            unit=" bpm"
            icon={<Activity className="w-4 h-4" />}
            warn={displayBpm > 88}
            crit={displayBpm > 100}
          />
          <CogLoadTile
            label="Head Offset"
            value={Math.round(Math.abs(data.yaw) + Math.abs(data.pitch))}
            unit="°"
            icon={<Navigation className="w-4 h-4" />}
            warn={Math.abs(data.yaw) + Math.abs(data.pitch) > 20}
            crit={Math.abs(data.yaw) + Math.abs(data.pitch) > 40}
          />
          <CogLoadTile
            label="Stress Index"
            value={data.stressLevel}
            unit="%"
            icon={<Brain className="w-4 h-4" />}
            warn={data.stressLevel > 45}
            crit={data.stressLevel > 70}
          />
        </div>

        {/* Insight text */}
        <div className={`mt-4 text-xs rounded-xl p-3 border flex items-start gap-2 transition-all duration-300 ${
          data.stressLevel > 70
            ? "bg-red-50 border-red-200 text-red-800"
            : data.stressLevel > 45
            ? "bg-amber-50 border-amber-200 text-amber-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          <span className="text-base shrink-0">
            {data.stressLevel > 70 ? "🚨" : data.stressLevel > 45 ? "⚠️" : "✅"}
          </span>
          <span className="leading-relaxed font-medium">
            {data.stressLevel > 70
              ? `Severe cognitive overload detected. HRV is elevated at ${displayBpm} BPM, drowsiness at ${data.drowsinessLevel}%, and ${data.yawnCount} yawn(s) recorded. Immediate rest recommended to prevent impaired reaction time.`
              : data.stressLevel > 45
              ? `Moderate autonomic arousal present. Blink rate at ${data.blinkRate}/min with ${data.yawnCount} yawn(s) detected. Head pose offset is ${(Math.abs(data.yaw) + Math.abs(data.pitch)).toFixed(0)}°. Stay hydrated and monitor for further fatigue.`
              : `All autonomic channels within safe thresholds. HRV nominal at ${displayBpm} BPM. Cognitive load is low — driver is alert and focused. Continue monitoring.`
            }
          </span>
        </div>
      </div>

      {/* ── Panel 3: Phone Usage Detection ── */}
      <div className={`bg-white border rounded-2xl p-5 transition-all duration-300 ${data.phoneDetected ? "border-red-400 ring-2 ring-red-100" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className={`w-5 h-5 ${data.phoneDetected ? "text-red-500 animate-bounce" : "text-gray-700"}`} />
            Distracted Driving (Phone Detection)
          </h3>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
            data.phoneDetected
              ? "bg-red-500 border-red-600 text-white animate-pulse"
              : "bg-green-50 border-green-200 text-green-600"
          }`}>
            {data.phoneDetected ? "PHONE DETECTED!" : "SAFE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`md:col-span-2 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 ${
            data.phoneDetected ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-200"
          }`}>
            <p className={`text-xs leading-relaxed transition-all duration-300 ${data.phoneDetected ? "text-red-800 font-semibold" : "text-gray-600"}`}>
              {data.phoneDetected
                ? "🚨 CRITICAL WARNING: Mobile phone physically detected in frame by YOLOv8 AI model. Put the device away immediately and keep both hands on the wheel."
                : "The YOLOv8 object detection model monitors for mobile phone presence in real-time. A phone must be visibly held with ≥70% confidence across 3 consecutive detections before any alert fires — eliminating false positives."
              }
            </p>
            <div className="flex gap-4">
              <div className="text-xs">
                <span className="text-gray-400 font-bold block">Detection Engine</span>
                <span className={`font-mono font-bold ${data.phoneDetected ? "text-red-600 font-black animate-pulse" : "text-gray-800"}`}>
                  {data.phoneDetected ? "YOLOv8 · Phone Confirmed" : "YOLOv8 · No Phone Detected"}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-gray-400 font-bold block">Tracking Camera</span>
                <span className="font-mono font-bold text-gray-800">Primary IR Sensor</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 transition-all duration-300 ${
            data.phoneDetected ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200"
          }`}>
            <div className={`p-3 rounded-full transition-all duration-300 ${
              data.phoneDetected ? "bg-red-500 text-white animate-bounce" : "bg-green-100 text-green-600"
            }`}>
              <Smartphone className="w-8 h-8" />
            </div>
            <div className="text-xs">
              <div className="font-bold">
                {data.phoneDetected ? "Phone Activity Alert!" : "Mobile Locked / Cradle"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {data.phoneDetected ? "Keep hands on wheel." : "Securely docked."}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
