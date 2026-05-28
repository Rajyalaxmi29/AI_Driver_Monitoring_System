"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { DriverAlert } from "@/services/driverData";

const ALERT_STYLE = {
  info:    { dot: "bg-blue-500",   bg: "bg-blue-50",   border: "border-blue-100",  text: "text-blue-700",  label: "INFO"    },
  warning: { dot: "bg-yellow-500", bg: "bg-yellow-50", border: "border-yellow-100",text: "text-yellow-700",label: "WARNING" },
  danger:  { dot: "bg-red-500",    bg: "bg-red-50",    border: "border-red-100",   text: "text-red-700",   label: "ALERT"   },
};

interface AlertFeedProps {
  alerts: DriverAlert[];
}

export default function AlertFeed({ alerts }: AlertFeedProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-sm font-semibold text-gray-800">Session Alerts</div>
          <div className="text-xs text-gray-400 mt-0.5">Events detected this session</div>
        </div>
        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
          {alerts.length} total
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-3xl mb-2">✅</div>
          <div className="text-sm font-medium text-gray-700">No alerts so far</div>
          <div className="text-xs text-gray-400 mt-1">Drive is going well — stay focused!</div>
        </div>
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {alerts.map((alert) => {
              const style = ALERT_STYLE[alert.type];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
                >
                  <div className={`shrink-0 w-2 h-2 rounded-full mt-1.5 ${style.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase ${style.text}`}>{style.label}</span>
                      <span className="text-[10px] text-gray-400">{alert.time}</span>
                    </div>
                    <p className="text-xs text-gray-700 mt-0.5">{alert.message}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
