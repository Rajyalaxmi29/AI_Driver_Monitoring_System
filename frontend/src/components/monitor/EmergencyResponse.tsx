"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Siren, ShieldAlert, Phone, MapPin, CheckCircle, RefreshCw, Send, AlertTriangle, Loader2, Navigation } from "lucide-react";
import { type DriverData } from "@/services/driverData";
import dynamic from 'next/dynamic';

const MapWidget = dynamic(() => import('./MapWidget'), { ssr: false });

interface EmergencyResponseProps {
  data: DriverData;
  setData: (d: DriverData) => void;
}

interface NearbyPlace {
  name: string;
  distance: number; // metres
  address?: string;
}

async function fetchNearby(lat: number, lng: number, amenity: string): Promise<NearbyPlace | null> {
  const radius = 10000; // 10 km search radius
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"="${amenity}"](around:${radius},${lat},${lng});
      way["amenity"="${amenity}"](around:${radius},${lat},${lng});
    );
    out center 5;
  `;
  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query,
  });
  const json = await res.json();
  if (!json.elements || json.elements.length === 0) return null;

  // Sort by distance to user
  const toRad = (d: number) => (d * Math.PI) / 180;
  const haversine = (lat2: number, lng2: number) => {
    const R = 6371000;
    const dLat = toRad(lat2 - lat);
    const dLng = toRad(lng2 - lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const sorted = json.elements
    .map((el: any) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      return {
        name: el.tags?.name || el.tags?.["name:en"] || `Unnamed ${amenity}`,
        address: el.tags?.["addr:street"] ?? el.tags?.["addr:full"] ?? "",
        distance: haversine(elLat, elLng),
        lat: elLat,
        lng: elLng,
      };
    })
    .sort((a: any, b: any) => a.distance - b.distance);

  return sorted[0] ?? null;
}

export default function EmergencyResponse({ data, setData }: EmergencyResponseProps) {
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAlerting, setIsAlerting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [alertDispatchStatus, setAlertDispatchStatus] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  
  const [familyPhone, setFamilyPhone] = useState("+916304098267");
  const [familyContact, setFamilyContact] = useState("Family Member");
  const [hospital, setHospital] = useState("");
  const [policeDept, setPoliceDept] = useState("");
  const [hospitalInfo, setHospitalInfo] = useState<NearbyPlace | null>(null);
  const [policeInfo, setPoliceInfo] = useState<NearbyPlace | null>(null);
  const [loadingHospital, setLoadingHospital] = useState(false);
  const [loadingPolice, setLoadingPolice] = useState(false);
  const [nearbyError, setNearbyError] = useState<string | null>(null);

  const [gps, setGps] = useState({ lat: 37.774929, lng: -122.419416 });
  const [hasRealGps, setHasRealGps] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setGps({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setHasRealGps(true);
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch nearest hospital + police station whenever real GPS is acquired
  useEffect(() => {
    if (!hasRealGps) return;
    let cancelled = false;

    const lookupNearby = async () => {
      setLoadingHospital(true);
      setLoadingPolice(true);
      setNearbyError(null);
      try {
        const [hosp, police] = await Promise.all([
          fetchNearby(gps.lat, gps.lng, "hospital"),
          fetchNearby(gps.lat, gps.lng, "police"),
        ]);
        if (cancelled) return;
        if (hosp) {
          setHospitalInfo(hosp);
          setHospital(hosp.name);
        }
        if (police) {
          setPoliceInfo(police);
          setPoliceDept(police.name);
        }
      } catch (e) {
        if (!cancelled) setNearbyError("Could not fetch nearby services. Check internet.");
      } finally {
        if (!cancelled) {
          setLoadingHospital(false);
          setLoadingPolice(false);
        }
      }
    };

    lookupNearby();
    return () => { cancelled = true; };
  // Only re-fetch when real GPS is first obtained or every ~500m change (round to 3dp)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasRealGps, Math.round(gps.lat * 100) / 100, Math.round(gps.lng * 100) / 100]);

  useEffect(() => {
    // Drifting fallback if no real GPS
    if (hasRealGps) return;
    const interval = setInterval(() => {
      setGps(prev => ({
        lat: prev.lat + (Math.random() - 0.5) * 0.0001,
        lng: prev.lng + (Math.random() - 0.5) * 0.0001,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, [hasRealGps]);

  // Handle countdown logic
  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setCountdown(null);
      setIsAlerting(true);
      setIsCancelled(false);

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance("Crash detected. Dispatching S. O. S. and emergency services to your location.");
        window.speechSynthesis.speak(msg);
      }

      // ── Call real backend to send SMS alerts ──────────────────────
      setAlertDispatchStatus("sending");
      fetch("/api/emergency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: gps.lat,
          lng: gps.lng,
          familyPhone: familyPhone,
          familyName: familyContact,
          hospital: hospital,
          police: policeDept,
        }),
      })
        .then(r => r.json())
        .then(result => {
          console.log("[Emergency] Alert dispatch result:", result);
          setAlertDispatchStatus("sent");
        })
        .catch(err => {
          console.error("[Emergency] Alert dispatch failed:", err);
          setAlertDispatchStatus("failed");
        });

      // Update global state with accident trigger
      setData({
        ...data,
        accidentDetected: true,
        status: "DROWSY",
        alerts: [
          {
            id: `accident-${Date.now()}`,
            time: new Date().toLocaleTimeString("en-US", { hour12: false }),
            type: "danger",
            message: "💥 COLLISION IMPACT DETECTED! SMS alert dispatched to family."
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
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance("Warning. High G impact detected. Auto response dispatching in 5 seconds.");
      window.speechSynthesis.speak(msg);
    }
  };

  const cancelEmergencyResponse = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCountdown(null);
    setIsCancelled(true);
    setTimeout(() => setIsCancelled(false), 3000);
    
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const msg = new SpeechSynthesisUtterance("Auto response cancelled.");
      window.speechSynthesis.speak(msg);
    }
  };

  const resetEmergencySystem = () => {
    setIsAlerting(false);
    setIsCancelled(false);
    setCountdown(null);
    setAlertDispatchStatus("idle");
    // Reset backend alert state
    fetch("/api/reset-emergency", { method: "POST" }).catch(() => {});
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
              
              <div className="h-40 bg-gray-200 rounded-lg relative overflow-hidden border border-gray-300 flex items-center justify-center">
                <MapWidget lat={gps.lat} lng={gps.lng} />
                {!hasRealGps && (
                  <div className="absolute top-2 right-2 text-[9px] bg-amber-500/90 backdrop-blur text-white px-2 py-1 rounded font-bold z-[400] shadow-sm uppercase tracking-wide">
                    Simulated GPS (Awaiting Permission)
                  </div>
                )}
                {hasRealGps && (
                  <div className="absolute bottom-2 left-2 text-[9px] bg-green-600/90 backdrop-blur text-white px-2 py-1 rounded font-bold z-[400] shadow-sm uppercase tracking-wide flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse block"></span> Live GPS Active
                  </div>
                )}
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
        <h3 className="text-base font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Phone className="w-5 h-5 text-gray-700" />
          Emergency Contact Setup
        </h3>
        <p className="text-xs text-gray-400 mb-4">
          {hasRealGps
            ? "Nearest hospital & police station auto-detected from your live GPS."
            : "Allow location access to auto-detect nearest hospital & police station."}
        </p>

        {nearbyError && (
          <div className="mb-4 text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {nearbyError}
          </div>
        )}

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

          {/* Nearest Hospital */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearest Trauma Center</label>
              {loadingHospital && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
              {!loadingHospital && hospitalInfo && (
                <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" />
                  {hospitalInfo.distance < 1000
                    ? `${Math.round(hospitalInfo.distance)}m away`
                    : `${(hospitalInfo.distance / 1000).toFixed(1)}km away`}
                </span>
              )}
            </div>
            <input
              type="text"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
              className={`border rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none transition ${
                hospitalInfo
                  ? "bg-green-50 border-green-300 focus:border-green-500"
                  : "bg-gray-50 border-gray-200 focus:border-blue-500"
              }`}
              placeholder={loadingHospital ? "Searching nearby..." : "Hospital name"}
            />
            {hospitalInfo?.address && (
              <p className="text-[10px] text-gray-400 truncate">{hospitalInfo.address}</p>
            )}
          </div>

          {/* Nearest Police Station */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nearest Police Station</label>
              {loadingPolice && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
              {!loadingPolice && policeInfo && (
                <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Navigation className="w-2.5 h-2.5" />
                  {policeInfo.distance < 1000
                    ? `${Math.round(policeInfo.distance)}m away`
                    : `${(policeInfo.distance / 1000).toFixed(1)}km away`}
                </span>
              )}
            </div>
            <input
              type="text"
              value={policeDept}
              onChange={(e) => setPoliceDept(e.target.value)}
              className={`border rounded-xl px-3 py-2 text-sm text-gray-700 w-full focus:outline-none transition ${
                policeInfo
                  ? "bg-blue-50 border-blue-300 focus:border-blue-500"
                  : "bg-gray-50 border-gray-200 focus:border-blue-500"
              }`}
              placeholder={loadingPolice ? "Searching nearby..." : "Police department"}
            />
            {policeInfo?.address && (
              <p className="text-[10px] text-gray-400 truncate">{policeInfo.address}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
