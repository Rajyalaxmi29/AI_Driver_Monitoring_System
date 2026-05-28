"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wifi, Clock, Eye, Activity } from "lucide-react";
import type { MockDriverData, AIMessage } from "@/constants/mockData";

// ── Camera Feed ───────────────────────────────────────────────────

function CameraFeed({ data }: { data: MockDriverData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;

    const draw = () => {
      const W = (canvas.width = canvas.offsetWidth);
      const H = (canvas.height = canvas.offsetHeight);
      ctx.clearRect(0, 0, W, H);

      // Dark background
      ctx.fillStyle = "#111827";
      ctx.fillRect(0, 0, W, H);

      // Subtle grid
      ctx.strokeStyle = "rgba(255,255,255,0.03)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Face silhouette
      const fx = W / 2, fy = H * 0.42;
      const faceW = W * 0.18, faceH = H * 0.38;

      // Draw face oval (dark gray body/shoulders)
      ctx.fillStyle = "rgba(80,90,110,0.35)";
      ctx.beginPath();
      ctx.ellipse(fx, fy + faceH * 0.6, faceW * 1.4, faceH * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face oval
      ctx.fillStyle = "rgba(100,115,135,0.5)";
      ctx.beginPath();
      ctx.ellipse(fx, fy, faceW, faceH, 0, 0, Math.PI * 2);
      ctx.fill();

      // Face detection bounding box (blue, like the reference)
      const bx = fx - faceW * 1.05;
      const by = fy - faceH * 1.1;
      const bw = faceW * 2.1;
      const bh = faceH * 2.2;

      ctx.strokeStyle = "rgba(59,130,246,0.85)";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(bx, by, bw, bh);

      // Eye tracking dots
      if (data.eyesOpen) {
        const ey = fy - faceH * 0.15;
        const elx = fx - faceW * 0.38, erx = fx + faceW * 0.38;
        [[elx, ey], [erx, ey]].forEach(([ex, eyy]) => {
          // Eye white
          ctx.fillStyle = "rgba(200,215,235,0.7)";
          ctx.beginPath();
          ctx.ellipse(ex, eyy, faceW * 0.15, faceH * 0.07, 0, 0, Math.PI * 2);
          ctx.fill();
          // Pupil
          ctx.fillStyle = "#1e293b";
          ctx.beginPath();
          ctx.arc(ex, eyy, faceW * 0.06, 0, Math.PI * 2);
          ctx.fill();
          // Tracking circle
          ctx.strokeStyle = "rgba(34,197,94,0.8)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(ex, eyy, faceW * 0.19, 0, Math.PI * 2);
          ctx.stroke();
        });
      }

      // Scan line
      const scanY = ((t * 1.8) % H);
      const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 4);
      grad.addColorStop(0, "rgba(59,130,246,0)");
      grad.addColorStop(1, "rgba(59,130,246,0.06)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 30, W, 34);

      t++;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data.eyesOpen]);

  const borderColor = data.status === "SAFE"
    ? "#22c55e"
    : data.status === "WARNING"
    ? "#f59e0b"
    : "#ef4444";

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="text-gray-400">📷</span>
          Driver Camera Feed
        </div>
        <div className="flex items-center gap-2">
          <Wifi size={14} className="text-green-500" />
          <span className="text-[10px] font-bold bg-green-500 text-white px-2 py-0.5 rounded-full tracking-wider">
            LIVE
          </span>
        </div>
      </div>

      {/* Camera viewport */}
      <div className="relative" style={{ height: 320 }}>
        {/* Colored border based on status */}
        <div
          className="absolute inset-2 rounded-lg overflow-hidden z-10 pointer-events-none"
          style={{ border: `2px solid ${borderColor}`, boxShadow: `0 0 12px ${borderColor}40` }}
        />

        {/* Canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full rounded-lg" />

        {/* REC badge */}
        <div className="absolute top-5 right-5 z-20 flex items-center gap-1.5 bg-red-600 text-white text-[11px] font-bold px-2.5 py-1 rounded">
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-white"
          />
          REC
        </div>

        {/* Dots menu */}
        <div className="absolute top-5 left-5 z-20 flex flex-col gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          ))}
        </div>

        {/* Bottom overlay info */}
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-black/60 px-4 py-2 flex justify-between items-center">
          <div>
            <div className="text-[11px] font-semibold text-green-400">
              Face Detection: {data.faceDetected ? "Active" : "Inactive"}
            </div>
            <div className="text-[9px] text-gray-400 mt-0.5">
              Resolution: 1920×1080 &nbsp;|&nbsp; FPS: 30 &nbsp;|&nbsp; IR Enabled
            </div>
          </div>
          <div className="text-[11px] text-blue-300 font-medium">
            Eye Tracking: {data.eyesOpen ? "Open" : "Closed"}
          </div>
        </div>
      </div>

      {/* Footer info bar */}
      <div className="px-4 py-2 flex justify-between items-center text-[11px] border-t border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3 text-gray-500">
          <span>IR Night Vision: On</span>
          <span>·</span>
          <span>Face Detection: {data.faceDetected ? "Active" : "Inactive"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-500">
          <span>Quality: HD</span>
          <span className="w-2 h-2 rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  );
}

// ── Driver Status Panel ───────────────────────────────────────────

function DriverStatusPanel({
  data,
  aiMessages,
  sessionTime,
}: {
  data: MockDriverData;
  aiMessages: AIMessage[];
  sessionTime: string;
}) {
  const statusConfig = {
    SAFE:       { label: "Alert",      badge: "bg-green-500",  text: "text-green-600",  bar: "#22c55e" },
    WARNING:    { label: "Caution",    badge: "bg-yellow-500", text: "text-yellow-600", bar: "#f59e0b" },
    DROWSY:     { label: "Drowsy",     badge: "bg-red-600",    text: "text-red-600",    bar: "#ef4444" },
    DISTRACTED: { label: "Distracted", badge: "bg-orange-500", text: "text-orange-600", bar: "#f97316" },
  };
  const cfg = statusConfig[data.status];

  const drowsinessPct = data.fatigueScore;

  return (
    <div className="flex flex-col gap-4">
      {/* Driver Status card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Activity size={14} className="text-gray-500" />
          <span className="text-sm font-semibold text-gray-700">Driver Status</span>
        </div>

        <div className="px-4 py-4 space-y-4">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Status</span>
            <span className={`text-xs font-bold px-3 py-1 rounded text-white ${cfg.badge}`}>
              {data.status === "SAFE" ? "ALERT" : data.status}
            </span>
          </div>

          {/* Drowsiness Level */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-600">Drowsiness Level</span>
              <span className="text-sm font-semibold text-gray-800">{drowsinessPct}%</span>
            </div>
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${drowsinessPct}%` }}
                transition={{ duration: 0.8 }}
                className="h-full rounded-full"
                style={{ background: cfg.bar }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-green-500 font-medium">Alert</span>
              <span className="text-[10px] text-yellow-500 font-medium">Drowsy</span>
              <span className="text-[10px] text-red-500 font-medium">Critical</span>
            </div>
          </div>

          {/* Eyes Status */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Eyes Status</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${data.eyesOpen ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`text-sm font-medium ${data.eyesOpen ? "text-green-600" : "text-red-600"}`}>
                {data.eyesOpen ? "Open" : "Closed"}
              </span>
            </div>
          </div>

          {/* Blink Rate */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Blink Rate</span>
            <span className="text-sm font-semibold text-gray-800">{data.blinkCount} bpm</span>
          </div>

          {/* Session Time */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm text-gray-600">Session Time</span>
            <div className="flex items-center gap-1.5">
              <Clock size={13} className="text-gray-400" />
              <span className="text-sm font-mono font-semibold text-gray-800">{sessionTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts card */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-700">Recent Alerts</span>
        </div>
        <div className="px-4 py-4">
          {aiMessages.filter((m) => m.type === "warning" || m.type === "danger").length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No alerts today</p>
          ) : (
            <div className="space-y-2.5">
              {aiMessages
                .filter((m) => m.type === "warning" || m.type === "danger")
                .slice(0, 4)
                .map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2.5">
                    <div
                      className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${
                        msg.type === "danger" ? "bg-red-500" : "bg-yellow-500"
                      }`}
                    />
                    <div>
                      <p className="text-xs text-gray-700 leading-snug">{msg.text}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{msg.timestamp}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick stats strip */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Speed", value: `${Math.round(data.speed)} km/h`, color: "text-blue-600" },
            { label: "Heart Rate", value: `${Math.round(data.heartRate)} bpm`, color: "text-red-500" },
            { label: "Attention", value: `${data.attentionScore}%`, color: "text-green-600" },
            { label: "Safety Score", value: `${data.safetyScore}`, color: "text-purple-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center p-2 bg-gray-50 rounded-lg">
              <div className={`text-base font-bold ${color}`}>{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Live Monitor Tab ───────────────────────────────────────────────

export default function LiveMonitorTab({
  data,
  aiMessages,
  sessionTime,
}: {
  data: MockDriverData;
  aiMessages: AIMessage[];
  sessionTime: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_300px] gap-4 mt-4">
      <CameraFeed data={data} />
      <DriverStatusPanel data={data} aiMessages={aiMessages} sessionTime={sessionTime} />
    </div>
  );
}
