"use client";

import { motion } from "framer-motion";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  generateBlinkHistory, generateAttentionHistory, generateFatigueHistory,
  TRIP_TIMELINE, DRIVING_INSIGHTS,
} from "@/constants/mockData";
import { Eye, Brain, Zap, Clock, Shield, AlertTriangle } from "lucide-react";

// ── Custom Tooltip ─────────────────────────────────────────────────

function CyberTooltip({ active, payload, label, color }: {
  active?: boolean; payload?: any; label?: any; color: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg font-mono text-xs"
      style={{
        background: "rgba(5,5,20,0.95)",
        border: `1px solid ${color}40`,
        boxShadow: `0 0 16px ${color}20`,
      }}
    >
      <div style={{ color }} className="font-bold">{payload[0].value}</div>
      <div className="text-white/30 text-[9px]">{label}</div>
    </div>
  );
}

// ── Chart Card ─────────────────────────────────────────────────────

function ChartCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-[12px] font-semibold text-white/80 tracking-wider">{title}</div>
          {subtitle && <div className="text-[9px] font-mono text-white/30 tracking-widest mt-0.5">{subtitle}</div>}
        </div>
        <motion.div
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full mt-1"
          style={{ background: "#00dcff", boxShadow: "0 0 6px #00dcff" }}
        />
      </div>
      {children}
    </div>
  );
}

// ── Insights Icon Map ──────────────────────────────────────────────

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  eye: Eye, brain: Brain, alert: AlertTriangle, yawn: Zap, clock: Clock, shield: Shield,
};

const INSIGHT_COLORS: Record<string, string> = {
  normal: "#22c55e",
  warning: "#eab308",
  info: "#00dcff",
};

// ── Main Bottom Panel ─────────────────────────────────────────────

export default function BottomPanel() {
  const blinkData = generateBlinkHistory();
  const attentionData = generateAttentionHistory();
  const fatigueData = generateFatigueHistory();

  return (
    <div className="flex flex-col gap-4">
      {/* Row 1: 3 charts */}
      <div className="grid grid-cols-3 gap-4">
        {/* Blink Frequency */}
        <ChartCard title="Blink Frequency" subtitle="BLINKS PER MINUTE · REAL-TIME">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={blinkData} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip content={(p) => <CyberTooltip {...p} color="#00dcff" />} />
              <ReferenceLine y={18} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
              <Bar dataKey="value" fill="url(#blinkGrad)" radius={[3, 3, 0, 0]} />
              <defs>
                <linearGradient id="blinkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00dcff" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#0040ff" stopOpacity={0.3} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Attention History */}
        <ChartCard title="Attention Score" subtitle="FOCUS PERCENTAGE · LAST 45 MIN">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={attentionData}>
              <defs>
                <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} hide />
              <Tooltip content={(p) => <CyberTooltip {...p} color="#a855f7" />} />
              <ReferenceLine y={75} stroke="rgba(239,68,68,0.3)" strokeDasharray="4 4" />
              <Area type="monotone" dataKey="value" stroke="#a855f7" strokeWidth={2} fill="url(#attnGrad)"
                style={{ filter: "drop-shadow(0 0 4px #a855f7)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Fatigue Trend */}
        <ChartCard title="Fatigue Trend" subtitle="FATIGUE INDEX · LAST 45 MIN">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={fatigueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 8, fontFamily: "monospace" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 60]} hide />
              <Tooltip content={(p) => <CyberTooltip {...p} color="#ef4444" />} />
              <ReferenceLine y={30} stroke="rgba(239,68,68,0.4)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="value" stroke="#ef4444" strokeWidth={2} dot={false}
                style={{ filter: "drop-shadow(0 0 4px #ef4444)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row 2: Insights + Timeline */}
      <div className="grid grid-cols-2 gap-4">
        {/* Driving Insights */}
        <div className="glass-card p-4">
          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-3">Driving Insights</div>
          <div className="grid grid-cols-3 gap-3">
            {DRIVING_INSIGHTS.map(({ label, value, status, icon }) => {
              const Icon = INSIGHT_ICONS[icon] || Zap;
              const color = INSIGHT_COLORS[status] || "#00dcff";
              return (
                <motion.div
                  key={label}
                  whileHover={{ scale: 1.04, y: -2 }}
                  className="flex flex-col gap-1 p-3 rounded-xl cursor-default"
                  style={{
                    background: `${color}08`,
                    border: `1px solid ${color}20`,
                  }}
                >
                  <Icon size={13} style={{ color, filter: `drop-shadow(0 0 3px ${color})` }} />
                  <div className="text-[13px] font-bold font-mono" style={{ color }}>{value}</div>
                  <div className="text-[9px] font-mono text-white/35 tracking-wider leading-tight">{label}</div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Trip Timeline */}
        <div className="glass-card p-4">
          <div className="text-[11px] font-mono tracking-widest text-white/40 uppercase mb-3">Trip Timeline</div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-0 bottom-0 w-px" style={{ background: "rgba(0,200,255,0.1)" }} />

            <div className="space-y-3">
              {TRIP_TIMELINE.map(({ id, time, event, type }) => {
                const dotColors = {
                  normal: "#22c55e",
                  warning: "#eab308",
                  alert: "#ef4444",
                  info: "#00dcff",
                };
                const color = dotColors[type];
                return (
                  <div key={id} className="flex items-start gap-4 pl-2">
                    <div className="relative shrink-0 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full"
                        style={{ background: color, boxShadow: `0 0 6px ${color}`, position: "relative", zIndex: 1 }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex gap-2 items-baseline">
                        <span className="text-[9px] font-mono shrink-0" style={{ color }}>{time}</span>
                        <span className="text-[10px] text-white/55 leading-tight">{event}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
