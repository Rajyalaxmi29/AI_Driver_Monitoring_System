"use client";

import {
  ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine,
  ResponsiveContainer, Legend,
} from "recharts";
import type { HistoryPoint } from "@/services/driverData";

// ── Custom Tooltip ────────────────────────────────────────────────

function CustomTooltip({ active, payload, label, unit, color }: {
  active?: boolean;
  payload?: any;
  label?: any;
  unit?: string;
  color: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1 font-mono">{label}</p>
      <p className="font-bold text-base" style={{ color }}>
        {payload[0].value}
        <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
      </p>
    </div>
  );
}

// ── Custom dot for the latest point ──────────────────────────────

function LastDot(props: {
  cx?: number; cy?: number; index?: number;
  value?: number; dataLength: number; color: string;
}) {
  const { cx, cy, index, dataLength, color } = props;
  if (index !== dataLength - 1 || !cx || !cy) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={5} fill={color} stroke="white" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={9} fill={color} fillOpacity={0.2} />
    </g>
  );
}

// ── Single chart card ─────────────────────────────────────────────

function ChartCard({ title, subtitle, children, badge, badgeColor }: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  badge?: string;
  badgeColor?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-800">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        {badge && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: badgeColor }}
          >
            {badge}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

// ── Reference zone (colored background band) ──────────────────────

function ReferenceZone({ y1, y2, color }: { y1: number; y2: number; color: string }) {
  return (
    <ReferenceLine
      y={(y1 + y2) / 2}
      stroke="none"
      label=""
    />
  );
}

// ── Main component ────────────────────────────────────────────────

interface LiveChartsProps {
  drowsinessHistory: HistoryPoint[];
  attentionHistory: HistoryPoint[];
  blinkHistory: HistoryPoint[];
}

export default function LiveCharts({
  drowsinessHistory,
  attentionHistory,
  blinkHistory,
}: LiveChartsProps) {
  const dLen = drowsinessHistory.length;
  const aLen = attentionHistory.length;
  const bLen = blinkHistory.length;

  // Show only last label of every 5 ticks to avoid cluttering X-axis
  const xTickFormatter = (val: string, idx: number, data: HistoryPoint[]) => {
    if (idx % 5 === 0 || idx === data.length - 1) return val;
    return "";
  };

  return (
    <div className="grid grid-cols-3 gap-4">

      {/* ── 1. Drowsiness Level ── */}
      <ChartCard
        title="Drowsiness Level"
        subtitle="Real-time trend — lower is safer"
        badge="LIVE"
        badgeColor="#ef4444"
      >
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={drowsinessHistory} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="drowGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={26}
              ticks={[0, 25, 40, 65, 100]}
            />

            <Tooltip content={(p) => (
              <CustomTooltip {...p} unit="%" color="#ef4444" />
            )} />

            {/* Safe zone: 0–40 */}
            <ReferenceLine y={40}  stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "⚠ Warning (40)", position: "insideTopRight", fontSize: 9, fill: "#f59e0b", dy: -4 }}
            />
            {/* Critical zone: 65+ */}
            <ReferenceLine y={65}  stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "🚨 Critical (65)", position: "insideTopRight", fontSize: 9, fill: "#ef4444", dy: -4 }}
            />

            <Area
              type="monotoneX"
              dataKey="value"
              stroke="#ef4444"
              strokeWidth={2.5}
              fill="url(#drowGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#ef4444", stroke: "white", strokeWidth: 2 }}
              animationDuration={300}
            />

            {/* Animated dot on the latest point */}
            <Line
              type="monotoneX"
              dataKey="value"
              stroke="transparent"
              dot={(props) => <LastDot {...props} dataLength={dLen} color="#ef4444" />}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-green-400 rounded" /> 0–40 Safe
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-yellow-400 rounded" style={{ borderStyle: "dashed" }} /> 40–65 Warning
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-400 rounded" /> 65+ Critical
          </span>
        </div>
      </ChartCard>

      {/* ── 2. Attention Score ── */}
      <ChartCard
        title="Attention Score"
        subtitle="Focus percentage — higher is better"
        badge="LIVE"
        badgeColor="#8b5cf6"
      >
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={attentionHistory} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="attnGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={26}
              ticks={[0, 55, 70, 85, 100]}
            />

            <Tooltip content={(p) => (
              <CustomTooltip {...p} unit="%" color="#8b5cf6" />
            )} />

            <ReferenceLine y={70} stroke="#f59e0b" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "⚠ Low (70)", position: "insideTopLeft", fontSize: 9, fill: "#f59e0b", dy: -4 }}
            />
            <ReferenceLine y={55} stroke="#ef4444" strokeDasharray="5 3" strokeWidth={1.5}
              label={{ value: "🚨 Critical (55)", position: "insideTopLeft", fontSize: 9, fill: "#ef4444", dy: -4 }}
            />

            <Area
              type="monotoneX"
              dataKey="value"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              fill="url(#attnGrad)"
              dot={false}
              activeDot={{ r: 5, fill: "#8b5cf6", stroke: "white", strokeWidth: 2 }}
              animationDuration={300}
            />

            <Line
              type="monotoneX"
              dataKey="value"
              stroke="transparent"
              dot={(props) => <LastDot {...props} dataLength={aLen} color="#8b5cf6" />}
              activeDot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-green-400 rounded" /> 70–100 Good
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-yellow-400 rounded" /> 55–70 Low
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-400 rounded" /> &lt;55 Critical
          </span>
        </div>
      </ChartCard>

      {/* ── 3. Blink Rate ── */}
      <ChartCard
        title="Blink Rate"
        subtitle="Blinks per minute — normal range: 12–20"
        badge="LIVE"
        badgeColor="#3b82f6"
      >
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={blinkHistory} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="blinkGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.5} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />

            <XAxis
              dataKey="time"
              tick={{ fontSize: 9, fill: "#9ca3af", fontFamily: "monospace" }}
              axisLine={false}
              tickLine={false}
              interval={4}
            />
            <YAxis
              domain={[0, 35]}
              tick={{ fontSize: 9, fill: "#9ca3af" }}
              axisLine={false}
              tickLine={false}
              width={26}
              ticks={[0, 8, 12, 20, 25, 35]}
            />

            <Tooltip content={(p) => (
              <CustomTooltip {...p} unit=" bpm" color="#3b82f6" />
            )} />

            {/* Normal zone boundaries */}
            <ReferenceLine y={12} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "Min (12)", position: "insideTopLeft", fontSize: 9, fill: "#22c55e", dy: -4 }}
            />
            <ReferenceLine y={20} stroke="#22c55e" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "Max (20)", position: "insideTopRight", fontSize: 9, fill: "#22c55e", dy: -4 }}
            />
            <ReferenceLine y={8}  stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "⚠ Very Low (8)", position: "insideTopLeft", fontSize: 9, fill: "#ef4444", dy: 10 }}
            />
            <ReferenceLine y={25} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.5}
              label={{ value: "⚠ High (25)", position: "insideTopRight", fontSize: 9, fill: "#f59e0b", dy: 10 }}
            />

            {/* Bar for current blink rate */}
            <Bar
              dataKey="value"
              fill="url(#blinkGrad)"
              stroke="#3b82f6"
              strokeWidth={1}
              radius={[3, 3, 0, 0]}
              maxBarSize={16}
              animationDuration={300}
            />

            {/* Line overlay for trend */}
            <Line
              type="monotoneX"
              dataKey="value"
              stroke="#1d4ed8"
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: "#1d4ed8" }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="flex items-center gap-4 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-green-400 rounded" /> 12–20 Normal
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-yellow-400 rounded" /> 20–25 Elevated
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-red-400 rounded" /> &lt;8 or &gt;25 Alert
          </span>
        </div>
      </ChartCard>

    </div>
  );
}
