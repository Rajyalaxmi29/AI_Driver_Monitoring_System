"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, ShieldAlert, Phone, MapPin, CheckCircle, RefreshCw, Send, AlertTriangle } from "lucide-react";
import { type DriverData } from "@/services/driverData";

interface EmergencyResponseProps {
  data: DriverData;
  setData: (d: DriverData) => void;
}

export default function EmergencyResponse({ data, setData }: EmergencyResponseProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  
  // Contacts State
  const [familyPhone, setFamilyPhone] = useState("+1 (555) 019-2834");
  const [familyContact, setFamilyContact] = useState("Sarah (Wife)");
  const [hospital, setHospital] = useState("Mercy General Hospital (Emergency Wing)");
  const [policeDept, setPoliceDept] = useState("Central Police Department (Traffic Dispatch)");

  // GPS coordinates (simulating a slight driving drift)
  const [gps, setGps] = useState({ lat: 37.774929, lng: -122.419416 });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Drifting coordinates
    const interval = setInterval(() => {
      setGps(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0001,
        lng: prev.lng + (Math.random() - 0.5) * 0.0001,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Handle countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setIsAlerting(true);
      setIsCancelled(false);
      
      // Update global state with accident trigger
      setData({
        ...data,
        accidentDetected: true,
        status: "DROWSY", // Set to critical status
        alerts: [
          {
            id: `accident-${Date.now()}`,
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
            type: "danger",
            message: "💥 COLLISION IMPACT DETECTED! Emergency auto-responses dispatched."
          },
          ...data.alerts
        ]
      });
      return;
    }

    timerRef.current = setTimeout(() => {
      setCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [countdown]);

  const triggerImpactSimulation = () => {
    setIsAlerting(false);
    setIsCancelled(false);
    setCountdown(5); // 5 seconds countdown
  };

  const cancelEmergencyResponse = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    setIsCancelled(true);
    setTimeout(() => setIsCancelled(false), 3000);
  };

  const resetEmergencySystem = () => {
    setIsAlerting(false);
    setIsCancelled(false);
    setCountdown(null);
    setData({
      ...data,
      accidentDetected: false,
    });
  };

  return (
    <div className="space-y-6">
      {/* Active Impact Banner */}
      <AnimatePresence>
        {isAlerting && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-500 text-white rounded-2xl p-6 shadow-xl flex items-center justify-between border border-red-600"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-full animate-bounce">
                <Siren className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">EMERGENCY SYSTEM ACTIVE</h3>
                <p className="text-sm text-red-100 font-medium mt-0.5">
                  Critical Impact Event Registered. Transmitting GPS & telematics.
                </p>
              </div>
            </div>
            <button
              onClick={resetEmergencySystem}
              className="bg-white text-red-600 hover:bg-red-50 font-bold px-5 py-2 rounded-xl transition text-sm flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Reset System
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Box */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-yellow-500 rounded-full flex items-center justify-center text-white text-xl font-bold animate-pulse">
                {countdown}s
              </div>
              <div>
                <h3 className="text-yellow-800 font-bold text-base flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 animate-spin" />
                  Auto-Response Dispatch Countdown
                </h3>
                <p className="text-yellow-700 text-sm mt-1">
                  Potential collision/impact detected. Auto alert sends to Family, Hospital, and Police in {countdown} seconds unless cancelled.
                </p>
              </div>
            </div>
            <button
              onClick={cancelEmergencyResponse}
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold px-6 py-2.5 rounded-xl transition text-sm shadow-md cursor-pointer"
            >
              CANCEL AUTO-ALERT
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancelled Confirmation */}
      <AnimatePresence>
        {isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-800 font-medium text-sm flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Emergency auto-response successfully cancelled. Standby mode active.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Panel 1: Simulation & Status */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-gray-700" />
              Impact Detection & Response
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Simulate or test the automated crash response system. In case of high-G impacts, the system triggers alerts within 5 seconds.
            </p>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
              <span>Accelerometer G-Force</span>
              <span className={isAlerting ? "text-red-500" : "text-green-500"}>
                {isAlerting ? "12.8 G (CRASH)" : "1.02 G (NORMAL)"}
              </span>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${isAlerting ? "bg-red-500 w-full" : "bg-green-500 w-1/12"}`}
              />
            </div>

            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-400">Impact Threshold</span>
              <span className="text-gray-500 font-mono font-bold">4.0 G</span>
            </div>
          </div>

          <button
            onClick={triggerImpactSimulation}
            disabled={countdown !== null}
            className={`w-full py-3 px-4 font-bold rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
              countdown !== null
                ? "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-100"
            }`}
          >
            <Siren className="w-5 h-5" />
            Simulate Accident Impact
          </button>
        </div>

        {/* Panel 2: Auto Dispatched Contacts & GPS */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-gray-700" />
              Live Telemetry & GPS Coordinates
            </h3>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full border border-blue-100 animate-pulse">
              GPS Signal: Good
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs text-gray-400 font-medium block">Current Position</span>
                <span className="text-sm font-mono font-bold text-gray-800 block mt-1">
                  {gps.lat.toFixed(6)}° N, {gps.lng.toFixed(6)}° W
                </span>
              </div>
              
              <div className="h-28 bg-gray-200 rounded-lg relative overflow-hidden border border-gray-300 flex items-center justify-center">
                {/* Mock Map Background Grid */}
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
                
                {/* Simulated Roads */}
                <div className="absolute w-[2px] h-full bg-white left-1/3 rotate-12" />
                <div className="absolute w-[2px] h-full bg-white left-2/3 -rotate-45" />
                <div className="absolute h-[2px] w-full bg-white top-1/2" />
                
                {/* User Pin */}
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-4 h-4 bg-blue-600 border-2 border-white rounded-full relative z-10 flex items-center justify-center shadow-lg"
                >
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                </motion.div>
                <div className="absolute bottom-2 left-2 text-[9px] bg-black/60 text-white px-1.5 py-0.5 rounded font-mono">
                  Map: SF Downtown (Drifting)
                </div>
              </div>
            </div>

            {/* Response Dispatch Statuses */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dispatch Center States</h4>
              
              {/* Dispatch 1: Hospital */}
              <div className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                isAlerting
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                <Phone className={`w-4 h-4 shrink-0 ${isAlerting ? "text-red-500 animate-pulse" : "text-gray-400"}`} />
                <div className="text-xs">
                  <div className="font-bold">{isAlerting ? "Ambulance Dispatched" : "Hospital Auto-Contact"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {isAlerting ? `Route locked: ${hospital}` : "Awaiting impact trigger"}
                  </div>
                </div>
              </div>

              {/* Dispatch 2: Family GPS SMS */}
              <div className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                isAlerting
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                <Send className={`w-4 h-4 shrink-0 ${isAlerting ? "text-amber-500 animate-bounce" : "text-gray-400"}`} />
                <div className="text-xs">
                  <div className="font-bold">{isAlerting ? "SMS Link Sent" : "Family GPS SMS Alert"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {isAlerting ? `SMS to ${familyContact}: GPS coordinates sent` : "Awaiting impact trigger"}
                  </div>
                </div>
              </div>

              {/* Dispatch 3: Police dispatch */}
              <div className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                isAlerting
                  ? "bg-blue-50 border-blue-200 text-blue-800"
                  : "bg-gray-50 border-gray-200 text-gray-500"
              }`}>
                <Siren className={`w-4 h-4 shrink-0 ${isAlerting ? "text-blue-500 animate-pulse" : "text-gray-400"}`} />
                <div className="text-xs">
                  <div className="font-bold">{isAlerting ? "Police Alert Active" : "Police Dispatch Alert"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {isAlerting ? `Transmitting vehicle speed & diagnostics to CPD` : "Awaiting impact trigger"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contacts Form Panel */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-gray-700" />
          Emergency Contact Setup
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Family Emergency Contact</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={familyContact}
                onChange={(e) => setFamilyContact(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none focus:border-blue-500 transition"
                placeholder="Contact Name"
              />
              <input
                type="text"
                value={familyPhone}
                onChange={(e) => setFamilyPhone(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none focus:border-blue-500 transition"
                placeholder="Phone Number"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Trauma Center</label>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none focus:border-blue-500 transition"
              placeholder="Hospital name"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Local Police Dispatch</label>
            <input
              type="text"
              value={policeDept}
              onChange={(e) => setPoliceDept(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none focus:border-blue-500 transition"
              placeholder="Police department"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
