"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingScreen from "@/components/dashboard/LoadingScreen";
import StatusBanner from "@/components/monitor/StatusBanner";
import MetricCard from "@/components/monitor/MetricCard";
import LiveCharts from "@/components/monitor/LiveCharts";
import AlertFeed from "@/components/monitor/AlertFeed";
import SessionSummary from "@/components/monitor/SessionSummary";
import { fetchDriverData, getMockData, seedHistory, type DriverData, type HistoryPoint } from "@/services/driverData";

// New components
import EmergencyResponse from "@/components/monitor/EmergencyResponse";
import SafetyPrecautions from "@/components/monitor/SafetyPrecautions";
import PreventionGuide from "@/components/monitor/PreventionGuide";
import { Component as LeverSwitch } from "@/components/ui/lever-switch";
import LumaBar from "@/components/ui/futuristic-nav";

// Icons
import { LayoutDashboard, Siren, BrainCircuit, HeartPulse } from "lucide-react";

// ── History ring buffer (last 20 points) ─────────────────────────

const MAX_HISTORY = 20;

function addPoint<T>(arr: T[], point: T): T[] {
  const next = [...arr, point];
  return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next;
}

function timeLabel(): string {
  const d = new Date();
  return `${d.getMinutes().toString().padStart(2, "0")}:${d.getSeconds().toString().padStart(2, "0")}`;
}

