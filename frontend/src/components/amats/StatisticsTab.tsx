"use client";

import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from "recharts";
import type { MockDriverData } from "@/constants/mockData";
import { Clock, Bell, TrendingDown, Shield } from "lucide-react";

// ── Mock data for charts ──────────────────────────────────────────

const weeklyAlerts = [
  { day: "Mon", alerts: 2 },
  { day: "Tue", alerts: 1 },
  { day: "Wed", alerts: 4 },
  { day: "Thu", alerts: 4 },
  { day: "Fri", alerts: 1 },
  { day: "Sat", alerts: 2 },
  { day: "Sun", alerts: 2 },
];

const drowsinessByTime = [
  { time: "6AM",  value: 20 },
  { time: "8AM",  value: 15 },
  { time: "10AM", value: 18 },
  { time: "12PM", value: 28 },
  { time: "2PM",  value: 32 },
  { time: "4PM",  value: 27 },
  { time: "6PM",  value: 22 },
  { time: "8PM",  value: 38 },
  { time: "10PM", value: 55 },
];

const alertTypes = [
  { name: "Eyes Closed", value: 41, color: "#ef4444" },
  { name: "Slow Blinks",  value: 30, color: "#f59e0b" },
  { name: "Head Nod",     value: 15, color: "#6366f1" },
  { name: "Micro Sleep",  value: 10, color: "#06b6d4" },
  { name: "Other",        value: 4,  color: "#94a3b8" },
];

const weeklyDriving = [
  { day: "Mon", hours: 5.2, drowsiness: 18 },
  { day: "Tue", hours: 8.1, drowsiness: 27 },
  { day: "Wed", hours: 6.5, drowsiness: 22 },
  { day: "Thu", hours: 3.2, drowsiness: 12 },
  { day: "Fri", hours: 7.8, drowsiness: 25 },
  { day: "Sat", hours: 4.1, drowsiness: 15 },
  { day: "Sun", hours: 3.7, drowsiness: 14 },
];

const recentSessions = [
  { date: "Today, 2:30 PM",     duration: "1h 45m",  alerts: 2, maxDrowsiness: "48%", status: "Completed",  statusColor: "bg-green-500" },
  { date: "Yesterday, 8:15 AM", duration: "5h 20m",  alerts: 1, maxDrowsiness: "32%", status: "Completed",  statusColor: "bg-green-500" },
  { date: "Dec 8, 6:45 PM",     duration: "2h 10m",  alerts: 4, maxDrowsiness: "88%", status: "High Risk",  statusColor: "bg-red-600" },
];

// ── Stat Card ────────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <div className="text-xs text-gray-500 mb-0.5">{label}</div>
        <div className="text-xl font-bold text-gray-900">{value}</div>
        {sub && (
          <span className="text-[10px] font-semibold px-2 py-0.5 bg-gray-900 text-white rounded mt-1 inline-block">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Chart card wrapper ────────────────────────────────────────────

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <span className="text-gray-400">📅</span>
        {title}
      </div>
      {children}
    </div>
  );
}

// ── Custom Tooltip ────────────────────────────────────────────────

function SimpleTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-700 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {p.value}</div>
      ))}
    </div>
  );
}

// ── Statistics Tab ────────────────────────────────────────────────

export default function StatisticsTab({ data }: { data: MockDriverData }) {
  return (
    <div className="mt-4 space-y-4">
      {/* Top stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard icon={Clock}      label="Total Driving Time" value="37.6 hours" color="bg-blue-500" />
        <StatCard icon={Bell}       label="Total Alerts"       value="13"         sub="this week" color="bg-orange-500" />
        <StatCard icon={TrendingDown} label="Avg Drowsiness"   value={`${data.fatigueScore}%`} sub="Normal" color="bg-yellow-500" />
        <StatCard icon={Shield}     label="Safety Score"       value={`${data.safetyScore}/10`} color="bg-purple-500" />
      </div>

      {/* Row: Weekly Alerts + Drowsiness by Time */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Weekly Alert Summary">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyAlerts} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<SimpleTooltip />} />
              <Bar dataKey="alerts" name="Alerts" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Drowsiness by Time of Day">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={drowsinessByTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="time" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<SimpleTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                name="Drowsiness %"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ fill: "#f59e0b", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Row: Alert Types + Weekly Driving vs Drowsiness */}
      <div className="grid grid-cols-2 gap-4">
        <ChartCard title="Alert Types Distribution">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="55%" height={200}>
              <PieChart>
                <Pie
                  data={alertTypes}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {alertTypes.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {alertTypes.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-xs text-gray-600">{item.name} {item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

        <ChartCard title="Weekly Driving Time vs Average Drowsiness">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyDriving}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="hours" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="drowsy" orientation="right" tick={{ fill: "#9ca3af", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<SimpleTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#6b7280" }} />
              <Bar yAxisId="hours" dataKey="hours" name="Drive Hours" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={18} />
              <Bar yAxisId="drowsy" dataKey="drowsiness" name="Drowsiness %" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Sessions Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="text-sm font-semibold text-gray-700 mb-4">Recent Driving Sessions</div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["Date", "Duration", "Alerts", "Max Drowsiness", "Status"].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 pb-3 pr-4">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentSessions.map((session, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 pr-4 text-sm text-gray-700">{session.date}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{session.duration}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{session.alerts}</td>
                <td className="py-3 pr-4 text-sm text-gray-700">{session.maxDrowsiness}</td>
                <td className="py-3 pr-4">
                  <span className={`text-[11px] font-bold text-white px-2.5 py-1 rounded ${session.statusColor}`}>
                    {session.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
