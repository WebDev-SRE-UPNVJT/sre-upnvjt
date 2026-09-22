"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Sparkles,
  Globe,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Format helper for YYYY-MM-DDTHH:mm in Jakarta Time (UTC+7)
 */
function parseDateTimeString(val) {
  if (!val) return null;
  try {
    const pad = (n) => String(n).padStart(2, "0");

    // Case 1: Simple string like "YYYY-MM-DDTHH:mm" without timezone offset
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(val)) {
      const [datePart, timePart] = val.split("T");
      const [yearStr, monthStr, dayStr] = datePart.split("-");
      const [hourStr, minStr] = timePart.split(":");
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10) - 1;
      const date = parseInt(dayStr, 10);
      const hours = parseInt(hourStr, 10);
      const minutes = parseInt(minStr, 10);

      return {
        year,
        month,
        date,
        hours,
        minutes,
        formattedStr: `${year}-${pad(month + 1)}-${pad(date)}T${pad(hours)}:${pad(minutes)}:00+07:00`,
      };
    }

    // Case 2: Full ISO string with timezone or Date object
    const d = typeof val === "string" ? new Date(val) : val;
    if (!d || isNaN(d.getTime())) return null;

    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const parts = formatter.formatToParts(d);
    const getPart = (type) => parts.find((p) => p.type === type)?.value;

    const year = parseInt(getPart("year"), 10);
    const month = parseInt(getPart("month"), 10) - 1;
    const date = parseInt(getPart("day"), 10);
    let hours = parseInt(getPart("hour"), 10);
    if (hours === 24) hours = 0;
    const minutes = parseInt(getPart("minute"), 10);

    return {
      year,
      month,
      date,
      hours,
      minutes,
      dateObj: d,
      formattedStr: `${year}-${pad(month + 1)}-${pad(date)}T${pad(hours)}:${pad(minutes)}:00+07:00`,
    };
  } catch (e) {
    return null;
  }
}

