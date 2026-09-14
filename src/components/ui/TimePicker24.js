"use client";

import React, { useMemo } from "react";
import { Clock } from "lucide-react";

export default function TimePicker24({
  value = "",
  onChange,
  className = "",
  disabled = false,
  required = false,
  name,
  id,
}) {
  const pad = (n) => String(n).padStart(2, "0");

  const [hours, minutes] = useMemo(() => {
    if (!value || !value.includes(":")) return ["08", "00"];
    const parts = value.split(":");
    return [pad(parts[0] || 0), pad(parts[1] || 0)];
  }, [value]);

  const handleHourChange = (newHour) => {
    const val = `${pad(newHour)}:${minutes}`;
    if (onChange) onChange({ target: { value: val, name } });
  };

  const handleMinuteChange = (newMinute) => {
    const val = `${hours}:${pad(newMinute)}`;
    if (onChange) onChange({ target: { value: val, name } });
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Hour Selector 00 - 23 */}
      <div className="relative flex-1">
        <select
          value={Number(hours)}
          disabled={disabled}
          onChange={(e) => handleHourChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200/90 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
        >
          {Array.from({ length: 24 }, (_, i) => (
            <option key={i} value={i}>
              {pad(i)}
            </option>
          ))}
        </select>
      </div>

      <span className="text-slate-400 dark:text-white/40 font-black text-sm">:</span>

      {/* Minute Selector 00 - 59 */}
      <div className="relative flex-1">
        <select
          value={Number(minutes)}
          disabled={disabled}
          onChange={(e) => handleMinuteChange(e.target.value)}
          className="w-full px-3 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200/90 dark:border-white/10 rounded-xl text-xs sm:text-sm font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
        >
          {Array.from({ length: 60 }, (_, i) => (
            <option key={i} value={i}>
              {pad(i)}
            </option>
          ))}
        </select>
      </div>

      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 shrink-0">
        WIB
      </span>

      {required && (
        <input
          type="text"
          id={id}
          name={name}
          required={required}
          value={value || ""}
          onChange={() => {}}
          className="sr-only"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
