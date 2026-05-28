"use client";

interface SessionSummaryProps {
  sessionSeconds: number;
  alertCount: number;
  safetyScore: number;
  faceDetected: boolean;
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600).toString().padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function getSafetyLabel(score: number) {
  if (score >= 85) return { label: "Excellent", color: "text-green-600", bg: "bg-green-50" };
  if (score >= 70) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50" };
  if (score >= 50) return { label: "Fair", color: "text-yellow-600", bg: "bg-yellow-50" };
  return { label: "Poor", color: "text-red-600", bg: "bg-red-50" };
}

export default function SessionSummary({
  sessionSeconds, alertCount, safetyScore, faceDetected,
}: SessionSummaryProps) {
  const safety = getSafetyLabel(safetyScore);

  const stats = [
    { label: "Session Duration", value: formatTime(sessionSeconds), icon: "⏱️", note: "Active time" },
    { label: "Total Alerts", value: alertCount.toString(), icon: "🔔", note: alertCount === 0 ? "Clean drive!" : `${alertCount} event${alertCount > 1 ? "s" : ""}` },
    { label: "Safety Score", value: `${safetyScore}/100`, icon: "🛡️", note: safety.label, noteColor: safety.color },
    { label: "Face Status", value: faceDetected ? "Detected" : "Not Found", icon: "👤", note: faceDetected ? "Tracking OK" : "Check camera", noteColor: faceDetected ? "text-green-600" : "text-red-600" },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="mb-4">
        <div className="text-sm font-semibold text-gray-800">Session Summary</div>
        <div className="text-xs text-gray-400 mt-0.5">Current session overview</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon, note, noteColor }) => (
          <div key={label} className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{icon}</span>
              <span className="text-xs text-gray-500">{label}</span>
            </div>
            <div className="text-base font-bold text-gray-900">{value}</div>
            {note && (
              <div className={`text-[10px] mt-0.5 ${noteColor ?? "text-gray-400"}`}>{note}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
