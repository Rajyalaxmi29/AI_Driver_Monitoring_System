"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, AlertTriangle, User, Minus } from "lucide-react";
import type { MockDriverData } from "@/constants/mockData";

interface WebcamPanelProps {
  data: MockDriverData;
}

const DETECTION_LABELS = [
  {
    key: "faceDetected" as keyof MockDriverData,
    label: "FACE DETECTED",
    icon: User,
    color: "#00dcff",
    glow: "rgba(0,220,255,0.3)",
  },
  {
    key: "eyesOpen" as keyof MockDriverData,
    label: "EYES OPEN",
    icon: Eye,
    color: "#22c55e",
    glow: "rgba(34,197,94,0.3)",
  },
  {
    key: "drowsinessDetected" as keyof MockDriverData,
    label: "DROWSINESS",
    icon: EyeOff,
    color: "#ef4444",
    glow: "rgba(239,68,68,0.3)",
    invertActive: true,
  },
  {
    key: "yawningDetected" as keyof MockDriverData,
    label: "YAWNING",
    icon: Minus,
    color: "#f97316",
    glow: "rgba(249,115,22,0.3)",
    invertActive: true,
  },
  {
    key: "distracted" as keyof MockDriverData,
    label: "DISTRACTED",
    icon: AlertTriangle,
    color: "#a855f7",
    glow: "rgba(168,85,247,0.3)",
    invertActive: true,
  },
];

