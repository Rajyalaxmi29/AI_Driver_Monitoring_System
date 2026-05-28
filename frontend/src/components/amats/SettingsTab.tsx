"use client";

import { useState } from "react";
import { Bell, Camera, Moon, Shield, Sliders, User } from "lucide-react";

function Toggle({ defaultOn = false }: { defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative w-10 h-5.5 rounded-full transition-colors cursor-pointer ${on ? "bg-gray-900" : "bg-gray-200"}`}
      style={{ width: 40, height: 22 }}
    >
      <div
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? "translate-x-[18px]" : "translate-x-0.5"}`}
      />
    </button>
  );
}

function SettingRow({ label, description, defaultOn }: { label: string; description?: string; defaultOn?: boolean }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <div>
        <div className="text-sm text-gray-800 font-medium">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
      </div>
      <Toggle defaultOn={defaultOn} />
    </div>
  );
}

function SettingSection({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className="text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
      </div>
      {children}
    </div>
  );
}

export default function SettingsTab() {
  return (
    <div className="mt-4">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-1">Customize your monitoring preferences.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <SettingSection icon={Bell} title="Alerts & Notifications">
            <SettingRow label="Audio Alerts" description="Play sound when drowsiness detected" defaultOn />
            <SettingRow label="Visual Alerts" description="Flash screen border on detection" defaultOn />
            <SettingRow label="Vibration Alerts" description="Use device haptic feedback" />
            <SettingRow label="Email Reports" description="Send weekly summary to email" defaultOn />
          </SettingSection>

          <SettingSection icon={Camera} title="Camera Settings">
            <SettingRow label="IR Night Vision" description="Enable infrared in low-light" defaultOn />
            <SettingRow label="Face Detection" description="Continuous face tracking" defaultOn />
            <SettingRow label="High Resolution" description="Use 1080p feed (uses more CPU)" defaultOn />
            <SettingRow label="Session Recording" description="Save video of each session" />
          </SettingSection>
        </div>

        <div className="space-y-4">
          <SettingSection icon={Sliders} title="Detection Thresholds">
            <div className="space-y-4 py-1">
              {[
                { label: "Drowsiness Warning", value: 30, color: "#f59e0b" },
                { label: "Drowsiness Critical", value: 70, color: "#ef4444" },
                { label: "Blink Rate Alert (bpm)", value: 25, color: "#3b82f6" },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm text-gray-600">{label}</span>
                    <span className="text-sm font-semibold text-gray-800">{value}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    defaultValue={value}
                    className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: color }}
                  />
                </div>
              ))}
            </div>
          </SettingSection>

          <SettingSection icon={Moon} title="Rest Recommendations">
            <SettingRow label="Auto Rest Reminder" description="Prompt break every 2 hours" defaultOn />
            <SettingRow label="Micro-nap Detection" description="Alert for sub-2s eye closures" defaultOn />
            <SettingRow label="Route Safety Scoring" description="Score based on alertness data" />
          </SettingSection>

          <SettingSection icon={User} title="Account">
            <div className="py-2 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Driver Name</span>
                <span className="font-semibold text-gray-900">Alex Mercer</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Driver ID</span>
                <span className="font-semibold text-gray-900">DRV-8821</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Plan</span>
                <span className="font-semibold text-blue-600">Free Tier</span>
              </div>
              <button className="mt-3 w-full text-sm font-semibold text-white bg-gray-900 rounded-lg py-2 hover:bg-gray-700 transition-colors cursor-pointer">
                Upgrade to Premium
              </button>
            </div>
          </SettingSection>
        </div>
      </div>
    </div>
  );
}
