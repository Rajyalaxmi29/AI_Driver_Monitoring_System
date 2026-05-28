"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_MESSAGES } from "@/constants/mockData";

interface LoadingScreenProps {
  onComplete: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animate radar/scanner on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;
    let angle = 0;
    const W = canvas.width = canvas.offsetWidth;
    const H = canvas.height = canvas.offsetHeight;
    const cx = W / 2;
    const cy = H / 2;
    const R = Math.min(W, H) * 0.42;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Concentric rings
      [0.25, 0.5, 0.75, 1].forEach((frac) => {
        ctx.beginPath();
        ctx.arc(cx, cy, R * frac, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0,200,255,${0.06 + frac * 0.06})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Cross hairs
      ctx.strokeStyle = "rgba(0,200,255,0.08)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - R); ctx.lineTo(cx, cy + R); ctx.stroke();

      // Sweep arc (fake with radial gradient + rotation)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      const grad = ctx.createConicGradient?.(0, 0, 0) as CanvasGradient | undefined;
      if (grad) {
        grad.addColorStop(0, "rgba(0,220,255,0.35)");
        grad.addColorStop(0.18, "rgba(0,220,255,0.05)");
        grad.addColorStop(0.19, "rgba(0,220,255,0)");
        grad.addColorStop(1, "rgba(0,220,255,0)");
        ctx.beginPath();
        ctx.arc(0, 0, R, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        // Fallback: simple arc line
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, R, -0.08, 0.6);
        ctx.closePath();
        ctx.fillStyle = "rgba(0,220,255,0.12)";
        ctx.fill();
      }
      ctx.restore();

      // Sweep leading line
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(R, 0);
      ctx.strokeStyle = "rgba(0,220,255,0.9)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#00dcff";
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.restore();

      // Pulsing dots (blips)
      const blips = [
        { a: 0.8, r: 0.55 },
        { a: 2.3, r: 0.72 },
        { a: 4.1, r: 0.38 },
        { a: 5.5, r: 0.61 },
      ];
      blips.forEach(({ a, r }) => {
        const bx = cx + Math.cos(a) * R * r;
        const by = cy + Math.sin(a) * R * r;
        const pulse = (Math.sin(Date.now() * 0.003 + a) + 1) / 2;
        ctx.beginPath();
        ctx.arc(bx, by, 3 + pulse * 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,220,255,${0.5 + pulse * 0.5})`;
        ctx.shadowColor = "#00dcff";
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      angle += 0.025;
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Progress & message cycling
  useEffect(() => {
    const total = LOADING_MESSAGES.length;
    const stepDuration = 600; // ms per step
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setProgress(Math.min((step / total) * 100, 100));
      setMsgIndex(Math.min(step, total - 1));
      if (step >= total) {
        clearInterval(interval);
        setTimeout(() => setDone(true), 500);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (done) {
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [done, onComplete]);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loading"
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center bg-black overflow-hidden"
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
          {/* Animated grid background */}
          <div className="absolute inset-0 loading-grid-bg pointer-events-none" />

          {/* Glow orb behind radar */}
          <div className="absolute w-[480px] h-[480px] rounded-full"
            style={{ background: "radial-gradient(ellipse, rgba(0,100,255,0.12) 0%, transparent 70%)" }}
          />

          {/* Radar canvas */}
          <div className="relative w-[360px] h-[360px]">
            <canvas ref={canvasRef} className="w-full h-full" />

            {/* Center logo */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="flex flex-col items-center"
              >
                <div className="w-14 h-14 rounded-full flex items-center justify-center mb-2"
                  style={{
                    border: "1.5px solid rgba(0,200,255,0.5)",
                    background: "rgba(0,0,0,0.85)",
                    boxShadow: "0 0 30px rgba(0,200,255,0.25), inset 0 0 20px rgba(0,200,255,0.05)"
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="5" fill="#00c8ff" />
                    <path d="M14 2 L14 7 M14 21 L14 26 M2 14 L7 14 M21 14 L26 14" stroke="#00c8ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <circle cx="14" cy="14" r="11" stroke="#00c8ff" strokeWidth="0.8" opacity="0.3" />
                  </svg>
                </div>
                <span className="text-[10px] font-mono tracking-[0.3em] text-cyan-400/60 uppercase">AI · DMS</span>
              </motion.div>
            </div>

            {/* Corner brackets */}
            {[
              "top-0 left-0 border-t border-l",
              "top-0 right-0 border-t border-r",
              "bottom-0 left-0 border-b border-l",
              "bottom-0 right-0 border-b border-r",
            ].map((cls, i) => (
              <div key={i} className={`absolute w-6 h-6 ${cls} border-cyan-400/50`} />
            ))}
          </div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-8 text-2xl font-bold tracking-[0.2em] text-white uppercase font-mono"
            style={{ textShadow: "0 0 20px rgba(0,200,255,0.4)" }}
          >
            AI Driver Monitor
          </motion.h1>

          {/* Message */}
          <div className="mt-4 h-6 flex items-center">
            <AnimatePresence mode="wait">
              <motion.p
                key={msgIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="text-[11px] font-mono tracking-widest text-cyan-400/70 uppercase"
              >
                {LOADING_MESSAGES[msgIndex]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Progress bar */}
          <div className="mt-6 w-[300px]">
            <div className="h-[2px] w-full rounded-full overflow-hidden"
              style={{ background: "rgba(0,200,255,0.1)", border: "0.5px solid rgba(0,200,255,0.15)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "linear-gradient(90deg, #0080ff, #00dcff)" }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] font-mono text-cyan-400/40 tracking-widest uppercase">Loading</span>
              <span className="text-[9px] font-mono text-cyan-400/60">{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Status dots */}
          <div className="mt-6 flex gap-3">
            {["VISION", "SENSORS", "AI-ENGINE", "SAFETY"].map((label, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.3 + 0.5 }}
                className="flex flex-col items-center gap-1"
              >
                <motion.div
                  animate={{ opacity: progress > (i + 1) * 22 ? [0.6, 1, 0.6] : 0.2 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: progress > (i + 1) * 22 ? "#00dcff" : "#334155" }}
                />
                <span className="text-[8px] font-mono tracking-widest uppercase"
                  style={{ color: progress > (i + 1) * 22 ? "rgba(0,220,255,0.6)" : "rgba(255,255,255,0.15)" }}
                >
                  {label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