export default function WebcamPanel({ data }: WebcamPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [scanLine, setScanLine] = useState(0);

  // Fake webcam face-tracking overlay animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let t = 0;

    const draw = () => {
      const W = canvas.width = canvas.offsetWidth;
      const H = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Scanning grid lines (subtle)
      ctx.strokeStyle = "rgba(0,200,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 32) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 32) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Face bounding box (centered)
      const bx = W * 0.25, by = H * 0.1;
      const bw = W * 0.5, bh = H * 0.7;
      const pulse = Math.sin(t * 0.04) * 0.5 + 0.5;

      if (data.faceDetected) {
        // Outer glow rect
        ctx.shadowColor = data.drowsinessDetected ? "#ef4444" : "#00dcff";
        ctx.shadowBlur = 12 + pulse * 8;
        ctx.strokeStyle = data.drowsinessDetected
          ? `rgba(239,68,68,${0.5 + pulse * 0.3})`
          : `rgba(0,220,255,${0.4 + pulse * 0.3})`;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.shadowBlur = 0;

        // Corner brackets
        const cs = 20;
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = data.drowsinessDetected ? "#ef4444" : "#00dcff";
        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 6;
        // TL
        ctx.beginPath(); ctx.moveTo(bx, by + cs); ctx.lineTo(bx, by); ctx.lineTo(bx + cs, by); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(bx + bw - cs, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cs); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(bx, by + bh - cs); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cs, by + bh); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(bx + bw - cs, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cs); ctx.stroke();
        ctx.shadowBlur = 0;

        // Eye tracking dots
        const ey = by + bh * 0.32;
        const elx = bx + bw * 0.3, erx = bx + bw * 0.7;
        [[elx, ey], [erx, ey]].forEach(([ex, eyy]) => {
          // Outer ring
          ctx.beginPath();
          ctx.arc(ex, eyy, 8 + pulse * 2, 0, Math.PI * 2);
          ctx.strokeStyle = data.eyesOpen ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)";
          ctx.lineWidth = 1;
          ctx.stroke();
          // Inner dot
          ctx.beginPath();
          ctx.arc(ex, eyy, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = data.eyesOpen ? "#22c55e" : "#ef4444";
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // Nose bridge
        ctx.beginPath();
        ctx.moveTo(W / 2, ey + 6);
        ctx.lineTo(W / 2, by + bh * 0.55);
        ctx.strokeStyle = "rgba(0,200,255,0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Mouth line
        const my = by + bh * 0.68;
        ctx.beginPath();
        ctx.moveTo(bx + bw * 0.35, my);
        ctx.lineTo(bx + bw * 0.65, my);
        ctx.strokeStyle = data.yawningDetected ? "rgba(249,115,22,0.6)" : "rgba(0,200,255,0.15)";
        ctx.stroke();

        // Head pose indicator
        const posX = W / 2 + data.headPoseX * 3;
        const posY = by - 20;
        ctx.beginPath();
        ctx.arc(posX, posY, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,220,255,0.7)";
        ctx.fill();
      }

      // Scan line
      const scanY = ((t * 1.5) % H);
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 4);
      scanGrad.addColorStop(0, "rgba(0,220,255,0)");
      scanGrad.addColorStop(1, "rgba(0,220,255,0.12)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 20, W, 24);

      t++;
      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [data]);

  // Scan line for CSS layer
  useEffect(() => {
    const i = setInterval(() => setScanLine((p) => (p + 1) % 100), 16);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Main webcam container */}
      <div
        className="relative flex-1 rounded-2xl overflow-hidden"
        style={{
          background: "#050510",
          border: "1px solid rgba(0,200,255,0.12)",
          boxShadow: "0 0 40px rgba(0,0,200,0.08), inset 0 0 40px rgba(0,0,0,0.5)",
        }}
      >
        {/* "Camera" background – dark gradient simulating a feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a1a] via-[#050510] to-[#0a0510]" />

        {/* Silhouette placeholder */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="140" height="200" viewBox="0 0 140 200" fill="none" opacity="0.06">
            <ellipse cx="70" cy="60" rx="38" ry="45" fill="#00dcff" />
            <path d="M20 200 Q20 130 70 120 Q120 130 120 200Z" fill="#00dcff" />
          </svg>
        </div>

        {/* Overlay canvas */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* LIVE badge */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(239,68,68,0.4)" }}
          >
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-red-500"
              style={{ boxShadow: "0 0 6px #ef4444" }}
            />
            <span className="text-[10px] font-mono text-red-400 tracking-widest">LIVE</span>
          </div>
          <span className="text-[10px] font-mono text-white/30 tracking-wider">CAM-01 · DRIVER</span>
        </div>

        {/* Camera FPS / resolution */}
        <div className="absolute top-3 right-3 z-10 text-right">
          <div className="text-[9px] font-mono text-cyan-400/40 tracking-widest">1080p · 30fps</div>
          <div className="text-[9px] font-mono text-cyan-400/30 tracking-widest mt-0.5">AI: ACTIVE</div>
        </div>

        {/* Eye openness bar */}
        <div className="absolute bottom-3 left-3 right-3 z-10">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[9px] font-mono text-cyan-400/50 tracking-widest uppercase">Eye Openness</span>
            <span className="text-[10px] font-mono text-cyan-400">{data.eyeOpenness}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${data.eyeOpenness}%` }}
              transition={{ duration: 0.8 }}
              style={{
                background: data.eyeOpenness > 60
                  ? "linear-gradient(90deg, #0080ff, #00dcff)"
                  : "linear-gradient(90deg, #ef4444, #f97316)",
                boxShadow: `0 0 6px ${data.eyeOpenness > 60 ? "#00dcff" : "#ef4444"}`,
              }}
            />
          </div>
        </div>

        {/* Head pose mini indicator */}
        <div className="absolute bottom-12 right-3 z-10">
          <div className="text-[9px] font-mono text-white/30 tracking-wider text-right mb-1">HEAD POSE</div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(0,200,255,0.15)" }}
          >
            <div className="w-2 h-2 rounded-full bg-cyan-400"
              style={{
                transform: `translate(${data.headPoseX * 2}px, ${data.headPoseY * 2}px)`,
                boxShadow: "0 0 6px #00dcff",
              }}
            />
          </div>
        </div>
      </div>

      {/* Detection labels row */}
      <div className="grid grid-cols-5 gap-2">
        {DETECTION_LABELS.map(({ key, label, icon: Icon, color, glow, invertActive }) => {
          const rawVal = data[key] as boolean;
          const isActive = invertActive ? rawVal : rawVal;
          const isAlert = invertActive && rawVal;

          return (
            <motion.div
              key={key}
              animate={isAlert ? { boxShadow: [`0 0 0px ${glow}`, `0 0 16px ${glow}`, `0 0 0px ${glow}`] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="flex flex-col items-center gap-1 rounded-xl py-2 px-1"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${color}12, ${color}06)`
                  : "rgba(255,255,255,0.02)",
                border: `1px solid ${isActive ? color + "40" : "rgba(255,255,255,0.04)"}`,
              }}
            >
              <Icon
                size={14}
                style={{
                  color: isActive ? color : "rgba(255,255,255,0.2)",
                  filter: isActive ? `drop-shadow(0 0 4px ${color})` : "none",
                }}
              />
              <span className="text-[8px] font-mono tracking-wider leading-tight text-center"
                style={{ color: isActive ? color : "rgba(255,255,255,0.2)" }}
              >
                {label}
              </span>
              <motion.div
                animate={{ opacity: isActive ? [1, 0.4, 1] : 0.2 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="w-1 h-1 rounded-full"
                style={{ background: isActive ? color : "rgba(255,255,255,0.1)" }}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
