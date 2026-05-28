"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Info, BookOpen, Compass, ShieldCheck, HeartPulse } from "lucide-react";
import Image from "next/image";

export default function PreventionGuide() {
  const [checklist, setChecklist] = useState({
    seat: false,
    mirrors: false,
    phone: false,
    belt: false,
    rest: false,
    hydrate: false,
  });

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalCount = Object.keys(checklist).length;
  const pct = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gray-700" />
            Safety Prevention & Precaution Center
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Follow guidelines to ensure proper posture, minimize cognitive stress, and maintain a distraction-free cabin environment.
          </p>
        </div>
        
        {/* Pre-Trip Checklist Score */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center gap-4 shrink-0 w-full md:w-auto">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 bg-white flex items-center justify-center font-bold text-sm text-gray-700">
            {pct}%
          </div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pre-Trip Checklist</span>
            <span className="text-xs font-bold text-gray-700">
              {completedCount} of {totalCount} safety checks completed
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Checklist & Image Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Pre-Trip Interactive Checklist */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 h-fit">
          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Pre-Trip Safety Routine
          </h4>
          
          <div className="space-y-2">
            <button
              onClick={() => toggleCheck("seat")}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                checklist.seat ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                checklist.seat ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 bg-white"
              }`}>
                {checklist.seat && <span className="text-xs">✓</span>}
              </div>
              <div className="text-xs">
                <span className="font-bold block">Adjust Seat & Headrest</span>
                <span className="text-gray-400 block mt-0.5">Maintain a 100° backrest tilt to reduce lower spine pressure.</span>
              </div>
            </button>

            <button
              onClick={() => toggleCheck("mirrors")}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                checklist.mirrors ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                checklist.mirrors ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 bg-white"
              }`}>
                {checklist.mirrors && <span className="text-xs">✓</span>}
              </div>
              <div className="text-xs">
                <span className="font-bold block">Configure All Mirrors</span>
                <span className="text-gray-400 block mt-0.5">Minimize blind spots. Rearview mirror should align with rear window.</span>
              </div>
            </button>

            <button
              onClick={() => toggleCheck("phone")}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                checklist.phone ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                checklist.phone ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 bg-white"
              }`}>
                {checklist.phone && <span className="text-xs">✓</span>}
              </div>
              <div className="text-xs">
                <span className="font-bold block">Secure Device in Cradle</span>
                <span className="text-gray-400 block mt-0.5">Activate hands-free mode or focus mode on your mobile device.</span>
              </div>
            </button>

            <button
              onClick={() => toggleCheck("belt")}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                checklist.belt ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                checklist.belt ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 bg-white"
              }`}>
                {checklist.belt && <span className="text-xs">✓</span>}
              </div>
              <div className="text-xs">
                <span className="font-bold block">Fasten Seatbelt</span>
                <span className="text-gray-400 block mt-0.5">Ensure snug fit across hips and shoulder for all passengers.</span>
              </div>
            </button>

            <button
              onClick={() => toggleCheck("rest")}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start gap-3 cursor-pointer ${
                checklist.rest ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-gray-50 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                checklist.rest ? "bg-emerald-500 border-emerald-600 text-white" : "border-gray-400 bg-white"
              }`}>
                {checklist.rest && <span className="text-xs">✓</span>}
              </div>
              <div className="text-xs">
                <span className="font-bold block">Schedule Stop Breaks</span>
                <span className="text-gray-400 block mt-0.5">Plan a rest stop every 2 hours or 100 miles on long road journeys.</span>
              </div>
            </button>
          </div>
        </div>

        {/* Right Side: Visual Precaution Cards (Columns of Illustrations) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Ergonomics & Seat Posture */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-blue-300 transition duration-300">
            <div className="relative w-full md:w-60 h-44 bg-gray-900 shrink-0">
              <Image
                src="/driver_ergonomics.png"
                alt="Optimal Driver Posture Illustration"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider">Ergonomics</span>
                <h4 className="text-base font-bold text-gray-900 mt-1">Optimal Posture & Eye Position</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Sitting straight with your back fully supported by the seat reduces muscular fatigue. Your hands should rest comfortably on the steering wheel at the 9 and 3 positions, with elbows slightly bent. Ensure mirrors align so you do not need to stretch your neck to check blind spots.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-2.5 py-1 w-fit">
                <Compass className="w-3.5 h-3.5" /> Optimal Head Angle: 0° (Center Alignment)
              </div>
            </div>
          </div>

          {/* Card 2: Fatigue & Rest Management */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-amber-300 transition duration-300">
            <div className="relative w-full md:w-60 h-44 bg-gray-900 shrink-0">
              <Image
                src="/fatigue_management.png"
                alt="Fatigue Management Illustration"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Fatigue Relief</span>
                <h4 className="text-base font-bold text-gray-900 mt-1">Combating Driver Drowsiness</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Fatigue is cumulative. If our AI registers eye-closure alerts, take a 15-minute rest immediately. Drink water, consume light caffeine, and perform active arm/leg stretches at rest stops to boost circulation and autonomic focus scores.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1 w-fit">
                <HeartPulse className="w-3.5 h-3.5" /> Stop interval suggestion: Max 2 hours continuous driving
              </div>
            </div>
          </div>

          {/* Card 3: Cabin Distraction Setup */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-red-300 transition duration-300">
            <div className="relative w-full md:w-60 h-44 bg-gray-900 shrink-0">
              <Image
                src="/safe_cabin.png"
                alt="Safe Cabin Illustration"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="p-5 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Distraction Control</span>
                <h4 className="text-base font-bold text-gray-900 mt-1">Distraction-Free Mobile Setup</h4>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Holding a smartphone increases distraction risks by 400%. Securely lock your device in a dashboard mount cradle within your primary field of view. Program routes before starting your journey, and utilize steering wheel audio buttons.
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg px-2.5 py-1 w-fit">
                <AlertCircle className="w-3.5 h-3.5" /> Safety Rule: Eyes must remain forward-facing (Tolerance: ±15°)
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
