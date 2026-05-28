"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, Wifi, BatteryMedium, Clock } from "lucide-react";
import type { MockDriverData, DriverStatus } from "@/constants/mockData";
import { STATUS_COLORS } from "@/constants/mockData";

interface TopbarProps {
  data: MockDriverData;
  alertCount: number;
  onAlertClick: () => void;
}

function LiveClock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString("en-US", { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="font-mono text-[11px] text-cyan-400/60 tracking-widest">{time}</span>;
}

export default function Topbar({ data, alertCount, onAlertClick }: TopbarProps) {
  const colors = STATUS_COLORS[data.status];

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-between px-6 py-3 shrink-0"
      style={{
        background: "rgba(0,0,0,0.6)",
        borderBottom: "1px solid rgba(0,200,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-white/25 tracking-wider">AI·DMS</span>
          <span className="text-[11px] text-white/15">/</span>
          <span className="text-[11px] font-mono text-cyan-400/70 tracking-wider">DASHBOARD</span>
        </div>

        <div className="h-3 w-px bg-white/08" />

        {/* Vehicle + Driver */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] font-mono text-white/25">{data.vehicleId}</div>
          <div className="text-[10px] font-mono text-white/15">·</div>
          <div className="text-[10px] font-mono text-white/40">{data.driverId}</div>
        </div>
      </div>

      {/* Center: Status pill */}
      <motion.div
        animate={{ boxShadow: [`0 0 0px ${colors.glow}00`, `0 0 20px ${colors.glow}40`, `0 0 0px ${colors.glow}00`] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="flex items-center gap-2 px-4 py-1.5 rounded-full"
        style={{
          background: `${colors.glow}12`,
          border: `1px solid ${colors.glow}30`,
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: colors.glow, boxShadow: `0 0 6px ${colors.glow}` }}
        />
        <span className={`text-[10px] font-mono tracking-[0.2em] font-semibold uppercase ${colors.text}`}>
          {data.status === "SAFE" ? "ALL SYSTEMS NOMINAL" : `ALERT: ${data.status}`}
        </span>
      </motion.div>

      {/* Right: Controls */}
      <div className="flex items-center gap-4">
        <LiveClock />

        <div className="flex items-center gap-1.5">
          <Wifi size={13} className="text-cyan-400/40" />
          <span className="text-[10px] font-mono text-white/25">4G</span>
        </div>

        <div className="flex items-center gap-1.5">
          <BatteryMedium size={13} className="text-green-400/40" />
          <span className="text-[10px] font-mono text-white/25">87%</span>
        </div>

        {/* Distance / Trip */}
        <div className="text-[10px] font-mono text-white/30">
          {data.distanceTraveled.toFixed(1)} km
        </div>

        {/* Alert bell */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAlertClick}
          className="relative w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
          style={{
            background: alertCount > 0 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
            border: alertCount > 0 ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Bell size={14} className={alertCount > 0 ? "text-red-400" : "text-white/30"} />
          {alertCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold text-white flex items-center justify-center"
              style={{ boxShadow: "0 0 8px rgba(239,68,68,0.6)" }}
            >
              {alertCount}
            </span>
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}
