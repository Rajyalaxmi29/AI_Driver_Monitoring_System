"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, History,
  BellRing, Settings, User, Cpu, ChevronRight,
  Shield, Zap, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",  id: "dashboard" },
  { icon: BarChart3,       label: "Analytics",  id: "analytics" },
  { icon: History,         label: "History",    id: "history" },
  { icon: BellRing,        label: "Alerts",     id: "alerts" },
  { icon: Shield,          label: "Safety",     id: "safety" },
  { icon: Settings,        label: "Settings",   id: "settings" },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  alertCount?: number;
}

export default function Sidebar({ activeTab, onTabChange, alertCount = 2 }: SidebarProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 220 }}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className="relative z-30 flex flex-col h-full shrink-0 overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.95) 0%, rgba(5,5,20,0.98) 100%)",
        borderRight: "1px solid rgba(0,200,255,0.08)",
      }}
    >
      {/* Top logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-cyan-500/10">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(0,80,200,0.6), rgba(0,200,255,0.3))",
            border: "1px solid rgba(0,200,255,0.3)",
            boxShadow: "0 0 16px rgba(0,200,255,0.2)",
          }}
        >
          <Cpu size={18} className="text-cyan-400" />
        </motion.div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-[13px] font-bold tracking-wider text-white leading-none">AI · DMS</div>
              <div className="text-[9px] font-mono tracking-[0.2em] text-cyan-400/50 uppercase mt-0.5">Monitor v2.1</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active = activeTab === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              onHoverStart={() => setHovered(item.id)}
              onHoverEnd={() => setHovered(null)}
              className="relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors cursor-pointer"
              style={{
                background: active
                  ? "linear-gradient(90deg, rgba(0,100,255,0.2), rgba(0,200,255,0.08))"
                  : hovered === item.id
                    ? "rgba(255,255,255,0.04)"
                    : "transparent",
                border: active ? "1px solid rgba(0,200,255,0.18)" : "1px solid transparent",
              }}
            >
              {/* Active indicator line */}
              {active && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full"
                  style={{ background: "#00dcff", boxShadow: "0 0 8px #00dcff" }}
                />
              )}

              <div className="shrink-0">
                <Icon
                  size={17}
                  className={active ? "text-cyan-400" : "text-white/30"}
                  style={active ? { filter: "drop-shadow(0 0 4px #00dcff)" } : undefined}
                />
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`text-[13px] font-medium tracking-wide flex-1 text-left ${active ? "text-cyan-300" : "text-white/45"}`}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Alert badge */}
              {item.id === "alerts" && alertCount > 0 && !collapsed && (
                <span className="text-[10px] font-bold bg-red-500/90 text-white rounded-full px-1.5 py-0 min-w-[18px] h-[18px] flex items-center justify-center"
                  style={{ boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}
                >
                  {alertCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Live status dot */}
      <div className="px-3 py-3 border-t border-cyan-500/08">
        <div className="flex items-center gap-3">
          <div className="shrink-0 relative w-9 h-9 rounded-full flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(80,0,200,0.4), rgba(0,200,255,0.2))",
              border: "1px solid rgba(150,100,255,0.3)",
            }}
          >
            <User size={16} className="text-purple-300" />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 border-2 border-black"
              style={{ boxShadow: "0 0 6px #22c55e" }}
            />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 min-w-0"
              >
                <div className="text-[12px] font-semibold text-white/80 truncate">Alex Mercer</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-green-400/70 tracking-wider">ACTIVE</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {!collapsed && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-400/50 hover:text-red-400/80 hover:bg-red-500/05 transition-colors text-[12px]"
            >
              <LogOut size={14} />
              Sign Out
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-1/2 -right-3 z-40 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
        style={{
          background: "rgba(0,0,0,0.9)",
          border: "1px solid rgba(0,200,255,0.2)",
          boxShadow: "0 0 8px rgba(0,200,255,0.1)",
        }}
      >
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
          <ChevronRight size={10} className="text-cyan-400" />
        </motion.div>
      </button>

      {/* Subtle glow at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(0,80,255,0.04), transparent)" }}
      />
    </motion.aside>
  );
}
