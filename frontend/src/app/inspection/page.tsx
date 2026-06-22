"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

const ITEMS = [
  { id: 1, icon: "/inspection_images/car-insurance.png", title: "Drive Responsibly",       desc: "I pledge to follow all traffic rules." },
  { id: 2, icon: "/inspection_images/no-phone.png",      title: "No Phone While Driving",   desc: "I will avoid all phone distractions." },
  { id: 3, icon: "/inspection_images/coffee-break.png",  title: "Take Breaks If Tired",     desc: "I will pull over and rest if fatigued." },
  { id: 4, icon: "/inspection_images/seat-belt (1).png", title: "Seat Belt Fastened",       desc: "My seat belt is securely fastened." },
  { id: 5, icon: "/inspection_images/rear-mirror.png",   title: "Adjust Mirrors",            desc: "Mirrors are adjusted for visibility." },
  { id: 6, icon: "/inspection_images/seat-belt.png",     title: "Proper Seating Position",  desc: "Seated upright with hands on wheel." },
  { id: 7, icon: "/inspection_images/view.png",          title: "Eyes on the Road",         desc: "I am fully focused on the road." },
  { id: 8, icon: "/inspection_images/idea.png",          title: "Adequate Lighting",        desc: "My face is well-lit for monitoring." },
  { id: 9, icon: "/inspection_images/camera.png",        title: "Camera Positioned",        desc: "Camera is properly aligned." },
  { id: 10, icon: "/inspection_images/notification.png", title: "Stay Alert",               desc: "I am fully awake and alert." },
];

export default function InspectionPage() {
  const router = useRouter();
  const [checkedItems, setCheckedItems] = useState<Set<number>>(new Set());

  const toggleCheck = (id: number) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const allChecked = checkedItems.size === ITEMS.length;

  return (
    <main className="min-h-screen bg-[#f8fafc] flex flex-col items-center py-10 px-4 font-sans text-slate-900 overflow-y-auto pb-32">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="mb-8 mt-4 text-center animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-full mb-4 shadow-sm border border-blue-100">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-2 tracking-tight">Pre-Drive Safety Check</h1>
          <p className="text-slate-500 text-sm md:text-base">Please review and confirm all safety measures before starting your journey.</p>
        </div>

        {/* Checklist */}
        <div className="space-y-4">
          {ITEMS.map((item, index) => {
            const isChecked = checkedItems.has(item.id);
            return (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => toggleCheck(item.id)}
                className={`flex items-center p-4 md:p-5 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                  isChecked 
                    ? "bg-white border-blue-400 shadow-[0_8px_30px_rgb(0,0,0,0.06)]" 
                    : "bg-white border-transparent shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]"
                }`}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center mr-5 transition-colors duration-300 ${
                  isChecked ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-slate-50"
                }`}>
                  {isChecked && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </motion.svg>
                  )}
                </div>

                {/* Icon */}
                <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mr-5 p-2.5 transition-colors duration-300 ${
                  isChecked ? "bg-blue-50" : "bg-slate-100"
                }`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.icon} alt={item.title} className="w-full h-full object-contain" />
                </div>

                {/* Text */}
                <div className="flex-1">
                  <h3 className={`font-bold text-[1.05rem] transition-colors duration-300 ${isChecked ? "text-slate-900" : "text-slate-700"}`}>
                    {item.title}
                  </h3>
                  <p className="text-[0.8rem] text-slate-500 mt-0.5">{item.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Action Button - Fixed Bottom */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex justify-center z-20 shadow-[0_-10px_40px_rgb(0,0,0,0.05)]">
          <button
            disabled={!allChecked}
            onClick={() => router.push("/dashboard")}
            className={`px-8 py-4 rounded-full font-bold text-[1.05rem] transition-all duration-300 shadow-lg w-full max-w-sm flex items-center justify-center gap-3 ${
              allChecked 
                ? "bg-slate-900 text-white hover:bg-black hover:shadow-xl hover:-translate-y-1" 
                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
            }`}
          >
            {allChecked ? (
              <>
                Start Monitoring
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            ) : (
              `${checkedItems.size} / ${ITEMS.length} Confirmed`
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
