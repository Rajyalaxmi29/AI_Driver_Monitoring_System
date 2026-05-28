"use client";

import { cn } from "@/lib/utils";

export interface LeverSwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export const Component = ({ checked, onChange, disabled }: LeverSwitchProps) => {
  return (
    <label className={cn("toggle-container", disabled && "opacity-50 cursor-not-allowed")}>
      <input
        className="toggle-input"
        type="checkbox"
        checked={checked}
        onChange={(e) => !disabled && onChange?.(e.target.checked)}
        disabled={disabled}
      />
      <div className="toggle-handle-wrapper">
        <div className="toggle-handle">
          <div className="toggle-handle-knob"></div>
          <div className="toggle-handle-bar-wrapper">
            <div className="toggle-handle-bar"></div>
          </div>
        </div>
      </div>
      <div className="toggle-base">
        <div className="toggle-base-inside"></div>
      </div>
    </label>
  );
};
