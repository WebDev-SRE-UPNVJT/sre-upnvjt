"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  RotateCcw,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Clock,
  ShieldCheck,
  Check,
  Calendar,
  ChevronDown,
  X,
  Copy,
  Layers,
  Award,
  Trophy,
  Sun,
  Moon,
  UserCheck,
  LogIn,
  Info,
  Hash,
  HelpCircle,
  FileCheck2,
  Zap,
  Lock,
  Database,
  ClipboardList,
  CheckSquare,
  Flame,
  Home,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  getFileAcceptAttribute,
  getAllowedTypesLabel,
  validateFileRules,
} from "@/lib/fileValidation";

function CustomDropdown({
  value,
  options = [],
  onChange,
  placeholder = "-- Pilih salah satu opsi jawaban --",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
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

  return (
    <div
      className={`relative select-none ${isOpen ? "z-50" : "z-10"}`}
      ref={dropdownRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-50 dark:bg-white/5 border rounded-2xl p-4 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          isOpen
            ? "border-emerald-500 dark:border-emerald-400 bg-white dark:bg-white/10 ring-2 ring-emerald-500/25 shadow-md"
            : "border-slate-200 dark:border-white/15 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.08]"
        }`}
      >
        <span
          className={`text-sm sm:text-base font-semibold truncate ${
            value
              ? "text-slate-900 dark:text-white"
              : "text-slate-400 dark:text-white/40 font-normal"
          }`}
        >
          {value || placeholder}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onChange("");
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Hapus pilihan"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Animated Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-[#0b1b14] border border-slate-200 dark:border-white/15 shadow-2xl p-1.5 space-y-1"
          >
            {options.length === 0 ? (
              <div className="p-3.5 text-center text-xs text-slate-400 dark:text-white/40 font-medium">
                Tidak ada opsi tersedia
              </div>
            ) : (
              options.map((opt, idx) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30"
                        : "text-slate-700 dark:text-white/80 hover:bg-slate-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 stroke-[3]" />
                    )}
                  </button>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
const DAY_NAMES = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function CustomDatePicker({
  value,
  onChange,
  placeholder = "Pilih tanggal...",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Parse current selected date
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parts = value.split("-");
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    return null;
  }, [value]);

  // Current view month & year
  const [viewDate, setViewDate] = useState(() => selectedDate || new Date());

  // Keep viewDate in sync when opened or selectedDate changes
  useEffect(() => {
    if (selectedDate) {
      setViewDate(new Date(selectedDate));
    }
  }, [selectedDate]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
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

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth();

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month tail days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: currentMonth - 1,
        year: currentMonth === 0 ? currentYear - 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    // Next month head days to fill complete grid
    const remainingDays = 42 - days.length;
    for (
      let i = 1;
      i <= (remainingDays < 7 ? remainingDays : remainingDays % 7 || 0);
      i++
    ) {
      days.push({
        day: i,
        month: currentMonth + 1,
        year: currentMonth === 11 ? currentYear + 1 : currentYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleSelectDay = (d) => {
    const m = String(d.month + 1).padStart(2, "0");
    const day = String(d.day).padStart(2, "0");
    const formatted = `${d.year}-${m}-${day}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    onChange(`${y}-${m}-${day}`);
    setViewDate(today);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange("");
    setIsOpen(false);
  };

  const formattedDisplay = useMemo(() => {
    if (!selectedDate) return "";
    return selectedDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [selectedDate]);

  // Generate Year options (1940 to 2040)
  const yearsList = useMemo(() => {
    const years = [];
    const thisYear = new Date().getFullYear();
    for (let y = thisYear + 10; y >= 1940; y--) {
      years.push(y);
    }
    return years;
  }, []);

  const today = new Date();
  const isToday = (d) =>
    d.day === today.getDate() &&
    d.month === today.getMonth() &&
    d.year === today.getFullYear();

  const isSelected = (d) =>
    selectedDate &&
    d.day === selectedDate.getDate() &&
    d.month === selectedDate.getMonth() &&
    d.year === selectedDate.getFullYear();

  return (
    <div
      className={`relative select-none ${isOpen ? "z-50" : "z-10"}`}
      ref={containerRef}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full bg-slate-50 dark:bg-white/5 border rounded-2xl p-4 text-left flex items-center justify-between gap-3 transition-all cursor-pointer ${
          isOpen
            ? "border-emerald-500 dark:border-emerald-400 bg-white dark:bg-white/10 ring-2 ring-emerald-500/25 shadow-md"
            : "border-slate-200 dark:border-white/15 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-white/[0.08]"
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <span
            className={`text-sm sm:text-base font-semibold truncate ${
              formattedDisplay
                ? "text-slate-900 dark:text-white"
                : "text-slate-400 dark:text-white/40 font-normal"
            }`}
          >
            {formattedDisplay || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {value && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
              title="Hapus tanggal"
            >
              <X size={15} />
            </span>
          )}
          <ChevronDown
            className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>
      </button>

      {/* Custom Calendar Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 sm:left-auto right-0 z-50 mt-1 w-full sm:w-[340px] rounded-3xl bg-white dark:bg-[#0b1b14] border border-slate-200 dark:border-white/15 shadow-2xl p-4"
          >
            {/* Calendar Header with Month & Year dropdowns + Prev/Next */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1.5">
                {/* Month Select */}
                <select
                  value={currentMonth}
                  onChange={(e) =>
                    setViewDate(
                      new Date(currentYear, parseInt(e.target.value, 10), 1)
                    )
                  }
                  className="bg-slate-100 dark:bg-white/10 border-0 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option
                      key={idx}
                      value={idx}
                      className="text-slate-900 dark:text-slate-900"
                    >
                      {m}
                    </option>
                  ))}
                </select>

                {/* Year Select */}
                <select
                  value={currentYear}
                  onChange={(e) =>
                    setViewDate(
                      new Date(parseInt(e.target.value, 10), currentMonth, 1)
                    )
                  }
                  className="bg-slate-100 dark:bg-white/10 border-0 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-slate-800 dark:text-white cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {yearsList.map((y) => (
                    <option
                      key={y}
                      value={y}
                      className="text-slate-900 dark:text-slate-900"
                    >
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white/70 transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
              {DAY_NAMES.map((day, idx) => (
                <div
                  key={idx}
                  className="text-[11px] font-bold text-slate-400 dark:text-white/40 py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((d, idx) => {
                const sel = isSelected(d);
                const tod = isToday(d);

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(d)}
                    className={`h-9 rounded-xl text-xs font-semibold flex items-center justify-center transition-all cursor-pointer ${
                      sel
                        ? "bg-emerald-500 text-slate-950 font-black shadow-sm"
                        : tod
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold"
                          : d.isCurrentMonth
                            ? "text-slate-700 dark:text-white/90 hover:bg-slate-100 dark:hover:bg-white/10"
                            : "text-slate-300 dark:text-white/20 hover:bg-slate-50 dark:hover:bg-white/5"
                    }`}
                  >
                    {d.day}
                  </button>
                );
              })}
            </div>

            {/* Quick Actions Footer */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/10 text-xs">
              <button
                type="button"
                onClick={handleClear}
                className="font-semibold text-slate-500 dark:text-white/50 hover:text-red-500 dark:hover:text-red-400 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-red-500/10"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={handleSetToday}
                className="font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors cursor-pointer px-2.5 py-1 rounded-lg hover:bg-emerald-500/10"
              >
                Hari Ini
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PublicFormClient({ form, user, existingSubmission }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [focusedQuestionId, setFocusedQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(Boolean(existingSubmission));
  const [isExistingRecord, setIsExistingRecord] = useState(Boolean(existingSubmission));
  const [submissionId, setSubmissionId] = useState(
    existingSubmission?.id
      ? `#SRE-${String(existingSubmission.id).padStart(5, "0")}`
      : null
  );
  const [submittedAt, setSubmittedAt] = useState(
    existingSubmission?.submittedAt ? new Date(existingSubmission.submittedAt) : null
  );
  const [submitError, setSubmitError] = useState("");
  const [quizResult, setQuizResult] = useState(() => {
    if (existingSubmission?.score !== undefined && existingSubmission?.score !== null) {
      const questionsList = form?.questions || [];
      const totalPoints = questionsList.reduce((acc, q) => acc + (parseInt(q?.points, 10) || 0), 0);
      return {
        score: existingSubmission.score,
        maxScore: totalPoints,
        percentage: totalPoints > 0 ? Math.round((existingSubmission.score / totalPoints) * 100) : 0,
      };
    }
    return null;
  });
  const [successMessage, setSuccessMessage] = useState(
    form?.successMessage || "Tanggapan Anda telah berhasil direkam.",
  );
  const [earnedXp, setEarnedXp] = useState(null);
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted
    ? theme === "system"
      ? resolvedTheme === "dark"
      : theme === "dark"
    : true;

  // Group questions into pages using 'page_break'
  const pages = useMemo(() => {
    const rawQuestions = form?.questions || [];
    const groupedPages = [[]];

    rawQuestions.forEach((q) => {
      if (q.type === "page_break") {
        if (groupedPages[groupedPages.length - 1].length > 0) {
          groupedPages.push([]);
        }
      } else {
        groupedPages[groupedPages.length - 1].push(q);
      }
    });

    return groupedPages.filter((p) => p.length > 0);
  }, [form?.questions]);

  const activeQuestions = pages[currentPage] || [];
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;

  // Calculate real progress across all questions
  const totalValidQuestions = useMemo(() => {
    return (form?.questions || []).filter((q) => q && q.type !== "page_break");
  }, [form?.questions]);

  const answeredCount = useMemo(() => {
    return totalValidQuestions.filter((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return false;
      if (typeof val === "string") return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
  }, [answers, totalValidQuestions]);

  const progressPercentage = Math.round(
    (answeredCount / Math.max(totalValidQuestions.length, 1)) * 100,
  );

  // Dynamic calculation for estimated completion time based on question count & types
  const estimatedTimeLabel = useMemo(() => {
    if (!totalValidQuestions || totalValidQuestions.length === 0) return "~1 Menit";

    let totalSeconds = 0;
    totalValidQuestions.forEach((q) => {
      switch (q.type) {
        case "paragraph":
        case "file":
          totalSeconds += 75; // ~1.25 menit untuk esai & upload file
          break;
        case "text":
        case "number":
        case "date":
          totalSeconds += 30; // ~30 detik untuk input teks/angka/tanggal
          break;
        case "radio":
        case "checkbox":
        case "dropdown":
        default:
          totalSeconds += 20; // ~20 detik untuk pilihan ganda/checkbox/dropdown
          break;
      }
    });

    const totalMinutes = Math.round(totalSeconds / 60);
    if (totalMinutes <= 1) {
      return "~1 Menit";
    } else if (totalMinutes <= 3) {
      return `~${Math.max(1, totalMinutes - 1)} - ${totalMinutes + 1} Menit`;
    } else {
      const minRange = Math.max(1, totalMinutes - 1);
      const maxRange = totalMinutes + 2;
      return `~${minRange} - ${maxRange} Menit`;
    }
  }, [totalValidQuestions]);

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  // Dedicated Number Input Handler - STRICTLY digits only, no +/- or non-numeric characters
  const handleNumericChange = (questionId, rawValue) => {
    const digitsOnly = String(rawValue || "").replace(/\D/g, "");
    handleInputChange(questionId, digitsOnly);
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const current = answers[questionId] || [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((item) => item !== option);
    }
    handleInputChange(questionId, updated);
  };

  const handleFileUpload = async (q, file) => {
    if (!file || !q) return;

    const validation = validateFileRules(file, q.allowedTypes, q.maxSizeMb);
    if (!validation.valid) {
      setUploadErrors((prev) => ({
        ...prev,
        [q.id]: validation.error,
      }));
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [q.id]: true }));
    setUploadErrors((prev) => ({ ...prev, [q.id]: "" }));

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("questionId", String(q.id));

      const targetId = form.uuid || form.id;
      const res = await fetch(`/api/forms/${targetId}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data.error || "Gagal mengunggah berkas ke Google Drive",
        );
      }

      handleInputChange(q.id, data.file?.url || "");
    } catch (err) {
      console.error("File upload error:", err);
      setUploadErrors((prev) => ({
        ...prev,
        [q.id]: err.message || "Gagal mengunggah berkas. Silakan coba kembali.",
      }));
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  const handleRemoveFile = (questionId) => {
    handleInputChange(questionId, "");
    setUploadErrors((prev) => ({ ...prev, [questionId]: "" }));
  };

  const validateCurrentPage = () => {
    const newErrors = {};

    activeQuestions.forEach((q) => {
      if (uploadingFiles[q.id]) {
        newErrors[q.id] = "Harap tunggu proses pengunggahan berkas selesai";
      } else if (q.required) {
        const ans = answers[q.id];
        if (
          ans === undefined ||
          ans === null ||
          (typeof ans === "string" && ans.trim() === "") ||
          (Array.isArray(ans) && ans.length === 0)
        ) {
          newErrors[q.id] =
            q.type === "file"
              ? "Berkas ini wajib diunggah"
              : "Pertanyaan ini wajib diisi";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentPage()) {
      const firstErrorEl = document.querySelector(".has-error");
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const formattedAnswers = (form.questions || [])
        .filter((q) => q && q.type !== "page_break")
        .map((q) => {
          const val = answers[q.id];
          return {
            questionId: String(q.id),
            questionTitle: q.question || "",
            value: val !== undefined && val !== null ? val : "",
          };
        });

      const targetId = form.uuid || form.id;
      const res = await fetch(`/api/forms/${targetId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: formattedAnswers,
          userId: user?.id || null,
          userName: user?.name || "",
          userEmail: user?.email || "",
          userNpm: user?.npm || "",
          responderName: user?.name || "",
          responderEmail: user?.email || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (data.alreadySubmitted) {
          setIsExistingRecord(true);
          setSubmissionId(
            data.submissionId
              ? `#SRE-${String(data.submissionId).padStart(5, "0")}`
              : null,
          );
          setSubmittedAt(data.submittedAt ? new Date(data.submittedAt) : new Date());
          setSubmitted(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          return;
        }
        throw new Error(data.error || "Gagal mengirim tanggapan formulir");
      }

      if (data.message) {
        setSuccessMessage(data.message);
      }
      if (data.xpEarned) {
        setEarnedXp(data.xpEarned);
      }
      if (data.isQuiz || (data.score !== undefined && data.score !== null)) {
        setQuizResult({
          score: data.score,
          maxScore: data.maxScore,
          percentage: data.percentage,
          correctCount: data.correctCount,
          totalQuestions: data.totalQuestions,
        });
      }
      setSubmissionId(
        data.submissionId
          ? `#SRE-${String(data.submissionId).padStart(5, "0")}`
          : null,
      );
      setSubmittedAt(new Date());
      setIsExistingRecord(false);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Submit error:", err);
      setSubmitError(
        err.message || "Terjadi kesalahan jaringan saat mengirim tanggapan",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setCurrentPage(0);
    setSubmitted(false);
    setIsExistingRecord(false);
    setSubmissionId(null);
    setQuizResult(null);
    setSubmitError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCopyReceipt = () => {
    const text = `BUKTI PENGISIAN FORMULIR RESMI SRE UPN VETERAN JAWA TIMUR
--------------------------------------------------
Formulir       : ${form.title}
${submissionId ? `ID Submisi     : ${submissionId}\n` : ""}${user ? `Nama Responden : ${user.name}\nEmail          : ${user.email}\n` : ""}${user?.npm ? `NPM            : ${user.npm}\n` : ""}${quizResult ? `Skor Kuis      : ${quizResult.score} / ${quizResult.maxScore} (${quizResult.percentage}%)\n` : ""}Waktu Kirim    : ${new Date(submittedAt || Date.now()).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "medium" })}
Status Server  : Terverifikasi & Tersinkronisasi ke Cloud
--------------------------------------------------
Society of Renewable Energy • UPN Veteran Jawa Timur`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  // JIKA FORM TIDAK DIPUBLIKASIKAN (DRAFT / TUTUP)
  if (!form.isPublished) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-lg w-full bg-white dark:bg-[#0a1813]/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
          <div className="w-16 h-16 bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/30 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black mb-3 text-slate-900 dark:text-white">
            Formulir Ditutup Sementara
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Formulir{" "}
            <strong className="text-slate-900 dark:text-white">
              &ldquo;{form.title}&rdquo;
            </strong>{" "}
            saat ini berstatus draf atau tidak menerima tanggapan baru. Silakan
            hubungi pengurus SRE UPNVJT.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-7 py-3.5 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // TAMPILAN SUKSES SETELAH PENGISIAN (CELEBRATION SCREEN)
  if (submitted) {
    const isQuizSubmitted = Boolean(quizResult && quizResult.maxScore > 0);

    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#06100c] text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-300">
        {/* Clean Subtle Dot Mesh Background */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-40 opacity-60" />
        </div>

        {/* Ambient Soft Glow Orbs */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-10 right-10 w-72 h-72 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Theme Switcher */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white/90 dark:bg-[#0c1813]/90 backdrop-blur-xl border border-slate-300/80 dark:border-white/15 text-slate-700 dark:text-white shadow-md hover:scale-105 transition-all cursor-pointer"
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-emerald-600" />
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full bg-white dark:bg-[#0c1813] border border-slate-300/90 dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xl shadow-slate-200/60 dark:shadow-none relative overflow-hidden z-10"
        >
          {/* Top Solid Emerald Accent Line */}
          <div className="h-1.5 w-full bg-emerald-500 absolute top-0 left-0" />

          {/* SRE Brand Logo Header */}
          <div className="flex flex-col items-center justify-center pt-2 mb-6">
            <div
              className="h-8 sm:h-9 w-28 sm:w-32 bg-emerald-600 dark:bg-white transition-colors shrink-0 mb-3"
              style={{
                maskImage: "url('/images/sre-logo.png')",
                WebkitMaskImage: "url('/images/sre-logo.png')",
                maskSize: "contain",
                WebkitMaskSize: "contain",
                maskRepeat: "no-repeat",
                WebkitMaskRepeat: "no-repeat",
                maskPosition: "center",
                WebkitMaskPosition: "center",
              }}
            />
            <p className="text-[11px] font-bold text-slate-400 dark:text-white/40 tracking-wider uppercase">
              Society of Renewable Energy • UPNVJT
            </p>
          </div>

          {/* Dynamic Checkmark & Status Pill */}
          <div className="text-center mb-6">
            <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 22,
                  delay: 0.1,
                }}
                className={`w-18 h-18 rounded-3xl ${
                  isExistingRecord
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                    : "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25"
                } flex items-center justify-center`}
              >
                {isExistingRecord ? (
                  <Lock className="w-9 h-9 stroke-[2.5]" />
                ) : (
                  <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                )}
              </motion.div>
            </div>

            {/* Status Pill Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-2.5">
              {isExistingRecord ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
                  <Lock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Tanggapan Sudah Tercatat</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Respon Berhasil Direkam</span>
                </div>
              )}

              {earnedXp > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black uppercase tracking-wider shadow-sm">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>+{earnedXp} XP Quest Diperoleh!</span>
                </div>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-display font-black text-slate-900 dark:text-white mb-2.5 tracking-tight">
              {isExistingRecord ? "Anda Sudah Mengisi Formulir" : "Terima Kasih!"}
            </h2>

            <p className="text-slate-600 dark:text-white/70 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {isExistingRecord
                ? `Formulir "${form.title}" hanya mengizinkan 1 tanggapan per akun. Tanggapan Anda telah tercatat dengan aman.`
                : successMessage || "Tanggapan Anda telah berhasil disimpan ke sistem resmi SRE UPN Veteran Jawa Timur."}
            </p>
          </div>

          {/* Quiz Result Score Card */}
          {isQuizSubmitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-teal-500/10 border border-amber-300 dark:border-amber-500/30 mb-6 text-center relative overflow-hidden shadow-sm"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-bold uppercase tracking-wider mb-3 border border-amber-200 dark:border-amber-500/30">
                <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Hasil Skor Kuis Anda</span>
              </div>

              <div className="flex items-center justify-center gap-2 my-2">
                <span className="text-4xl sm:text-5xl font-black font-display text-slate-900 dark:text-white tracking-tight">
                  {quizResult.score}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-slate-400 dark:text-white/40">
                  / {quizResult.maxScore}
                </span>
              </div>

              <div className="flex items-center justify-center gap-3 sm:gap-6 mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-white/90">
                  <span className="text-slate-400 dark:text-white/50 font-normal">
                    Persentase:
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold font-mono text-xs">
                    {quizResult.percentage}%
                  </span>
                </div>
                {quizResult.correctCount !== undefined && quizResult.correctCount !== null && (
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-white/90">
                    <span className="text-slate-400 dark:text-white/50 font-normal">
                      Jawaban Benar:
                    </span>
                    <span className="px-2 py-0.5 rounded-lg bg-teal-100 dark:bg-teal-500/20 text-teal-800 dark:text-teal-300 font-extrabold font-mono text-xs">
                      {quizResult.correctCount} / {quizResult.totalQuestions || form.questions?.filter(q => q && q.type !== 'page_break')?.length} Soal
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Digital Receipt Card */}
          <div className="bg-slate-50/90 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-2xl p-5 mb-6 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-white/50 font-medium">
                Formulir
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-right max-w-[220px] truncate">
                {form.title}
              </span>
            </div>

            {/* Account Info in Receipt */}
            {user && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50 font-medium">
                  Akun Responden
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-right flex items-center gap-1.5 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{user.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    #{user.id}
                  </span>
                </span>
              </div>
            )}

            {/* Quiz Score Row in Receipt */}
            {isQuizSubmitted && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50 font-medium">
                  Nilai / Skor Kuis
                </span>
                <span className="font-mono font-black text-amber-700 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/25">
                  {quizResult.score} / {quizResult.maxScore} ({quizResult.percentage}%)
                </span>
              </div>
            )}

            {submissionId && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50 font-medium">
                  ID Submisi
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/25">
                  {submissionId}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-white/50 font-medium">
                Waktu Kirim
              </span>
              <span className="text-slate-800 dark:text-white/90 font-semibold">
                {new Date(submittedAt || Date.now()).toLocaleString("id-ID", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-white/50 font-medium">
                Sinkronisasi
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Google Sheets & Drive
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleCopyReceipt}
                className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-300 dark:border-white/15 bg-white hover:bg-slate-50 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-xs sm:text-sm text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {copiedReceipt ? (
                  <>
                    <Check
                      size={16}
                      className="text-emerald-600 dark:text-emerald-400"
                    />
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                      Tersalin!
                    </span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>Salin Bukti Kirim</span>
                  </>
                )}
              </button>

              {form.limitOneResponse || isExistingRecord ? (
                <Link
                  href="/"
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Home size={16} />
                  <span>Ke Beranda SRE</span>
                </Link>
              ) : (
                <button
                  onClick={handleReset}
                  className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.98]"
                >
                  <RotateCcw size={16} />
                  <span>Kirim Tanggapan Lain</span>
                </button>
              )}
            </div>

            {/* Note if Form is Limited to 1 Response */}
            {form.limitOneResponse && (
              <p className="text-[11px] text-center text-slate-400 dark:text-white/40 flex items-center justify-center gap-1.5 pt-1">
                <Lock className="w-3 h-3 text-slate-400 dark:text-white/40 shrink-0" />
                <span>Formulir ini dibatasi hanya 1 kali pengisian per akun.</span>
              </p>
            )}
          </div>

          <div className="mt-7 pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-white/40">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              Respon Terverifikasi Aman • SRE UPN Veteran Jawa Timur
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN UTAMA FORM FILLING (CLEAN SOLID THEME & ULTRA-RESPONSIVE)
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#06100c] text-slate-900 dark:text-slate-100 py-4 sm:py-10 px-3.5 sm:px-6 relative font-sans selection:bg-emerald-500 selection:text-white transition-colors duration-300 overflow-x-hidden">
      {/* Clean Subtle Dot Mesh Overlay */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] dark:opacity-40 opacity-60" />
      </div>

      {/* Floating Top Nav Bar - Ultra Sleek Glass Capsule */}

      <div className="max-w-3xl mx-auto relative z-10 space-y-6 sm:space-y-8">
        {/* Hero Header Banner (Clean Solid - SRE Logo & No Gradients) */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative rounded-3xl overflow-hidden border border-slate-300/90 dark:border-white/10 bg-white dark:bg-[#0c1813] p-6 sm:p-10 shadow-md shadow-slate-200/60 dark:shadow-none"
        >
          {/* Header Top Row: SRE Logo + Status Badges Cluster */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100 dark:border-white/[0.06]">
            {/* Left SRE Logo & Organization Identity */}
            <div className="flex items-center gap-3.5">
              <div
                className="h-8 sm:h-9 w-28 sm:w-32 bg-emerald-600 dark:bg-white transition-colors shrink-0"
                style={{
                  WebkitMaskImage: "url(/images/logo.webp)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "left center",
                  maskImage: "url(/images/logo.webp)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "left center",
                }}
                role="img"
                aria-label="SRE Logo"
              />

              <div>
                <div className="flex items-center gap-1.5">
                  {form.isQuiz && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider">
                      <Trophy className="w-3 h-3 text-amber-500" />
                      Mode Kuis
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Cloud Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 text-slate-600 dark:text-white/70 text-xs font-semibold self-start sm:self-auto">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>RE-FORMS</span>
            </div>
          </div>

          {/* Title Section */}
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-4 leading-tight">
            {form.title}
          </h1>

          {/* Description Block */}
          {form.description && (
            <div className="rounded-2xl border-l-4 border-emerald-500 bg-slate-50 dark:bg-white/[0.02] border-y border-r border-slate-200/60 dark:border-white/[0.06] p-4 sm:p-5 text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line mb-6">
              {form.description}
            </div>
          )}

          {/* Micro Stats Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 mb-6 pt-2">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 block leading-none">
                  Total Soal
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white font-mono">
                  {totalValidQuestions.length} Pertanyaan
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/10 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-white/40 block leading-none">
                  Estimasi
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-white">
                  {estimatedTimeLabel}
                </span>
              </div>
            </div>
          </div>

          {/* Account Verification Chip (Logged In vs Guest) */}
          {form.collectUserData && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-4 bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0">
                    {user.image ? (
                      <img
                        src={user.image}
                        alt={user.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <span>{user.name?.charAt(0).toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {user.name}
                      </span>
                      {user.npm && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80">
                          NPM: {user.npm}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-emerald-200/60 block mt-0.5">
                      {user.email} &bull;{" "}
                      <strong className="text-emerald-700 dark:text-emerald-400">
                        Identitas akun otomatis terverifikasi
                      </strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-white/70">
                    <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      Formulir disetel merekam akun responden. Anda belum masuk
                      akun.
                    </span>
                  </div>
                  <Link
                    href={`/login?callbackUrl=/f/${form.uuid || form.id}`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 transition-all"
                  >
                    <LogIn size={14} />
                    <span>Masuk Akun</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Page progress badge (if multi-page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 dark:text-emerald-200/60">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Bagian{" "}
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                  {currentPage + 1}
                </span>{" "}
                dari {totalPages}
              </span>
            </span>
            <span className="text-slate-400 dark:text-white/40">
              Lengkapi pertanyaan pada bagian ini
            </span>
          </div>
        )}

        {/* Global Error Banner */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm flex items-center gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* QUESTIONS FORM */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 sm:space-y-8"
            >
              {activeQuestions.map((q, idx) => {
                const questionIndex =
                  form.questions.findIndex((orig) => orig.id === q.id) + 1;
                const hasError = Boolean(errors[q.id]);
                const value = answers[q.id];
                const isFocused = focusedQuestionId === q.id;
                const isAnswered =
                  value !== undefined &&
                  value !== null &&
                  (typeof value === "string"
                    ? value.trim().length > 0
                    : Array.isArray(value)
                      ? value.length > 0
                      : true);

                return (
                  <motion.div
                    key={q.id || idx}
                    onFocus={() => setFocusedQuestionId(q.id)}
                    style={{ zIndex: isFocused ? 50 : 35 - idx }}
                    className={`relative bg-white dark:bg-[#091b14]/90 rounded-3xl p-6 sm:p-8 transition-all duration-300 border ${
                      hasError
                        ? "border-red-500 shadow-xl shadow-red-500/15 has-error ring-2 ring-red-500/30"
                        : isFocused
                          ? "border-emerald-500 dark:border-emerald-400 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/25 scale-[1.003]"
                          : "border-slate-300/90 dark:border-white/10 shadow-md shadow-slate-200/60 hover:border-emerald-500/50 hover:shadow-lg dark:hover:bg-[#0c241c]/90 dark:shadow-none"
                    }`}
                  >
                    {/* Top Status & Question Number */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-400 font-mono font-extrabold text-xs shadow-inner">
                          {String(questionIndex).padStart(2, "0")}
                        </span>
                        {q.required ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider">
                            Wajib
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-medium text-[10px]">
                            Opsional
                          </span>
                        )}

                        {/* Quiz points badge */}
                        {(form.isQuiz ||
                          (q.points !== undefined && Number(q.points) > 0)) && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-bold text-[11px] flex items-center gap-1">
                            <Award className="w-3 h-3 text-amber-500" />
                            <span>{q.points || 0} Poin</span>
                          </span>
                        )}
                      </div>

                      {isAnswered && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-400/30 px-3 py-1 rounded-full shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          <span>Terisi</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Question Title */}
                    <h3 className="text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white leading-snug mb-1.5">
                      {q.question || `Pertanyaan #${questionIndex}`}
                    </h3>

                    {q.description && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-100/60 mb-4 leading-relaxed">
                        {q.description}
                      </p>
                    )}

                    {/* INPUT TYPES */}
                    <div className="mt-5">
                      {/* 1. Jawaban Singkat (Text) */}
                      {q.type === "text" && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ketik jawaban Anda di sini..."
                            value={value || ""}
                            onChange={(e) =>
                              handleInputChange(q.id, e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition-all pr-10 shadow-inner"
                          />
                          {value && (
                            <button
                              type="button"
                              onClick={() => handleInputChange(q.id, "")}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* 2. Paragraf */}
                      {q.type === "paragraph" && (
                        <div className="relative">
                          <textarea
                            rows={4}
                            placeholder="Tuliskan penjelasan atau jawaban lengkap Anda di sini..."
                            value={value || ""}
                            onChange={(e) =>
                              handleInputChange(q.id, e.target.value)
                            }
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl p-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition-all resize-y shadow-inner"
                          />
                          <div className="text-right text-[11px] text-slate-400 dark:text-white/40 mt-1.5 font-mono">
                            {(value || "").length} karakter
                          </div>
                        </div>
                      )}

                      {/* 3. Pilihan Ganda (Radio) */}
                      {q.type === "radio" && (
                        <div className="space-y-3">
                          {(q.options || []).map((opt, optIdx) => {
                            const isSelected = value === opt;
                            const optionLetter = String.fromCharCode(
                              65 + optIdx,
                            );

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.992 }}
                                onClick={() => handleInputChange(q.id, opt)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                                  isSelected
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-white shadow-sm ring-1 ring-emerald-400/30"
                                    : "bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/80"
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-all ${
                                      isSelected
                                        ? "bg-emerald-500 dark:bg-emerald-400 text-slate-950 font-black"
                                        : "bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-white/70"
                                    }`}
                                  >
                                    {optionLetter}
                                  </span>
                                  <span className="text-sm sm:text-base font-semibold leading-snug">
                                    {opt || `Pilihan ${optIdx + 1}`}
                                  </span>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-slate-950"
                                      : "border-slate-300 dark:border-white/30 bg-transparent"
                                  }`}
                                >
                                  {isSelected && (
                                    <div className="w-2 h-2 rounded-full bg-slate-950" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Kotak Centang (Checkbox) */}
                      {q.type === "checkbox" && (
                        <div className="space-y-3">
                          {(q.options || []).map((opt, optIdx) => {
                            const checkedList = Array.isArray(value)
                              ? value
                              : [];
                            const isChecked = checkedList.includes(opt);

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.992 }}
                                onClick={() =>
                                  handleCheckboxChange(q.id, opt, !isChecked)
                                }
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                                  isChecked
                                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-white shadow-sm ring-1 ring-emerald-400/30"
                                    : "bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/80"
                                }`}
                              >
                                <span className="text-sm sm:text-base font-semibold leading-snug">
                                  {opt || `Pilihan ${optIdx + 1}`}
                                </span>

                                <div
                                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isChecked
                                      ? "border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-slate-950"
                                      : "border-slate-300 dark:border-white/30 bg-transparent"
                                  }`}
                                >
                                  {isChecked && (
                                    <Check className="w-3.5 h-3.5 stroke-[3.5]" />
                                  )}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Dropdown (Custom Styled UI) */}
                      {q.type === "dropdown" && (
                        <CustomDropdown
                          value={value || ""}
                          options={q.options || []}
                          onChange={(selectedVal) =>
                            handleInputChange(q.id, selectedVal)
                          }
                        />
                      )}

                      {/* 6. Tanggal (Custom Date Picker UI) */}
                      {q.type === "date" && (
                        <CustomDatePicker
                          value={value || ""}
                          onChange={(newDate) =>
                            handleInputChange(q.id, newDate)
                          }
                        />
                      )}

                      {/* 7. Angka (Number) - Sleek Pure Numeric Input without +/- buttons */}
                      {q.type === "number" && (
                        <div className="space-y-2">
                          <div className="relative group">
                            {/* Left Numeric Badge Icon */}
                            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 pointer-events-none transition-colors group-focus-within:bg-emerald-500 group-focus-within:text-white">
                              <Hash className="w-4 h-4 stroke-[2.5]" />
                            </div>

                            <input
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="Masukkan angka..."
                              value={
                                value !== undefined && value !== null
                                  ? value
                                  : ""
                              }
                              onChange={(e) =>
                                handleNumericChange(q.id, e.target.value)
                              }
                              onKeyDown={(e) => {
                                // Block +, -, e, E, ., and comma so user can strictly enter digits only
                                if (
                                  ["e", "E", "+", "-", ".", ","].includes(e.key)
                                ) {
                                  e.preventDefault();
                                }
                              }}
                              className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl pl-15 pr-12 py-4 text-lg font-bold font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 placeholder:font-sans placeholder:text-base placeholder:font-normal focus:outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />

                            {/* Clear Input Button */}
                            {value !== undefined &&
                              value !== null &&
                              String(value) !== "" && (
                                <button
                                  type="button"
                                  onClick={() => handleInputChange(q.id, "")}
                                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
                                  title="Hapus angka"
                                >
                                  <X size={16} />
                                </button>
                              )}
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-white/40 px-1">
                            <span className="flex items-center gap-1 font-medium text-emerald-600/80 dark:text-emerald-400/80">
                              <span>Hanya menerima angka 
                              </span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 8. Unggah Berkas / File (Google Drive Sync) */}
                      {q.type === "file" && (
                        <div className="space-y-3">
                          {value ? (
                            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-400/30 flex items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="p-3 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950 rounded-xl shadow-md shrink-0 font-black">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full mb-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Tersimpan di Google Drive</span>
                                  </div>
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1.5 truncate group underline"
                                  >
                                    <span className="truncate">
                                      Lihat Berkas Terunggah
                                    </span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                                  </a>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(q.id)}
                                className="p-2.5 text-slate-400 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-xl transition-all shrink-0 cursor-pointer"
                                title="Hapus dan ganti berkas"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : uploadingFiles[q.id] ? (
                            <div className="border-2 border-dashed border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                              <div className="w-10 h-10 border-3 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                Sedang Mengunggah ke Google Drive...
                              </div>
                              <p className="text-xs text-slate-500 dark:text-white/50">
                                Berkas otomatis tersimpan di folder aman
                                formulir
                              </p>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 dark:border-white/20 dark:hover:border-emerald-400 rounded-2xl p-7 sm:p-8 text-center bg-slate-50/60 hover:bg-emerald-50/40 dark:bg-white/[0.02] dark:hover:bg-emerald-500/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center group block">
                              <input
                                type="file"
                                accept={getFileAcceptAttribute(q.allowedTypes)}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileUpload(q, f);
                                }}
                              />
                              <div className="w-14 h-14 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3.5 transition-all group-hover:scale-110 shadow-sm">
                                <UploadCloud className="w-7 h-7" />
                              </div>
                              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                Klik untuk unggah berkas atau seret ke sini
                              </p>

                              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                                  Maksimal: {q.maxSizeMb || 10} MB
                                </span>
                                <span className="text-slate-400 dark:text-white/30">
                                  &bull;
                                </span>
                                <span className="text-slate-500 dark:text-white/60 font-medium">
                                  {getAllowedTypesLabel(q.allowedTypes)}
                                </span>
                              </div>
                            </label>
                          )}

                          {uploadErrors[q.id] && (
                            <p className="text-red-500 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 mt-2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 p-2.5 rounded-xl">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                              <span>{uploadErrors[q.id]}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {hasError && (
                      <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm font-semibold mt-3 flex items-center gap-1.5 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 p-2.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                        <span>{errors[q.id]}</span>
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between pt-4 gap-4">
            {currentPage > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {!isLastPage ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm active:scale-[0.98] transition-all shadow-md ml-auto cursor-pointer"
              >
                <span>Halaman Berikutnya</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black text-sm sm:text-base transition-all shadow-md disabled:opacity-50 disabled:pointer-events-none ml-auto cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Kirim Formulir Sekarang</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center py-8 text-xs text-slate-500 dark:text-white/40 space-y-1 border-t border-slate-200 dark:border-white/10 mt-10">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            Society of Renewable Energy &bull; UPN Veteran Jawa Timur
          </p>
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            Jangan pernah mengirimkan sandi melalui RE-FORMS. 
          </p>
        </div>
      </div>
    </div>
  );
}
