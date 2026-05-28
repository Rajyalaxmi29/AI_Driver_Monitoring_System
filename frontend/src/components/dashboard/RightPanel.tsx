"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { MockDriverData, DriverStatus } from "@/constants/mockData";
import { STATUS_COLORS } from "@/constants/mockData";
import { Brain, MessageCircle, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { AIMessage } from "@/constants/mockData";

// ── Status Orb ────────────────────────────────────────────────────

function StatusOrb({ status }: { status: DriverStatus }) {
  const colors = STATUS_COLORS[status];
  const orbRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = orbRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;
    let animId: number;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.38;

      const glowColor = colors.glow;
      const pulse = Math.sin(t * 0.04) * 0.5 + 0.5;

      // Outer glow rings
      [1.6, 1.3, 1.1].forEach((scale, i) => {
        const alpha = (0.06 - i * 0.015) + pulse * 0.04;
        ctx.beginPath();
        ctx.arc(cx, cy, R * scale, 0, Math.PI * 2);
        ctx.fillStyle = `${glowColor.slice(0, 7)}${Math.round(alpha * 255).toString(16).padStart(2, "0")}`;
        ctx.fill();
      });

      // Main orb gradient
      const grad = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.25, 0, cx, cy, R);
      grad.addColorStop(0, glowColor + "ff");
      grad.addColorStop(0.5, glowColor + "cc");
      grad.addColorStop(1, glowColor + "33");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 30 + pulse * 20;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shine
      const shine = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, 0, cx, cy, R * 0.6);
      shine.addColorStop(0, "rgba(255,255,255,0.35)");
      shine.addColorStop(1, "rgba(255,255,255,0)");
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fillStyle = shine;
      ctx.fill();

      // Rotating ring
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.02);
      ctx.beginPath();
      ctx.arc(0, 0, R * 1.2, 0, Math.PI * 1.5);
      ctx.strokeStyle = `${glowColor}60`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      t++;
      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animId);
  }, [colors]);

  const label = status === "SAFE" ? "SAFE" : status === "WARNING" ? "CAUTION" : status === "DROWSY" ? "DROWSY" : "DISTRACTED";

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-[9px] font-mono tracking-[0.3em] text-white/30 uppercase">Driver Status</div>
      <div className="relative w-28 h-28">
        <canvas ref={orbRef} className="w-full h-full" />
      </div>
      <motion.div
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className={`text-sm font-bold tracking-[0.2em] uppercase font-mono ${colors.text}`}
        style={{ textShadow: `0 0 12px ${colors.glow}` }}
      >
        {label}
      </motion.div>
    </div>
  );
}

// ── Circular Meter ────────────────────────────────────────────────

function CircularMeter({ value, label, color, size = 88 }: {
  value: number; label: string; color: string; size?: number;
}) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div style={{ width: size, height: size }} className="relative">
        <svg width={size} height={size} viewBox="0 0 88 88">
          {/* Background ring */}
          <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
          {/* Value arc */}
          <motion.circle
            cx="44" cy="44" r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
            transform="rotate(-90 44 44)"
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
          {/* Center text */}
          <text x="44" y="44" textAnchor="middle" dominantBaseline="central"
            fill="white" fontSize="14" fontFamily="monospace" fontWeight="700"
          >
            {value}
          </text>
          <text x="44" y="57" textAnchor="middle" fill="rgba(255,255,255,0.3)"
            fontSize="7" fontFamily="monospace" letterSpacing="1"
          >
            /100
          </text>
        </svg>
      </div>
      <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">{label}</span>
    </div>
  );
}

// ── AI Messages ───────────────────────────────────────────────────

function AIMessageItem({ msg }: { msg: AIMessage }) {
  const icons = {
    success: CheckCircle,
    warning: AlertTriangle,
    danger: AlertCircle,
    info: Info,
  };
  const colors = {
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
    info: "#00dcff",
  };
  const Icon = icons[msg.type];
  const color = colors[msg.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-2 p-2.5 rounded-lg"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
    >
      <Icon size={12} style={{ color, flexShrink: 0, marginTop: 1, filter: `drop-shadow(0 0 4px ${color})` }} />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] leading-relaxed text-white/70">{msg.text}</p>
        <span className="text-[9px] font-mono text-white/25 mt-0.5 block">{msg.timestamp}</span>
      </div>
    </motion.div>
  );
}