// ── Dashboard ─────────────────────────────────────────────────────

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DriverData>(getMockData());
  const [drowsinessHistory, setDrowsinessHistory] = useState<HistoryPoint[]>([]);
  const [attentionHistory, setAttentionHistory] = useState<HistoryPoint[]>([]);
  const [blinkHistory, setBlinkHistory] = useState<HistoryPoint[]>([]);
  const [activeTab, setActiveTab] = useState<"telemetry" | "emergency" | "safety" | "prevention">("telemetry");
  const [isOnBreak, setIsOnBreak] = useState(false);
  const dataRef = useRef<DriverData>(data);
  const isOnBreakRef = useRef(isOnBreak);

  // Sync ref whenever state data changes, so background poll knows previous states (e.g. accident trigger)
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Sync break status ref so polling ticks have immediate access to latest state
  useEffect(() => {
    isOnBreakRef.current = isOnBreak;
  }, [isOnBreak]);

  const tick = useCallback(async () => {
    if (isOnBreakRef.current) return;
    const next = await fetchDriverData(dataRef.current);
    dataRef.current = next;
    setData(next);

    const t = timeLabel();
    setDrowsinessHistory((h) => addPoint(h, { time: t, value: next.drowsinessLevel }));
    setAttentionHistory((h) => addPoint(h, { time: t, value: next.attentionScore }));
    setBlinkHistory((h) => addPoint(h, { time: t, value: next.blinkRate }));
  }, []);

  // Pre-seed history + poll every 2 seconds after loading
  useEffect(() => {
    if (loading) return;

    // Instantly fill 30 historical points so charts look alive immediately
    const seeded = seedHistory(30);
    setDrowsinessHistory(seeded.drowsiness);
    setAttentionHistory(seeded.attention);
    setBlinkHistory(seeded.blink);

    // Seed the initial live data point
    tick();

    // Poll every 2 seconds — slow enough to see each new point arrive
    const interval = setInterval(tick, 2000);
    return () => clearInterval(interval);
  }, [loading, tick]);

  const statusLabel = isOnBreak
    ? "text-blue-600"
    : {
        SAFE: "text-green-600",
        WARNING: "text-yellow-600",
        DROWSY: "text-red-600",
        DISTRACTED: "text-orange-600",
      }[data.status];

  return (
    <>
      {/* AI loading screen on first entry */}
      <AnimatePresence>
        {loading && <LoadingScreen onComplete={() => setLoading(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {!loading && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen bg-gray-50 relative"
          >
            {/* ── Top Header ── */}
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center gap-3">
                {/* Logo */}
                <div className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <circle cx="12" cy="12" r="3" fill="white" />
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
                    <path d="M12 5v2M12 17v2M5 12H7M17 12h2" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-bold text-gray-900">Driver Monitor</div>
                  <div className="text-[10px] text-gray-400">AI-Powered Safety Dashboard</div>
                </div>
              </div>

              {/* Center: live status indicator + toggle break switch */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span className="text-gray-400">Status:</span>
                  <span className={`font-bold ${statusLabel}`}>
                    {isOnBreak ? "ON BREAK" : data.status}
                  </span>
                </div>

                {/* System Mode (Driving / Break Switch) */}
                <div className="flex items-center gap-3 border-l border-gray-200 pl-6">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Break Toggle:</span>
                  <LeverSwitch
                    checked={isOnBreak}
                    onChange={(checked) => {
                      setIsOnBreak(checked);
                      if (checked) {
                        // Reset stats immediately when break is turned on
                        setData(prev => ({
                          ...prev,
                          status: "SAFE",
                          drowsinessLevel: 0,
                          attentionScore: 100,
                          eyesOpen: true,
                          safetyScore: 100,
                          stressLevel: 12,
                          phoneDetected: false,
                        }));
                      }
                    }}
                  />
                  <span className="text-xs font-mono font-bold text-gray-600 min-w-[65px]">
                    {isOnBreak ? "RESTING" : "MONITORING"}
                  </span>
                </div>
              </div>

              {/* Right: connection + time */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 text-xs">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className={`w-2 h-2 rounded-full ${data.connected ? "bg-green-500" : "bg-amber-400"}`}
                  />
                  <span className={data.connected ? "text-green-600 font-medium" : "text-amber-600"}>
                    {data.connected ? "Connected to Python" : "Demo Mode (Python offline)"}
                  </span>
                </div>
                <div className="text-xs text-gray-400 font-mono">
                  {new Date().toLocaleTimeString("en-US", { hour12: false })}
                </div>
              </div>
            </header>

            {/* ── Main Content ── */}
            <main className="max-w-[1280px] mx-auto px-6 py-6 pb-28 space-y-5">

              {activeTab === "telemetry" && (
                <>
                  {/* Status Banner */}
                  <StatusBanner status={data.status} connected={data.connected} phoneDetected={data.phoneDetected} isOnBreak={isOnBreak} />

                  {isOnBreak && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between gap-4 text-blue-800 text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">☕</span>
                        <span>Rest break active. Monitoring is paused. Drowsiness index has been reset.</span>
                      </div>
                      <button
                        onClick={() => setIsOnBreak(false)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer select-none"
                      >
                        Resume Driving
                      </button>
                    </motion.div>
                  )}

                  {/* Metric Cards */}
                  <div className="grid grid-cols-6 gap-4">
                    <MetricCard
                      label="Drowsiness Level"
                      value={data.drowsinessLevel}
                      unit="%"
                      icon="😴"
                      color={data.drowsinessLevel > 65 ? "red" : data.drowsinessLevel > 40 ? "yellow" : "green"}
                      progress={data.drowsinessLevel}
                      alert={data.drowsinessLevel > 65}
                      subLabel={data.drowsinessLevel > 65 ? "Critical level!" : data.drowsinessLevel > 40 ? "Elevated" : "Normal"}
                    />
                    <MetricCard
                      label="Attention Score"
                      value={data.attentionScore}
                      unit="%"
                      icon="🎯"
                      color={data.attentionScore < 55 ? "red" : data.attentionScore < 70 ? "yellow" : "purple"}
                      progress={data.attentionScore}
                      alert={data.attentionScore < 55}
                      subLabel={data.attentionScore >= 80 ? "High focus" : data.attentionScore >= 60 ? "Moderate" : "Low focus"}
                    />
                    <MetricCard
                      label="Blink Rate"
                      value={data.blinkRate}
                      unit=" /min"
                      icon="👁️"
                      color={data.blinkRate > 25 || data.blinkRate < 8 ? "red" : "blue"}
                      subLabel="Normal: 12–20/min"
                      alert={data.blinkRate > 25 || data.blinkRate < 8}
                    />
                    <MetricCard
                      label="Eyes"
                      value={data.eyesOpen ? "Open" : "Closed"}
                      icon={data.eyesOpen ? "👀" : "😑"}
                      color={data.eyesOpen ? "green" : "red"}
                      alert={!data.eyesOpen}
                      subLabel={data.eyesOpen ? "Tracking OK" : "Eyes closed!"}
                    />
                    <MetricCard
                      label="Yawn Count"
                      value={data.yawnCount}
                      icon="🥱"
                      color={data.yawnCount >= 5 ? "red" : data.yawnCount >= 3 ? "yellow" : "blue"}
                      subLabel={`This session`}
                      alert={data.yawnCount >= 5}
                    />
                    <MetricCard
                      label="Safety Score"
                      value={data.safetyScore}
                      unit="/100"
                      icon="🛡️"
                      color={data.safetyScore >= 80 ? "green" : data.safetyScore >= 60 ? "yellow" : "red"}
                      progress={data.safetyScore}
                      subLabel={data.safetyScore >= 80 ? "Excellent" : data.safetyScore >= 60 ? "Fair" : "Poor"}
                    />
                  </div>

                  {/* Live Charts */}
                  <LiveCharts
                    drowsinessHistory={drowsinessHistory}
                    attentionHistory={attentionHistory}
                    blinkHistory={blinkHistory}
                  />

                  {/* Bottom row: Alerts + Session Summary */}
                  <div className="grid grid-cols-[1fr_340px] gap-4">
                    <AlertFeed alerts={data.alerts} />
                    <SessionSummary
                      sessionSeconds={data.sessionSeconds}
                      alertCount={data.alerts.length}
                      safetyScore={data.safetyScore}
                      faceDetected={data.faceDetected}
                    />
                  </div>
                </>
              )}

              {activeTab === "emergency" && (
                <EmergencyResponse data={data} setData={setData} />
              )}

              {activeTab === "safety" && (
                <SafetyPrecautions data={data} />
              )}

              {activeTab === "prevention" && (
                <PreventionGuide />
              )}

              {/* Python backend info box */}
              {!data.connected && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4">
                  <span className="text-xl shrink-0">💡</span>
                  <div>
                    <div className="text-sm font-semibold text-amber-800">Running in Demo Mode</div>
                    <div className="text-xs text-amber-700 mt-1">
                      To see real data, start your Python backend:{" "}
                      <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">python driver_monitor.py</code>
                      {" "}— make sure Flask serves at{" "}
                      <code className="bg-amber-100 px-1.5 py-0.5 rounded font-mono text-amber-900">http://localhost:5005/api/status</code>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Box (Always shown at the very bottom) */}
              <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex flex-col gap-2 mt-4">
                <div className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                  <span>⚙️ Debug: Raw Data Received</span>
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  {data.connected 
                    ? "You are connected! This is exactly what your Python script is sending to the frontend."
                    : "You are currently disconnected. This is simulated Demo Data. Ensure your Python backend is running!"}
                </div>
                <pre className="text-[10px] text-gray-600 bg-white border border-gray-200 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">
                  {JSON.stringify(data.raw, null, 2)}
                </pre>
              </div>
            </main>

            {/* Futuristic LumaBar Floating Navigation */}
            <LumaBar activeTab={activeTab} setActiveTab={(tab) => setActiveTab(tab as any)} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
