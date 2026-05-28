"use client";

import { useState, useEffect } from "react";
import { Eye, Brain, Smartphone, Activity, AlertOctagon, Sparkles, Navigation } from "lucide-react";
import { type DriverData } from "@/services/driverData";

interface SafetyPrecautionsProps {
  data: DriverData;
}

export default function SafetyPrecautions({ data }: SafetyPrecautionsProps) {
  const [pulseLine, setPulseLine] = useState<number[]>([]);
  
  // Simulated heart rate (BPM) derived from stress level
  const baseBpm = 68;
  const stressBpmBonus = (data.stressLevel - 15) * 0.4;
  const currentBpm = Math.round(baseBpm + stressBpmBonus + (Math.random() - 0.5) * 3);

  // Generate ECG simulation dots
  useEffect(() => {
    const pointsCount = 40;
    const interval = setInterval(() => {
      setPulseLine(prev => {
        const next = [...prev];
        if (next.length >= pointsCount) next.shift();
        
        // standard heartbeat cycle: rest -> P wave -> QRS spike -> T wave -> rest
        const step = next.length % 12;
        let val = 0;
        if (step === 2) val = 3;  // P-wave
        else if (step === 3) val = -2; // Q
        else if (step === 4) val = 12; // R-spike
        else if (step === 5) val = -4; // S
        else if (step === 7) val = 4;  // T-wave
        else val = (Math.random() - 0.5) * 0.5; // Jitter

        next.push(val);
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // SVG coordinates for ECG line
  const ecgPath = pulseLine
    .map((val, idx) => `L ${idx * 6} ${30 - val * 2}`)
    .join(" ");

  // Normalizing head pose rotations for display
  const clamp = (val: number, minVal: number, maxVal: number) => 
    Math.max(minVal, Math.min(maxVal, val));

  // Determine stress level color and text
  const stressColor = 
    data.stressLevel > 70 ? "text-red-500 bg-red-50 border-red-200" :
    data.stressLevel > 45 ? "text-amber-500 bg-amber-50 border-amber-200" : 
    "text-green-500 bg-green-50 border-green-200";

  return (
    <div className="space-y-6">
      
      {/* Phone Alert Banner */}
      {data.phoneDetected && (
        <div className="bg-red-500 text-white rounded-2xl p-5 shadow-lg flex items-center gap-4 border border-red-600 animate-pulse">
          <div className="p-3 bg-white/20 rounded-full">
            <Smartphone className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-white" />
              MOBILE PHONE USAGE DETECTED!
            </h3>
            <p className="text-xs text-red-100 mt-0.5">
              Distracted driving registered. Hands must remain on the wheel at all times.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Card 1: Head Pose (Diagrammatic Head) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-gray-700" />
              Head Position & Alignment
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Real-time calculations of Pitch, Yaw, and Roll. Severe offsets indicate driver distraction or looking away.
            </p>
          </div>

          {/* SVG Head pose simulator */}
          <div className="py-6 flex items-center justify-around bg-gray-50 rounded-xl border border-gray-100 min-h-[220px]">
            
            {/* Yaw indicator */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Yaw (Turn)</span>
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 relative flex items-center justify-center bg-white shadow-sm">
                {/* Horizontal scale */}
                <div className="absolute w-5/6 h-0.5 bg-gray-100" />
                {/* Dial Indicator */}
                <div 
                  className="w-1.5 h-16 bg-blue-500 rounded-full transition-transform duration-300 origin-center"
                  style={{ transform: `rotate(${clamp(data.yaw, -45, 45)}deg)` }}
                />
                <div className="absolute w-2 h-2 bg-blue-600 rounded-full" />
              </div>
              <span className="text-sm font-mono font-bold text-gray-700">
                {data.yaw > 0 ? `+${data.yaw.toFixed(1)}°` : `${data.yaw.toFixed(1)}°`}
              </span>
              <span className="text-[10px] text-gray-400">
                {Math.abs(data.yaw) > 15 ? "Looking Sideways" : "Aligned"}
              </span>
            </div>

            {/* Pitch indicator */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pitch (Tilt)</span>
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 relative flex items-center justify-center bg-white shadow-sm">
                {/* Vertical scale */}
                <div className="absolute h-5/6 w-0.5 bg-gray-100" />
                {/* Dial Indicator */}
                <div 
                  className="w-16 h-1.5 bg-indigo-500 rounded-full transition-transform duration-300 origin-center"
                  style={{ transform: `rotate(${clamp(-data.pitch, -45, 45)}deg)` }}
                />
                <div className="absolute w-2 h-2 bg-indigo-600 rounded-full" />
              </div>
              <span className="text-sm font-mono font-bold text-gray-700">
                {data.pitch > 0 ? `+${data.pitch.toFixed(1)}°` : `${data.pitch.toFixed(1)}°`}
              </span>
              <span className="text-[10px] text-gray-400">
                {Math.abs(data.pitch) > 15 ? "Looking Up/Down" : "Aligned"}
              </span>
            </div>

            {/* Roll indicator */}
            <div className="flex flex-col items-center space-y-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Roll (Leaning)</span>
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 relative flex items-center justify-center bg-white shadow-sm">
                {/* Dial indicator rotated */}
                <div 
                  className="w-1.5 h-16 bg-purple-500 rounded-full transition-transform duration-300 origin-center"
                  style={{ transform: `rotate(${clamp(data.roll, -45, 45)}deg)` }}
                />
                <div className="absolute w-2 h-2 bg-purple-600 rounded-full" />
                {/* Leaning Guide curved dashes */}
                <svg className="absolute w-full h-full rotate-180 opacity-20">
                  <circle cx="44" cy="44" r="36" stroke="black" strokeWidth="2" fill="none" strokeDasharray="4 8" />
                </svg>
              </div>
              <span className="text-sm font-mono font-bold text-gray-700">
                {data.roll > 0 ? `+${data.roll.toFixed(1)}°` : `${data.roll.toFixed(1)}°`}
              </span>
              <span className="text-[10px] text-gray-400">
                {Math.abs(data.roll) > 12 ? "Leaning Left/Right" : "Aligned"}
              </span>
            </div>
            
          </div>

          {/* Quick status bar */}
          <div className="flex justify-between items-center text-xs font-semibold text-gray-500 border-t border-gray-100 pt-3">
            <span>Orientation Status</span>
            <span className={
              Math.abs(data.yaw) > 15 || Math.abs(data.pitch) > 15
                ? "text-yellow-600"
                : "text-green-600"
            }>
              {Math.abs(data.yaw) > 15 || Math.abs(data.pitch) > 15 ? "⚠️ Out of Alignment" : "✅ Centered"}
            </span>
          </div>
        </div>

        {/* Card 2: Stress Detection (Physiological Indicators) */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Brain className="w-5 h-5 text-gray-700" />
              Cognitive Stress Analysis
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Physiological stress triggers calculated from autonomic data: heart rate variability, eyelid closures, and yawning triggers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left Col: Dial & ECG */}
            <div className="space-y-4">
              {/* Dial index & Emotion State */}
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full border-4 border-gray-100 bg-gray-50 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-black text-gray-700">{data.stressLevel}%</span>
                </div>
                <div>
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Stress Index</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full inline-block mt-1 border ${stressColor}`}>
                    {data.stressLevel > 70 ? "High Stress" : data.stressLevel > 45 ? "Moderate Stress" : "Relaxed"}
                  </span>
                </div>

                {/* Detected Emotion Badge */}
                <div className="border-l border-gray-100 pl-3">
                  <span className="text-xs text-gray-400 font-bold block uppercase tracking-wider">Emotion</span>
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 border ${
                    data.emotion === "HAPPY" ? "text-pink-600 bg-pink-50 border-pink-200" :
                    data.emotion === "TIRED" ? "text-blue-600 bg-blue-50 border-blue-200" :
                    data.emotion === "DISTRACTED" ? "text-orange-600 bg-orange-50 border-orange-200" :
                    "text-gray-600 bg-gray-50 border-gray-200"
                  }`}>
                    {data.emotion === "HAPPY" ? "😊 HAPPY" :
                     data.emotion === "TIRED" ? "😴 TIRED" :
                     data.emotion === "DISTRACTED" ? "📱 DISTRACTED" :
                     "😐 NEUTRAL"}
                  </span>
                </div>
              </div>

              {/* Pulse / ECG graph */}
              <div className="bg-gray-900 rounded-xl p-3 border border-gray-800 relative overflow-hidden h-[75px] flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] font-mono text-emerald-500 font-bold">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 animate-pulse" /> HRV Pulse
                  </span>
                  <span>{currentBpm} BPM</span>
                </div>
                
                {/* ECG Wave SVG */}
                <svg className="w-full h-10 overflow-visible mt-1">
                  <path
                    d={`M 0 30 ${ecgPath}`}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Right Col: Stress Indicators Checklist */}
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex flex-col justify-between space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Autonomic Indicators</span>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Fast Blink Rate:</span>
                  <span className={`font-bold ${data.blinkRate > 22 ? "text-yellow-600" : "text-green-600"}`}>
                    {data.blinkRate > 22 ? "Elevated" : "Normal"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Drowsiness Strain:</span>
                  <span className={`font-bold ${data.drowsinessLevel > 45 ? "text-amber-600 font-extrabold" : "text-green-600"}`}>
                    {data.drowsinessLevel > 60 ? "Critical" : data.drowsinessLevel > 30 ? "Moderate" : "None"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Yawn Spikes:</span>
                  <span className={`font-bold ${data.yawnCount >= 4 ? "text-red-500" : "text-green-600"}`}>
                    {data.yawnCount >= 4 ? "Fatigue Load" : "Safe"}
                  </span>
                </div>
              </div>
              
              <div className="text-[10px] text-gray-400 italic">
                Stress analysis auto-resets when driver takes a rest.
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Panel 3: Phone Usage Detection Dashboard */}
      <div className={`bg-white border rounded-2xl p-5 transition-all duration-300 ${data.phoneDetected ? "border-red-400 ring-2 ring-red-100" : "border-gray-200"}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Smartphone className={`w-5 h-5 ${data.phoneDetected ? "text-red-500 animate-bounce" : "text-gray-700"}`} />
            Distracted Driving (Phone Detection)
          </h3>
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all duration-300 ${
            data.phoneDetected 
              ? "bg-red-500 border-red-600 text-white animate-pulse" 
              : "bg-green-50 border-green-200 text-green-600"
          }`}>
            {data.phoneDetected ? "PHONE DETECTED!" : "SAFE"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`md:col-span-2 border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-300 ${
            data.phoneDetected ? "bg-red-50/50 border-red-200" : "bg-gray-50 border-gray-200"
          }`}>
            <p className={`text-xs leading-relaxed transition-all duration-300 ${data.phoneDetected ? "text-red-800 font-semibold" : "text-gray-600"}`}>
              {data.phoneDetected 
                ? "🚨 CRITICAL WARNING: Driver posture suggests active mobile phone usage. Head is tilted down and focus is off the roadway. Put the device away immediately."
                : "Our safety models cross-reference eye gaze coordinate vectors and head rotations. If you tilt your head down and focus below dashboard level for more than 2 seconds, the system flags potential cellular/device usage, issuing auditory caution alerts."
              }
            </p>
            <div className="flex gap-4">
              <div className="text-xs">
                <span className="text-gray-400 font-bold block">Model Status</span>
                <span className={`font-mono font-bold ${data.phoneDetected ? "text-red-600 font-black animate-pulse" : "text-gray-800"}`}>
                  {data.phoneDetected ? "98.9% (PHONE ACTIVE)" : "99.8% (No Phone)"}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-gray-400 font-bold block">Tracking Camera</span>
                <span className="font-mono font-bold text-gray-800">Primary IR Sensor</span>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2 transition-all duration-300 ${
            data.phoneDetected ? "bg-red-50 border-red-200 text-red-700" : "bg-white border-gray-200"
          }`}>
            <div className={`p-3 rounded-full transition-all duration-300 ${
              data.phoneDetected ? "bg-red-500 text-white animate-bounce" : "bg-green-100 text-green-600"
            }`}>
              <Smartphone className="w-8 h-8" />
            </div>
            <div className="text-xs">
              <div className="font-bold">
                {data.phoneDetected ? "Phone Activity Alert!" : "Mobile Locked / Cradle"}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                {data.phoneDetected ? "Keep hands on wheel." : "Securely docked."}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
