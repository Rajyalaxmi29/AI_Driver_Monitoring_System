"use client";

import LumaBar from "@/components/ui/futuristic-nav";

export default function DemoOne() {
  return (
    <div className="relative min-h-[200px] w-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
      <LumaBar />
      <span className="text-xs text-gray-400 font-mono">Futuristic LumaBar (Bottom Floating Navbar) Demo</span>
    </div>
  );
}
