"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { LayoutDashboard, Siren, BrainCircuit, HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  gradient: string;
  textActive: string;
  glow: string;
}

const items: NavItem[] = [
  {
    id: "telemetry",
    icon: <LayoutDashboard size={20} />,
    label: "Telemetry",
    gradient: "from-cyan-500 to-blue-500",
    textActive: "text-cyan-600 dark:text-cyan-400",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.4)]",
  },
  {
    id: "emergency",
    icon: <Siren size={20} />,
    label: "Emergency",
    gradient: "from-red-500 to-rose-600",
    textActive: "text-red-600 dark:text-red-400",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
  },
  {
    id: "safety",
    icon: <BrainCircuit size={20} />,
    label: "Safety Analysis",
    gradient: "from-indigo-500 to-purple-600",
    textActive: "text-indigo-600 dark:text-indigo-400",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.4)]",
  },
  {
    id: "prevention",
    icon: <HeartPulse size={20} />,
    label: "Prevention Guide",
    gradient: "from-emerald-500 to-teal-600",
    textActive: "text-emerald-600 dark:text-emerald-400",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
  },
];

interface LumaBarProps {
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const LumaBar = ({ activeTab, setActiveTab }: LumaBarProps) => {
  const [localActive, setLocalActive] = useState(0);
  
  const isControlled = activeTab !== undefined && setActiveTab !== undefined;
  const activeIndex = isControlled
    ? items.findIndex((item) => item.id === activeTab)
    : localActive;
  
  const currentActiveIndex = activeIndex === -1 ? 0 : activeIndex;
  const activeItem = items[currentActiveIndex];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
      <div className="relative flex items-center justify-center gap-5 bg-white rounded-full px-5 py-2.5 shadow-[0_20px_45px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.04)] border border-gray-100/80 overflow-visible pointer-events-auto ring-1 ring-black/5">
        
        {/* Dynamic Active Indicator Glow Behind Button */}
        <motion.div
          layoutId="active-indicator"
          className={cn(
            "absolute w-12 h-12 rounded-full blur-xl -z-10 bg-gradient-to-r opacity-45 dark:opacity-60 transition-all duration-300",
            activeItem.gradient
          )}
          animate={{
            left: `calc(${currentActiveIndex * (100 / items.length)}% + ${100 / items.length / 2}%)`,
            translateX: "-50%",
          }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        />

        {items.map((item, index) => {
          const isActive = index === currentActiveIndex;
          return (
            <motion.div key={item.id} className="relative flex flex-col items-center group">
              {/* Button */}
              <motion.button
                onClick={() => {
                  if (isControlled) {
                    setActiveTab?.(item.id);
                  } else {
                    setLocalActive(index);
                  }
                }}
                whileHover={{ scale: 1.15, y: -2 }}
                animate={{ 
                  scale: isActive ? 1.25 : 1,
                  y: isActive ? -2 : 0
                }}
                className={cn(
                  "flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors relative z-10 cursor-pointer text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                  isActive && cn(item.textActive, "bg-gray-500/5 dark:bg-white/5 border border-white/10 dark:border-gray-800/40")
                )}
              >
                {item.icon}
              </motion.button>

              {/* Active Tab Glow Spot Light (LED indicator) */}
              {isActive && (
                <motion.div
                  layoutId="active-nav-dot"
                  className={cn(
                    "absolute -top-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r",
                    item.gradient,
                    item.glow
                  )}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                />
              )}

              {/* Tooltip */}
              <span className="absolute bottom-full mb-3 px-2.5 py-1 text-[10px] font-bold font-mono uppercase tracking-wider rounded-lg bg-gray-900 text-white dark:bg-gray-100 dark:text-black opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg border border-white/10 dark:border-black/10">
                {item.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LumaBar;