export default function DateTimePicker24({
  value,
  onChange,
  required = false,
  placeholder,
  disabled = false,
  className = "",
  id,
  name,
}) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const parsed = useMemo(() => parseDateTimeString(value), [value]);

  const [viewYear, setViewYear] = useState(() => parsed?.year ?? new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => parsed?.month ?? new Date().getMonth());
  const [tempDate, setTempDate] = useState(() => parsed?.date ?? new Date().getDate());
  const [tempHour, setTempHour] = useState(() => parsed?.hours ?? 23);
  const [tempMinute, setTempMinute] = useState(() => parsed?.minutes ?? 59);

  // Sync internal state when external value changes
  useEffect(() => {
    if (parsed) {
      setViewYear(parsed.year);
      setViewMonth(parsed.month);
      setTempDate(parsed.date);
      setTempHour(parsed.hours);
      setTempMinute(parsed.minutes);
    }
  }, [parsed]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const months = language === "en" ? MONTHS_EN : MONTHS_ID;
  const days = language === "en" ? DAYS_EN : DAYS_ID;

  // Generate calendar days for current viewMonth and viewYear
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const daysArr = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      daysArr.push({
        day: totalDaysInPrevMonth - i,
        monthOffset: -1,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= totalDaysInMonth; i++) {
      daysArr.push({
        day: i,
        monthOffset: 0,
        isCurrentMonth: true,
      });
    }

    // Next month filler days to complete grid
    const remaining = 42 - daysArr.length;
    for (let i = 1; i <= remaining; i++) {
      daysArr.push({
        day: i,
        monthOffset: 1,
        isCurrentMonth: false,
      });
    }

    return daysArr;
  }, [viewYear, viewMonth]);

  const pad = (n) => String(n).padStart(2, "0");

  const applyDateTime = (y, m, d, h, min) => {
    const formatted = `${y}-${pad(m + 1)}-${pad(d)}T${pad(h)}:${pad(min)}:00+07:00`;
    if (onChange) {
      onChange({ target: { value: formatted, name } });
    }
  };

  const handleSelectDay = (item) => {
    let targetYear = viewYear;
    let targetMonth = viewMonth;

    if (item.monthOffset === -1) {
      if (viewMonth === 0) {
        targetMonth = 11;
        targetYear = viewYear - 1;
      } else {
        targetMonth = viewMonth - 1;
      }
      setViewMonth(targetMonth);
      setViewYear(targetYear);
    } else if (item.monthOffset === 1) {
      if (viewMonth === 11) {
        targetMonth = 0;
        targetYear = viewYear + 1;
      } else {
        targetMonth = viewMonth + 1;
      }
      setViewMonth(targetMonth);
      setViewYear(targetYear);
    }

    setTempDate(item.day);
    applyDateTime(targetYear, targetMonth, item.day, tempHour, tempMinute);
  };

  const handleHourChange = (newHour) => {
    const h = Math.max(0, Math.min(23, Number(newHour)));
    setTempHour(h);
    applyDateTime(viewYear, viewMonth, tempDate, h, tempMinute);
  };

  const handleMinuteChange = (newMin) => {
    const m = Math.max(0, Math.min(59, Number(newMin)));
    setTempMinute(m);
    applyDateTime(viewYear, viewMonth, tempDate, tempHour, m);
  };

  const handlePreset = (offsetDays, hour = 23, minute = 59) => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type) => parts.find((p) => p.type === type)?.value;
    const y = parseInt(getPart("year"), 10);
    const m = parseInt(getPart("month"), 10) - 1;
    const d = parseInt(getPart("day"), 10);

    const target = new Date(Date.UTC(y, m, d + offsetDays));
    const targetY = target.getUTCFullYear();
    const targetM = target.getUTCMonth();
    const targetD = target.getUTCDate();

    setViewYear(targetY);
    setViewMonth(targetM);
    setTempDate(targetD);
    setTempHour(hour);
    setTempMinute(minute);

    applyDateTime(targetY, targetM, targetD, hour, minute);
  };

  const handleClear = () => {
    if (onChange) {
      onChange({ target: { value: "", name } });
    }
    setIsOpen(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Formatted display text on input
  const displayText = useMemo(() => {
    if (!parsed) return "";
    const mName = months[parsed.month];
    return `${parsed.date} ${mName} ${parsed.year}, ${pad(parsed.hours)}:${pad(parsed.minutes)} WIB`;
  }, [parsed, months]);

  const isToday = (day, monthOffset) => {
    if (monthOffset !== 0) return false;
    const now = new Date();
    return (
      now.getFullYear() === viewYear &&
      now.getMonth() === viewMonth &&
      now.getDate() === day
    );
  };

  const isSelected = (day, monthOffset) => {
    if (monthOffset !== 0) return false;
    return (
      parsed &&
      parsed.year === viewYear &&
      parsed.month === viewMonth &&
      parsed.date === day
    );
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* ── Trigger Input ────────────────────────────────────────── */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200/90 dark:border-white/10 rounded-2xl cursor-pointer transition-all duration-200 shadow-sm ${
          disabled ? "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-white/5" : "hover:border-emerald-500/50"
        } ${isOpen ? "border-emerald-500 ring-2 ring-emerald-500/20" : ""}`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CalendarIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span
            className={`text-xs sm:text-sm font-medium truncate ${
              displayText ? "text-slate-900 dark:text-white font-semibold" : "text-slate-400 dark:text-white/30"
            }`}
          >
            {displayText || placeholder || (language === "en" ? "Select Date & 24H Time (WIB)..." : "Pilih Tanggal & Waktu 24 Jam (WIB)...")}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {value && !disabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 dark:text-white/40 hover:text-rose-500 transition-colors"
              title={language === "en" ? "Clear" : "Kosongkan"}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Clock className="w-4 h-4 text-slate-400 dark:text-white/30" />
          )}
        </div>
      </div>

      {/* Hidden input to support standard HTML form validation */}
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

      {/* ── 24-Hour DateTime Popover Dropdown ─────────────────────── */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-full sm:w-[360px] bg-white dark:bg-[#0c1c15] border border-slate-200 dark:border-emerald-500/20 rounded-3xl shadow-2xl p-4.5 space-y-4 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Header Bar with Month/Year Navigation */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-3">
            <div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {months[viewMonth]} {viewYear}
              </h4>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <Globe className="w-3 h-3" /> Waktu Indonesia Barat (UTC+7 / Jakarta)
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-white/60 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 dark:text-white/60 hover:text-emerald-500 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Presets Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => handlePreset(0, 23, 59)}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/5 transition-colors whitespace-nowrap"
            >
              {language === "en" ? "Today 23:59" : "Hari Ini 23:59"}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(1, 23, 59)}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/5 transition-colors whitespace-nowrap"
            >
              {language === "en" ? "Tomorrow 23:59" : "Besok 23:59"}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(3, 23, 59)}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/5 transition-colors whitespace-nowrap"
            >
              +3 {language === "en" ? "Days" : "Hari"}
            </button>
            <button
              type="button"
              onClick={() => handlePreset(7, 23, 59)}
              className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-100 dark:bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200/60 dark:border-white/5 transition-colors whitespace-nowrap"
            >
              +7 {language === "en" ? "Days" : "Hari"}
            </button>
          </div>

          {/* Calendar Grid */}
          <div>
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {days.map((d, i) => (
                <span
                  key={d}
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    i === 0 ? "text-rose-500" : "text-slate-400 dark:text-white/30"
                  }`}
                >
                  {d}
                </span>
              ))}
            </div>

            {/* Days tiles */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarDays.map((item, idx) => {
                const selected = isSelected(item.day, item.monthOffset);
                const today = isToday(item.day, item.monthOffset);

                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleSelectDay(item)}
                    className={`h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer ${
                      selected
                        ? "bg-emerald-500 text-black font-black shadow-md shadow-emerald-500/30 scale-105"
                        : today
                        ? "border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                        : item.isCurrentMonth
                        ? "text-slate-700 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/5"
                        : "text-slate-300 dark:text-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── 24-Hour Time Selector (00:00 - 23:59) ────────────────── */}
          <div className="p-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/5 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-white/80">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                {language === "en" ? "24-Hour Time (WIB)" : "Jam & Menit (24 Jam WIB)"}
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                {pad(tempHour)}:{pad(tempMinute)} WIB
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Hour 00-23 */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">
                  {language === "en" ? "Hour (00 - 23)" : "Jam (00 - 23)"}
                </label>
                <select
                  value={tempHour}
                  onChange={(e) => handleHourChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {pad(i)}:00 ({pad(i)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Minute 00-59 */}
              <div>
                <label className="block text-[9px] font-bold text-slate-400 dark:text-white/30 uppercase mb-1">
                  {language === "en" ? "Minute (00 - 59)" : "Menit (00 - 59)"}
                </label>
                <select
                  value={tempMinute}
                  onChange={(e) => handleMinuteChange(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-all cursor-pointer"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      :{pad(i)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-white/5">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
            >
              {language === "en" ? "Clear" : "Kosongkan"}
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{language === "en" ? "Done" : "Selesai"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
