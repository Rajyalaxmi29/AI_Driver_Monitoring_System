"use client";

import { motion } from "framer-motion";
import type { DriverStatus } from "@/services/driverData";

const STATUS_MAP = {
  SAFE: {
    label: "SAFE",
    description: "Driver is alert and focused.",
    bg: "bg-green-50",
    border: "border-green-200",
    iconBg: "bg-green-100",
    textColor: "text-green-700",
    badgeBg: "bg-green-600",
    dot: "bg-green-500",
    icon: "✅",
  },
  WARNING: {
    label: "WARNING",
    description: "Slight drowsiness detected. Stay alert.",
    bg: "bg-yellow-50",
    border: "border-yellow-200",
    iconBg: "bg-yellow-100",
    textColor: "text-yellow-700",
    badgeBg: "bg-yellow-500",
    dot: "bg-yellow-500",
    icon: "⚠️",
  },
  DROWSY: {
    label: "DROWSY",
    description: "High drowsiness! Please pull over and rest.",
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    textColor: "text-red-700",
    badgeBg: "bg-red-600",
    dot: "bg-red-500",
    icon: "🚨",
  },
  DISTRACTED: {
    label: "DISTRACTED",
    description: "Driver attention is low. Focus on the road.",
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    textColor: "text-orange-700",
    badgeBg: "bg-orange-500",
    dot: "bg-orange-500",
    icon: "👁️",
  },
};

interface StatusBannerProps {
  status: DriverStatus;
  connected: boolean;
  phoneDetected?: boolean;
  isOnBreak?: boolean;
}

export default function StatusBanner({ status, connected, phoneDetected, isOnBreak }: StatusBannerProps) {
  let cfg = STATUS_MAP[status];

  if (isOnBreak) {
    cfg = {
      label: "ON BREAK",
      description: "☕ Driver is taking a rest break. Safety monitoring and telemetry ticks are paused.",
      bg: "bg-blue-50 border-blue-200",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      textColor: "text-blue-700",
      badgeBg: "bg-blue-600",
      dot: "bg-blue-500",
      icon: "☕",
    };
  } else if (phoneDetected) {
    cfg = {
      label: "DISTRACTED (PHONE)",
      description: "📱 Mobile phone usage detected! Put your phone away and focus on the road.",
      bg: "bg-red-50/90 animate-pulse",
      border: "border-red-400",
      iconBg: "bg-red-100",
      textColor: "text-red-700 font-bold",
      badgeBg: "bg-red-600",
      dot: "bg-red-500",
      icon: "📱",
    };
  }

  return (
    <motion.div
      layout
      animate={
        !isOnBreak && status === "DROWSY"
          ? { boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 6px rgba(239,68,68,0.15)", "0 0 0 0 rgba(239,68,68,0)"] }
          : {}
      }
      transition={{ duration: 1.5, repeat: Infinity }}
      className={`rounded-xl border-2 p-5 flex items-center gap-5 ${cfg.bg} ${cfg.border}`}
    >
      {/* Icon */}
      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 ${cfg.iconBg}`}>
        {cfg.icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold text-white px-2.5 py-0.5 rounded-full ${cfg.badgeBg}`}>
            {cfg.label}
          </span>
          {status === "DROWSY" && (
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.7, repeat: Infinity }}
              className="text-xs font-semibold text-red-600"
            >
              ⚡ ALERT ACTIVE
            </motion.span>
          )}
        </div>
        <p className={`text-sm font-medium ${cfg.textColor}`}>{cfg.description}</p>
      </div>

      {/* Connection badge */}
      <div className="shrink-0 flex items-center gap-1.5 text-xs">
        <motion.div
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-300"}`}
        />
        <span className={connected ? "text-green-600 font-medium" : "text-gray-400"}>
          {connected ? "Live" : "Demo"}
        </span>
      </div>
    </motion.div>
  );
}
