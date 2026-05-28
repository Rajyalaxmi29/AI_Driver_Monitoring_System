"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import type { DriverStatus } from "@/constants/mockData";

interface AlertPopupProps {
  status: DriverStatus;
  show: boolean;
  onDismiss: () => void;
}

const ALERT_CONFIG: Record<string, { title: string; message: string; color: string }> = {
  WARNING: {
    title: "⚠ DRIVER WARNING",
    message: "Attention level dropping. Please stay focused on the road.",
    color: "#eab308",
  },
  DROWSY: {
    title: "🚨 DROWSINESS ALERT",
    message: "Critical: Driver showing signs of drowsiness. Pull over immediately.",
    color: "#ef4444",
  },
  DISTRACTED: {
    title: "⚡ DISTRACTION DETECTED",
    message: "Driver attention deviation detected. Refocus on driving.",
    color: "#f97316",
  },
};

export default function AlertPopup({ status, show, onDismiss }: AlertPopupProps) {
  const config = ALERT_CONFIG[status];
  const shakeAnim = status === "DROWSY";

  if (!config) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.95 }}
          animate={shakeAnim
            ? {
                opacity: 1, y: 0, scale: 1,
                x: [0, -6, 6, -4, 4, -2, 2, 0],
              }
            : { opacity: 1, y: 0, scale: 1 }
          }
          exit={{ opacity: 0, y: -30, scale: 0.95 }}
          transition={{ duration: 0.4, x: { delay: 0.4, duration: 0.5 } }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-[420px] max-w-[90vw]"
        >
          <motion.div
            animate={{
              boxShadow: [
                `0 0 0px ${config.color}00`,
                `0 0 40px ${config.color}60`,
                `0 0 0px ${config.color}00`,
              ],
            }}
            transition={{ duration: 1, repeat: Infinity }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: "rgba(5,5,20,0.97)",
              border: `1px solid ${config.color}50`,
            }}
          >
            {/* Top glow strip */}
            <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }} />

            {/* Pulsing border overlay */}
            <motion.div
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ border: `2px solid ${config.color}`, borderRadius: "1rem" }}
            />

            <div className="p-5">
              <div className="flex items-start gap-3">
                {/* Icon */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${config.color}20`, border: `1px solid ${config.color}40` }}
                >
                  <AlertTriangle size={18} style={{ color: config.color, filter: `drop-shadow(0 0 6px ${config.color})` }} />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold font-mono tracking-wider" style={{ color: config.color }}>
                    {config.title}
                  </div>
                  <div className="text-xs text-white/65 mt-1 leading-relaxed">{config.message}</div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={onDismiss}
                      className="px-4 py-1.5 rounded-lg text-[11px] font-mono font-semibold tracking-wider transition-all hover:opacity-80"
                      style={{
                        background: `${config.color}25`,
                        border: `1px solid ${config.color}40`,
                        color: config.color,
                      }}
                    >
                      ACKNOWLEDGE
                    </button>
                    <button
                      className="px-4 py-1.5 rounded-lg text-[11px] font-mono text-white/40 border border-white/08 hover:border-white/15 transition-all"
                    >
                      DISMISS
                    </button>
                  </div>
                </div>

                {/* Close */}
                <button onClick={onDismiss} className="shrink-0 text-white/25 hover:text-white/60 transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
