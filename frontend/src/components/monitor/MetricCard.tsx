"use client";

import { motion } from "framer-motion";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: string;
  color: "blue" | "green" | "red" | "yellow" | "purple" | "orange";
  subLabel?: string;
  progress?: number; // 0–100 for optional progress bar
  progressColor?: string;
  alert?: boolean;
}

const COLOR_MAP = {
  blue:   { bg: "bg-blue-50",   border: "border-blue-100",   iconBg: "bg-blue-100",   value: "text-blue-700",   bar: "bg-blue-500"   },
  green:  { bg: "bg-green-50",  border: "border-green-100",  iconBg: "bg-green-100",  value: "text-green-700",  bar: "bg-green-500"  },
  red:    { bg: "bg-red-50",    border: "border-red-100",    iconBg: "bg-red-100",    value: "text-red-700",    bar: "bg-red-500"    },
  yellow: { bg: "bg-yellow-50", border: "border-yellow-100", iconBg: "bg-yellow-100", value: "text-yellow-700", bar: "bg-yellow-500" },
  purple: { bg: "bg-purple-50", border: "border-purple-100", iconBg: "bg-purple-100", value: "text-purple-700", bar: "bg-purple-500" },
  orange: { bg: "bg-orange-50", border: "border-orange-100", iconBg: "bg-orange-100", value: "text-orange-700", bar: "bg-orange-500" },
};

export default function MetricCard({
  label, value, unit, icon, color, subLabel, progress, alert,
}: MetricCardProps) {
  const c = COLOR_MAP[color];

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
      transition={{ duration: 0.2 }}
      className={`rounded-xl border p-4 flex flex-col gap-3 bg-white ${alert ? "border-red-300" : "border-gray-200"}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0 ${c.iconBg}`}>
          {icon}
        </div>
        {alert && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full"
          >
            ALERT
          </motion.span>
        )}
      </div>

      {/* Value */}
      <div>
        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-bold ${c.value}`}>{value}</span>
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
        <div className="text-sm text-gray-500 mt-0.5">{label}</div>
        {subLabel && <div className="text-xs text-gray-400 mt-0.5">{subLabel}</div>}
      </div>

      {/* Progress bar */}
      {progress !== undefined && (
        <div className="space-y-1">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${c.bar}`}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      )}
    </motion.div>
  );
}