// ── Main Right Panel ──────────────────────────────────────────────

interface RightPanelProps {
  data: MockDriverData;
  aiMessages: AIMessage[];
}

export default function RightPanel({ data, aiMessages }: RightPanelProps) {
  return (
    <div className="flex flex-col gap-4 h-full overflow-y-auto scrollbar-hide">

      {/* Status Orb */}
      <div className="glass-card flex items-center justify-around py-4">
        <StatusOrb status={data.status} />
        <div className="flex flex-col gap-4">
          <CircularMeter value={data.fatigueScore} label="Fatigue" color="#ef4444" />
        </div>
        <div className="flex flex-col gap-4">
          <CircularMeter value={data.attentionScore} label="Attention" color="#00dcff" />
        </div>
      </div>

      {/* Safety Score */}
      <div className="glass-card p-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">AI Safety Score</span>
          <div className="text-[9px] font-mono text-green-400/60 tracking-wider">EXCELLENT</div>
        </div>
        <div className="flex items-end gap-2">
          <motion.span
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-4xl font-bold font-mono text-white"
            style={{ textShadow: "0 0 20px rgba(0,220,255,0.3)" }}
          >
            {data.safetyScore}
          </motion.span>
          <span className="text-sm font-mono text-white/30 mb-1">/100</span>
          <div className="flex-1 mb-2">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
              <motion.div
                animate={{ width: `${data.safetyScore}%` }}
                transition={{ duration: 1 }}
                className="h-full rounded-full"
                style={{
                  background: "linear-gradient(90deg, #22c55e, #00dcff)",
                  boxShadow: "0 0 8px rgba(0,220,255,0.4)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Mini stats row */}
        <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/05">
          {[
            { label: "Speed", value: `${data.speed} km/h`, color: "#00dcff" },
            { label: "Heart Rate", value: `${data.heartRate} bpm`, color: "#a855f7" },
            { label: "Trip", value: `${data.tripDuration}m`, color: "#22c55e" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="text-[11px] font-mono font-semibold" style={{ color }}>{value}</div>
              <div className="text-[9px] font-mono text-white/30 tracking-wider mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver State Panel */}
      <div className="glass-card p-4">
        <div className="text-[10px] font-mono tracking-widest text-white/40 uppercase mb-3">Driver State</div>
        <div className="space-y-2">
          {[
            { label: "Blink Rate", value: data.blinkCount, unit: "/min", max: 30, warn: 20, color: "#00dcff" },
            { label: "Yawn Count", value: data.yawnCount, unit: "total", max: 10, warn: 3, color: "#f97316" },
            { label: "Eye Openness", value: data.eyeOpenness, unit: "%", max: 100, warn: 60, color: "#22c55e" },
          ].map(({ label, value, unit, max, warn, color }) => {
            const pct = Math.round((value / max) * 100);
            const isWarn = value >= warn;
            return (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-white/50">{label}</span>
                  <span className="text-[11px] font-mono" style={{ color: isWarn && label !== "Eye Openness" ? "#f97316" : color }}>
                    {value} {unit}
                  </span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <motion.div
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8 }}
                    className="h-full rounded-full"
                    style={{
                      background: isWarn && label !== "Eye Openness"
                        ? "linear-gradient(90deg, #f97316, #ef4444)"
                        : `linear-gradient(90deg, ${color}aa, ${color})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Messages */}
      <div className="glass-card p-4 flex-1">
        <div className="flex items-center gap-2 mb-3">
          <Brain size={13} className="text-purple-400" style={{ filter: "drop-shadow(0 0 4px #a855f7)" }} />
          <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">AI Assistant</span>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400"
            style={{ boxShadow: "0 0 6px #a855f7" }}
          />
        </div>
        <div className="space-y-2">
          {aiMessages.map((msg) => (
            <AIMessageItem key={msg.id} msg={msg} />
          ))}
        </div>
      </div>
    </div>
  );
}
