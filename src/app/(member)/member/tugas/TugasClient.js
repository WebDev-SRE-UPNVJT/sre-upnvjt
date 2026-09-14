"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown, Swords, Calendar, Zap, CheckCircle2, Clock,
  ExternalLink, Send, X, AlertTriangle, UploadCloud,
  LinkIcon, FileText, ChevronRight, Search, Sparkles,
  Target, Compass, Gamepad2, Puzzle, Play, Lock,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyState } from "../components/ui/CommonUI";

// ─── Quest Prerequisite Lock Helper ──────────────────────────────────────────
export function isTaskLocked(task, submissions = []) {
  if (!task || !task.prerequisiteTaskId) return false;
  const prereqSub = submissions.find((s) => s.taskId === task.prerequisiteTaskId);
  return !prereqSub || prereqSub.status !== "APPROVED";
}

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NOT_STARTED: {
    badge: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10",
    border: "hover:border-slate-400/40 dark:hover:border-white/20",
    glow: "hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]",
    dot: "bg-slate-300 dark:bg-white/20",
  },
  PENDING: {
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    border: "hover:border-amber-500/40",
    glow: "hover:shadow-[0_4px_20px_rgba(245,158,11,0.12)]",
    dot: "bg-amber-400 animate-pulse",
  },
  APPROVED: {
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    border: "hover:border-emerald-500/40",
    glow: "hover:shadow-[0_4px_20px_rgba(16,185,129,0.12)]",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    border: "hover:border-rose-500/40",
    glow: "hover:shadow-[0_4px_20px_rgba(244,63,94,0.12)]",
    dot: "bg-rose-400",
  },
};

function getStatusLabel(status, t) {
  switch (status) {
    case "NOT_STARTED":
      return t("member_tasks.status_not_started") || "Belum Selesai";
    case "PENDING":
      return t("member_tasks.status_pending") || "Menunggu Review";
    case "APPROVED":
      return t("member_tasks.status_approved") || "Quest Selesai";
    case "REJECTED":
      return t("member_tasks.status_rejected") || "Perlu Revisi";
    default:
      return status;
  }
}

// ─── Quest Classification Helper ────────────────────────────────────────────
export function getQuestType(task) {
  if (!task) return "SIDE";
  if (task.category) {
    const cat = String(task.category).toUpperCase();
    if (cat === "MAIN" || cat === "SIDE") return cat;
  }
  const title = (task.title || "").toLowerCase();
  const desc = (task.description || "").toLowerCase();

  if (
    title.includes("[main]") ||
    title.includes("main quest") ||
    title.includes("utama") ||
    desc.includes("main quest") ||
    desc.includes("misi utama")
  ) {
    return "MAIN";
  }

  if (
    title.includes("[side]") ||
    title.includes("side quest") ||
    title.includes("sampingan") ||
    title.includes("opsional") ||
    desc.includes("side quest")
  ) {
    return "SIDE";
  }

  // Tasks with higher XP or formal form templates are classified as Main Quests
  if ((task.rewardXp && task.rewardXp >= 50) || task.formTemplateId || task.submissionType === "BOTH") {
    return "MAIN";
  }

  return "SIDE";
}

// ─── Deadline Helper ────────────────────────────────────────────────────────
function getDeadlineInfo(deadlineStr, t, language) {
  if (!deadlineStr) return { isOverdue: false, text: t("member_tasks.no_deadline") || "Tanpa Deadline", isSoon: false, isUrgent: false };

  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline - now;

  if (diffMs < 0) {
    const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const text = overdueDays === 0
      ? (t("member_tasks.overdue_today") || "Lewat deadline (Hari ini)")
      : (t("member_tasks.overdue_days", { count: overdueDays }) || `Lewat ${overdueDays} hari`);
    return { isOverdue: true, text, isSoon: false, isUrgent: false };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { isOverdue: false, text: t("member_tasks.due_hours", { count: diffHours }) || `Tenggat ${diffHours} jam lagi`, isSoon: true, isUrgent: true };
  } else if (diffDays <= 3) {
    return { isOverdue: false, text: t("member_tasks.due_days", { count: diffDays }) || `Tenggat ${diffDays} hari lagi`, isSoon: true, isUrgent: false };
  } else {
    const formatted = deadline.toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" });
    return { isOverdue: false, text: t("member_tasks.due_date", { days: diffDays, formatted }) || `${diffDays} hari lagi (${formatted})`, isSoon: false, isUrgent: false };
  }
}

function getStatus(taskId, submissions) {
  const sub = submissions.find((s) => s.taskId === taskId);
  if (!sub) return "NOT_STARTED";
  if (sub.status === "APPROVED") return "APPROVED";
  if (sub.status === "REJECTED") return "REJECTED";
  return "PENDING";
}

// ─── Harmonious Gamified Quest Card ─────────────────────────────────────────
function QuestCard({ task, submission, onOpen, index, isLocked = false }) {
  const { t, language } = useLanguage();
  const status = getStatus(task.id, submission ? [submission] : []);
  const cfg = STATUS_CONFIG[status];
  const dlInfo = getDeadlineInfo(task.deadline, t, language);
  const isLateBlocked = task.allowLateSubmission === false && dlInfo.isOverdue && status !== "APPROVED";
  const statusLabel = isLocked
    ? (language === "en" ? "Locked" : "Terkunci")
    : isLateBlocked
    ? (language === "en" ? "Closed (Overdue)" : "Ditutup (Lewat DL)")
    : getStatusLabel(status, t);
  const questType = getQuestType(task);
  const isMain = questType === "MAIN";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative bg-white dark:bg-[#08120e] border rounded-2xl sm:rounded-3xl p-4 sm:p-5.5 transition-all duration-300 cursor-pointer hover:scale-[1.008] overflow-hidden ${
        isLocked
          ? "border-amber-500/20 dark:border-amber-500/15 opacity-85 hover:border-amber-500/40 shadow-sm"
          : isMain
          ? "border-amber-500/25 dark:border-amber-500/20 hover:border-amber-400/50 shadow-[0_4px_20px_rgba(245,158,11,0.04)] hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)]"
          : "border-slate-200/80 dark:border-white/5 hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)]"
      }`}
      onClick={() => onOpen(task)}
    >
      {/* Harmonious Subtle Ambient Glow */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
          isLocked
            ? "bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent"
            : isMain
            ? "bg-gradient-to-br from-amber-500/[0.05] via-transparent to-transparent"
            : "bg-gradient-to-br from-emerald-500/[0.04] via-transparent to-transparent"
        }`}
      />

      {/* Top Status Dot Indicator */}
      <div className={`absolute top-3.5 sm:top-4 right-3.5 sm:right-4 w-2 h-2 rounded-full ${isLocked ? "bg-amber-400" : cfg.dot}`} />

      <div className="flex items-start gap-3 sm:gap-4 relative z-10">
        {/* Quest Icon Badge */}
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 border shadow-sm ${
            isLocked
              ? "bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-400 group-hover:scale-105"
              : isMain
              ? "bg-amber-500/10 border-amber-500/25 text-amber-500 dark:text-amber-300 group-hover:scale-105"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-105"
          }`}
        >
          {isLocked ? (
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          ) : isMain ? (
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          ) : (
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
          )}
        </div>

        <div className="flex-1 min-w-0 pr-2 sm:pr-4">
          {/* Quest Category, Mandatory Tag & XP Bounty Row */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5 w-full flex-wrap">
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border ${
                  isLocked
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25"
                    : isMain
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
                }`}
              >
                {isLocked ? (
                  <Lock className="w-2.5 h-2.5" />
                ) : isMain ? (
                  <Crown className="w-2.5 h-2.5 fill-current" />
                ) : (
                  <Sparkles className="w-2.5 h-2.5" />
                )}
                {isMain
                  ? (t("member_tasks.main_quest_badge") || "Main Quest")
                  : (t("member_tasks.side_quest_badge") || "Side Quest")}
              </span>

              <span
                className={`inline-flex items-center text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  task.isRequired !== false
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }`}
              >
                {task.isRequired !== false
                  ? (t("member_tasks.badge_mandatory") || "Wajib")
                  : (t("member_tasks.badge_optional") || "Opsional")}
              </span>
            </div>

            {/* XP Bounty */}
            <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-mono shrink-0">
              <Zap className="w-3 h-3 fill-amber-400" />+{task.rewardXp} XP
              {task.enableSpeedBonus !== false && (
                <span className="text-[8px] sm:text-[9px] font-bold text-blue-500 ml-0.5" title={language === "en" ? "Speed bonus up to +10 XP for early submission" : "Bonus kecepatan hingga +10 XP jika submit sebelum deadline"}>
                  +Bonus
                </span>
              )}
            </span>
          </div>

          {/* Title */}
          <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 leading-snug flex items-center gap-1.5">
            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
            <span className="truncate">{task.title}</span>
          </h4>

          {/* Description */}
          <p className="text-xs text-slate-500 dark:text-white/45 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>

          {/* Prerequisite Tag if locked */}
          {isLocked && task.prerequisiteTask && (
            <div className="mt-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] sm:text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
              <Lock className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {language === "en"
                  ? `Requires: ${task.prerequisiteTask.title}`
                  : `Perlu Selesaikan: ${task.prerequisiteTask.title}`}
              </span>
            </div>
          )}

          {/* Bottom Metas */}
          <div className="flex items-center justify-between gap-2 mt-3.5 pt-3 border-t border-slate-100 dark:border-white/5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Deadline chip */}
              <span
                className={`flex items-center gap-1 text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-xl border transition-all ${
                  dlInfo.isOverdue
                    ? "bg-rose-500/10 text-rose-500 border-rose-500/25 font-black"
                    : dlInfo.isUrgent
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold animate-pulse"
                    : dlInfo.isSoon
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-bold"
                    : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10"
                }`}
              >
                <Clock className="w-3 h-3" />
                {dlInfo.text}
              </span>

              {/* Task Type badge (TTS / Form) */}
              {(task.submissionType === "TTS" || task.ttsCrosswordId) && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[9px] sm:text-[10px] font-bold">
                  <Gamepad2 className="w-3 h-3" />
                  <span>TTS Game</span>
                </span>
              )}

              {(task.submissionType === "FORM" || task.formTemplateId) && (
                <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 text-[9px] sm:text-[10px] font-bold">
                  <FileText className="w-3 h-3" />
                  <span>Formulir</span>
                </span>
              )}
            </div>

            {/* Status badge */}
            <span
              className={`text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-xl border uppercase tracking-wider shrink-0 flex items-center gap-1 ${
                isLocked
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                  : isLateBlocked
                  ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25"
                  : cfg.badge
              }`}
            >
              {isLocked && <Lock className="w-2.5 h-2.5" />}
              {isLateBlocked && <Clock className="w-2.5 h-2.5" />}
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Action Arrow (hidden on tiny screens for maximum space) */}
        <ChevronRight className="hidden sm:block w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all flex-shrink-0 mt-1.5" />
      </div>

      {/* Rejected feedback preview */}
      {status === "REJECTED" && submission?.feedback && (
        <div className="mt-3 ml-12 sm:ml-16 pl-3 sm:pl-4 border-l-2 border-rose-500/40 relative z-10">
          <p className="text-[11px] text-rose-500 dark:text-rose-400 font-medium italic line-clamp-1">
            &quot;{submission.feedback}&quot;
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Submit Quest Modal ─────────────────────────────────────────────────────
function QuestDetailModal({ task, submission, onClose, onSubmitSuccess, isLocked = false }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const fileRef = useRef(null);
  const [type, setType] = useState(task?.submissionType === "LINK" ? "link" : "file");
  const [url, setUrl] = useState(submission?.fileUrl ?? "");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Lock body scroll when modal is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalTouch = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouch;
    };
  }, []);

  const status = getStatus(task.id, submission ? [submission] : []);
  const isOverdue = task.deadline && new Date(task.deadline) < new Date();
  const isLateSubmissionBlocked = task.allowLateSubmission === false && isOverdue;
  const canSubmit = !isLocked && !isLateSubmissionBlocked && (status === "NOT_STARTED" || status === "REJECTED");
  const statusCfg = STATUS_CONFIG[status];
  const statusLabel = isLocked
    ? (language === "en" ? "Locked" : "Terkunci")
    : isLateSubmissionBlocked
    ? (language === "en" ? "Closed (Overdue)" : "Ditutup (Lewat DL)")
    : getStatusLabel(status, t);
  const questType = getQuestType(task);
  const isMain = questType === "MAIN";

  const maxMb = task?.maxUploadSizeMb || 10;
  const allowMulti = task?.allowMultipleFiles ?? false;

  const validateAndSetFiles = (rawFiles) => {
    setError("");
    let incoming = Array.from(rawFiles || []);

    for (const f of incoming) {
      if (f.size > maxMb * 1024 * 1024) {
        setError(
          t("member_tasks.modal.error_file_size", {
            name: f.name,
            size: (f.size / (1024 * 1024)).toFixed(1),
            max: maxMb,
          }) || `Ukuran berkas "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${maxMb} MB.`
        );
        return;
      }
    }

    if (!allowMulti) {
      setFiles(incoming.slice(0, 1));
    } else {
      setFiles((prev) => {
        const combined = [...prev];
        for (const file of incoming) {
          if (!combined.some((f) => f.name === file.name && f.size === file.size)) {
            combined.push(file);
          }
        }
        return combined;
      });
    }
  };

  const removeFileAtIndex = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    validateAndSetFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const fd = new FormData();
      fd.append("type", type);

      if (type === "link") {
        if (!url.trim()) {
          setError(t("member_tasks.modal.error_empty_link") || "Link tidak boleh kosong.");
          setLoading(false);
          return;
        }
        fd.append("fileUrl", url.trim());
      } else {
        if (files.length === 0) {
          setError(t("member_tasks.modal.error_no_file") || "Pilih file terlebih dahulu.");
          setLoading(false);
          return;
        }
        for (const f of files) {
          if (f.size > maxMb * 1024 * 1024) {
            setError(
              t("member_tasks.modal.error_file_size", {
                name: f.name,
                size: (f.size / (1024 * 1024)).toFixed(1),
                max: maxMb,
              }) || `Ukuran berkas "${f.name}" melebihi batas maksimal ${maxMb} MB.`
            );
            setLoading(false);
            return;
          }
          fd.append("file", f);
        }
      }

      const res = await fetch(`/api/tasks/${task.id}/submissions`, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim submisi.");

      setSuccess(t("member_tasks.modal.success_msg") || "Quest berhasil diselesaikan! Menunggu review dari pengurus.");
      onSubmitSuccess(data.submission);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/75 backdrop-blur-md select-none overflow-hidden"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className="w-full max-w-2xl max-h-[88vh] sm:max-h-[90vh] flex flex-col bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-[32px] shadow-[0_30px_70px_rgba(0,0,0,0.5)] overflow-hidden relative my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 pb-3 sm:pb-4 bg-white dark:bg-[#07130e] border-b border-slate-100 dark:border-white/5 shrink-0">
          <div className="flex-1 pr-3 min-w-0">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 sm:py-1 rounded-full border uppercase tracking-wider ${
                  isMain
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/25"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20"
                }`}
              >
                {isMain ? <Crown className="w-3 h-3 fill-current" /> : <Swords className="w-3 h-3" />}
                {isMain
                  ? (t("member_tasks.main_quest_badge") || "Main Quest")
                  : (t("member_tasks.side_quest_badge") || "Side Quest")}
              </span>

              <span
                className={`inline-flex items-center text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 sm:py-1 rounded-full border ${
                  task.isRequired !== false
                    ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                }`}
              >
                {task.isRequired !== false
                  ? (t("member_tasks.badge_mandatory") || "Wajib")
                  : (t("member_tasks.badge_optional") || "Opsional")}
              </span>

              <span
                className={`text-[9px] sm:text-[10px] font-black px-2.5 py-0.5 sm:py-1 rounded-lg border uppercase tracking-wider flex items-center gap-1 ${
                  isLocked
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25"
                    : statusCfg.badge
                }`}
              >
                {isLocked && <Lock className="w-3 h-3" />}
                {statusLabel}
              </span>

              <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black text-amber-600 dark:text-amber-400 font-mono ml-auto">
                <Zap className="w-3.5 h-3.5 fill-amber-400" />+{task.rewardXp} XP
              </span>
            </div>
            <h2 className="text-base sm:text-xl font-black text-slate-900 dark:text-white leading-snug flex items-center gap-1.5 truncate">
              {isLocked && <Lock className="w-4 h-4 text-amber-500 shrink-0" />}
              <span className="truncate">{task.title}</span>
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          {/* Prerequisite Locked Alert Banner */}
          {isLocked && (
            <div className="p-4.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  {language === "en" ? "Side Quest Locked (Prerequisite Required)" : "Misi Terkunci (Prasyarat Belum Terpenuhi)"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                  {language === "en"
                    ? `This Side Quest is locked. You must complete and receive an APPROVED status on "${task.prerequisiteTask?.title || "Prerequisite Main Quest"}" to unlock.`
                    : `Side Quest ini sedang terkunci. Anda harus menyelesaikan dan menunggu status APPROVED pada Main Quest "${task.prerequisiteTask?.title || "Misi Utama Prasyarat"}" terlebih dahulu sebelum dapat mengerjakan tugas ini.`}
                </p>
              </div>
            </div>
          )}

          {/* Strict Deadline Overdue Lockout Banner */}
          {isLateSubmissionBlocked && status !== "APPROVED" && (
            <div className="p-5 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-start gap-3.5 shadow-sm">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                  {language === "en" ? "Submission Closed (Deadline Passed)" : "Pengumpulan Ditutup (Melewati Tenggat Waktu)"}
                </h4>
                <p className="text-xs text-slate-600 dark:text-white/70 leading-relaxed">
                  {language === "en"
                    ? "This quest has a strict deadline and no longer accepts submissions after the due date."
                    : "Tugas ini memberlakukan batas waktu ketat. Pengumpulan submisi sudah ditutup karena telah melewati batas tenggat waktu yang ditentukan."}
                </p>
              </div>
            </div>
          )}

          {/* Mission Objective (Description) */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-2">
              <Target className="w-3.5 h-3.5" /> {t("member_tasks.modal.objective_title") || "Instruksi & Objektif Misi"}
            </span>
            <p className="text-sm text-slate-600 dark:text-white/70 leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>

          {/* Deadline & Upload Limits */}
          <div className="flex flex-wrap gap-2.5">
            {(() => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date();
              return (
                <span
                  className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    isOverdue
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                      : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50"
                  }`}
                >
                  <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-rose-500" : ""}`} />
                  {t("member_tasks.modal.deadline") || "Tenggat Waktu"}:{" "}
                  {new Date(task.deadline).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {isOverdue && (
                    <span className="ml-1 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-rose-500 text-white">
                      {t("member_tasks.modal.overdue_tag") || "Lewat Waktu"}
                    </span>
                  )}
                </span>
              );
            })()}

            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              {type === "link" ? (
                <><LinkIcon className="w-3.5 h-3.5" /> {t("member_tasks.modal.link_type") || "Tautan / URL Online"}</>
              ) : task.submissionType === "TTS" || task.ttsCrosswordId ? (
                <><Gamepad2 className="w-3.5 h-3.5" /> Teka-Teki Silang (TTS)</>
              ) : task.submissionType === "FORM" || task.formTemplateId ? (
                <><FileText className="w-3.5 h-3.5" /> Formulir Dinamis</>
              ) : (
                <><UploadCloud className="w-3.5 h-3.5" /> {t("member_tasks.modal.file_type") || "Unggah Berkas"}</>
              )}
            </span>

            {type === "file" && task.submissionType !== "TTS" && task.submissionType !== "FORM" && (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  {language === "en" ? `Max ${maxMb} MB` : `Maks ${maxMb} MB`}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  {allowMulti
                    ? (language === "en" ? "Multi-File Support" : "Dukungan Multi-File")
                    : (language === "en" ? "1 File Only" : "1 File Saja")}
                </span>
              </>
            )}

            {task.enableSpeedBonus !== false && (
              <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                <Zap className="w-3.5 h-3.5" />
                {language === "en" ? "Speed Bonus Active (+1 - 10 XP)" : "Bonus Kecepatan Aktif (+1 - 10 XP)"}
              </span>
            )}
          </div>

          {/* Action Sections: If locked, show locked barrier instead of action buttons */}
          {isLocked ? (
            <div className="p-8 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-black text-slate-800 dark:text-white">
                {language === "en" ? "Submission Locked" : "Akses Pengerjaan Terkunci"}
              </h4>
              <p className="text-xs text-slate-500 dark:text-white/50 max-w-sm mx-auto leading-relaxed">
                {language === "en"
                  ? `Complete "${task.prerequisiteTask?.title || "Main Quest"}" and get APPROVED status first to unlock this quest.`
                  : `Selesaikan "${task.prerequisiteTask?.title || "Main Quest"}" dan tunggu hingga disetujui (APPROVED) untuk membuka akses pengerjaan quest ini.`}
              </p>
            </div>
          ) : (
            <>
              {/* TTS Game Launcher Card */}
              {(task.submissionType === "TTS" || task.ttsCrosswordId) && (
                <div className="p-5 bg-purple-500/10 border border-purple-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <Gamepad2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === "en" ? "Interactive Crossword Quest" : "Misi Teka-Teki Silang (TTS)"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                        {submission
                          ? (language === "en"
                            ? `Crossword completed! Score: ${submission.score ?? 100}% (+${submission.xpEarned ?? task.rewardXp} XP)`
                            : `Tugas TTS telah selesai dikerjakan (Skor: ${submission.score ?? 100}%, +${submission.xpEarned ?? task.rewardXp} XP).`)
                          : (language === "en"
                            ? "Play and complete all grid questions to claim XP bounty! (1x attempt)"
                            : "Mainkan dan selesaikan seluruh kotak teka-teki silang untuk klaim XP! (Hanya 1x pengerjaan)")}
                      </p>
                    </div>
                  </div>
                  {submission ? (
                    <div className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === "en" ? "Completed (1x)" : "Sudah Dikerjakan (1x)"}</span>
                    </div>
                  ) : (
                    <Link
                      href={`/games/tts/${task.ttsCrosswordId || 1}?taskId=${task.id}`}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all shrink-0"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{language === "en" ? "Play Crossword" : "Mulai Mainkan TTS"}</span>
                    </Link>
                  )}
                </div>
              )}

              {/* Form Template Launcher Card */}
              {(task.submissionType === "FORM" || task.formTemplateId) && (
                <div className="p-5 bg-teal-500/10 border border-teal-500/25 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {language === "en" ? "Custom Form Mission" : "Misi Pengisian Formulir"}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-white/50 mt-0.5">
                        {language === "en"
                          ? "Fill and submit the designated response form to finish this quest."
                          : "Isi dan kirimkan formulir tanggapan untuk menyelesaikan quest ini."}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/f/${task.formTemplateId || ""}`}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{language === "en" ? "Open Form" : "Buka Formulir"}</span>
                  </Link>
                </div>
              )}

              {/* Rejected feedback */}
              {status === "REJECTED" && submission?.feedback && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/8 border border-rose-500/20 rounded-2xl">
                  <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-black text-rose-600 dark:text-rose-400 mb-1">
                      {t("member_tasks.modal.feedback_reviewer") || "Catatan Reviewer:"}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-white/60">{submission.feedback}</p>
                  </div>
                </div>
              )}

              {/* Current submission preview */}
              {(status === "PENDING" || status === "APPROVED") && (
                submission?.score !== null && submission?.score !== undefined ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                          Hasil Pengerjaan TTS
                        </span>
                      </div>
                      <span className="text-xs font-black text-amber-500 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-amber-400" />
                        +{submission.xpEarned ?? task.rewardXp} XP
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center pt-1">
                      <div className="p-2.5 rounded-xl bg-black/5 dark:bg-white/5 border border-current/10">
                        <span className="text-[10px] opacity-60 font-bold block">Skor</span>
                        <span className="text-sm font-black text-emerald-500">{submission.score}%</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">Benar</span>
                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{submission.correctCount ?? 0}</span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                        <span className="text-[10px] text-rose-500 font-bold block">Salah</span>
                        <span className="text-sm font-black text-rose-500">{submission.wrongCount ?? 0}</span>
                      </div>
                    </div>

                    {submission.feedback && (
                      <p className="text-xs text-slate-500 dark:text-white/50 pt-1 border-t border-emerald-500/15">
                        {submission.feedback}
                      </p>
                    )}
                  </div>
                ) : submission?.fileUrl ? (
                  <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                        {language === "en" ? "Your Submission" : "Laporan Quest Kamu"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-0.5">{submission.fileUrl}</p>
                    </div>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ) : null
              )}

              {/* ── Submit form (Only for File or Link tasks) ───────────── */}
              {canSubmit && task.submissionType !== "TTS" && task.submissionType !== "FORM" && (
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-white/80">
                      {t("member_tasks.modal.submission_label") || "Kumpulkan Hasil Quest:"}
                    </span>
                  </div>

                  {/* Link input */}
                  {type === "link" && (
                    <div className="relative">
                      <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={t("member_tasks.modal.link_placeholder") || "https://drive.google.com/... atau tautan Figma/Github"}
                        className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                      />
                    </div>
                  )}

                  {/* File drop zone */}
                  {type === "file" && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                        isDragging
                          ? "border-emerald-500 bg-emerald-500/5 scale-[1.01]"
                          : "border-slate-200 dark:border-white/10 hover:border-emerald-500/40 bg-slate-50 dark:bg-white/[0.01]"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileRef}
                        multiple={allowMulti}
                        className="hidden"
                        onChange={(e) => validateAndSetFiles(e.target.files)}
                      />

                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <UploadCloud className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-bold text-slate-700 dark:text-white/80">
                          {t("member_tasks.modal.dropzone_title") || "Pilih berkas atau tarik ke sini"}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-white/30">
                          {t("member_tasks.modal.dropzone_sub", { max: maxMb }) || `Format bebas, maks ${maxMb} MB per berkas`}{" "}
                          {allowMulti && (t("member_tasks.modal.dropzone_multi") || "(Dukungan multi-file aktif)")}
                        </p>
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="mt-2 px-4 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black transition-colors cursor-pointer"
                        >
                          {t("member_tasks.modal.dropzone_browse") || "Jelajahi Berkas"}
                        </button>
                      </div>

                      {/* Selected files list */}
                      {files.length > 0 && (
                        <div className="mt-4 space-y-2 text-left">
                          {files.map((file, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <FileText className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                <span className="text-xs font-medium text-slate-700 dark:text-white/80 truncate">
                                  {file.name}
                                </span>
                                <span className="text-[10px] text-slate-400 flex-shrink-0">
                                  ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFileAtIndex(idx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-lg transition-colors ml-2 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error & Success alerts */}
                  {error && (
                    <div className="flex items-center gap-2 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                  {success && (
                    <div className="flex items-center gap-2 p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold rounded-xl">
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                      <span>{success}</span>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-slate-950/30 border-t-slate-950 animate-spin" />
                        <span>{type === "file" ? (t("member_tasks.modal.btn_uploading") || "Mengupload...") : (t("member_tasks.modal.btn_submitting") || "Mengirim...")}</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>{status === "REJECTED" ? (t("member_tasks.modal.btn_resubmit") || "Submit Ulang Quest") : (t("member_tasks.modal.btn_submit") || "Kumpulkan Quest & Klaim XP")}</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Quest Client Component ────────────────────────────────────────────
export default function TugasClient({ user, initialTasks, initialSubmissions }) {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [tasks] = useState(initialTasks ?? []);
  const [submissions, setSubm] = useState(initialSubmissions ?? []);
  const [activeTask, setActive] = useState(null);

  // Sync state if initialSubmissions prop updates from server
  useEffect(() => {
    setSubm(initialSubmissions ?? []);
  }, [initialSubmissions]);

  // Refresh server state when window / tab gains focus
  useEffect(() => {
    const handleFocus = () => {
      router.refresh();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [router]);

  // Quest Category Filter: "ALL" | "MAIN" | "SIDE"
  const [questCategory, setQuestCategory] = useState("ALL");

  // Status Filter: "ALL" | "NOT_STARTED" | "PENDING" | "APPROVED" | "REJECTED"
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");

  const statusFilterTabs = [
    { key: "ALL", label: t("member_tasks.tabs.all") || "Semua Status" },
    { key: "NOT_STARTED", label: t("member_tasks.tabs.not_started") || "Belum Selesai" },
    { key: "PENDING", label: t("member_tasks.tabs.pending") || "Review" },
    { key: "APPROVED", label: t("member_tasks.tabs.completed") || "Selesai" },
    { key: "REJECTED", label: t("member_tasks.tabs.rejected") || "Revisi" },
  ];

  // Derive submissions map
  const subMap = useMemo(() => {
    return Object.fromEntries(submissions.map((s) => [s.taskId, s]));
  }, [submissions]);

  // Split tasks into Main Quest and Side Quest
  const { mainQuests, sideQuests } = useMemo(() => {
    const mains = [];
    const sides = [];
    for (const tk of tasks) {
      if (getQuestType(tk) === "MAIN") {
        mains.push(tk);
      } else {
        sides.push(tk);
      }
    }
    return { mainQuests: mains, sideQuests: sides };
  }, [tasks]);

  // Filter tasks based on category, status, and search
  const filterTaskList = (taskList) => {
    return taskList
      .filter((tk) => {
        const status = getStatus(tk.id, submissions);
        if (statusFilter !== "ALL" && status !== statusFilter) return false;
        if (search && !tk.title.toLowerCase().includes(search.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  const filteredMainQuests = useMemo(() => filterTaskList(mainQuests), [mainQuests, statusFilter, search, submissions]);
  const filteredSideQuests = useMemo(() => filterTaskList(sideQuests), [sideQuests, statusFilter, search, submissions]);

  // Overall Stats
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const pendingCount = submissions.filter((s) => s.status === "PENDING").length;
  const totalTasks = tasks.length;
  const totalXPPoints = tasks.reduce((sum, t) => sum + (t.rewardXp || 0), 0);

  const handleSubmitSuccess = (newSub) => {
    setSubm((prev) => {
      const idx = prev.findIndex((s) => s.taskId === newSub.taskId);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = newSub;
        return next;
      }
      return [...prev, newSub];
    });
  };

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8 select-none overflow-x-hidden">
      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-600 dark:text-emerald-400 tracking-widest uppercase mb-3 shadow-sm">
            <Compass className="w-3.5 h-3.5 text-emerald-500" /> {t("member_tasks.badge_active") || "SRE Quest Board"}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
            {t("member_tasks.title") || "Quest & Misi"}
          </h1>
          <p className="text-slate-500 dark:text-white/50 text-xs sm:text-sm mt-2 font-medium max-w-2xl leading-relaxed">
            {t("member_tasks.subtitle") || "Selesaikan Main Quest dan Side Quest untuk mengumpulkan XP dan meningkatkan level keanggotaanmu!"}
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap w-full md:w-auto">
          {[
            { label: t("member_tasks.stats.total") || "Total Quest", val: totalTasks, color: "text-slate-700 dark:text-white" },
            { label: t("member_tasks.stats.review") || "Review", val: pendingCount, color: "text-amber-600 dark:text-amber-400" },
            { label: t("member_tasks.stats.completed") || "Selesai", val: approvedCount, color: "text-emerald-600 dark:text-emerald-400" },
            { label: t("member_tasks.stats.potential_xp") || "Potensi XP", val: `+${totalXPPoints}`, color: "text-amber-500 dark:text-amber-400 font-mono" },
          ].map((s) => (
            <div
              key={s.label}
              className="flex-1 sm:flex-initial flex flex-col items-center justify-center px-3 sm:px-3.5 py-2 bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-sm min-w-0"
            >
              <span className={`text-base sm:text-lg font-black ${s.color}`}>{s.val}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30 truncate max-w-full">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Quest Category Tabs (MAIN QUEST vs SIDE QUEST) ──────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="w-full overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 rounded-2xl w-max min-w-0">
          <button
            onClick={() => setQuestCategory("ALL")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              questCategory === "ALL"
                ? "bg-white dark:bg-[#0d1f17] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                : "text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t("member_tasks.categories.all") || "Semua Quest"}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 font-bold">
              {tasks.length}
            </span>
          </button>

          <button
            onClick={() => setQuestCategory("MAIN")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              questCategory === "MAIN"
                ? "bg-white dark:bg-[#162010] text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm"
                : "text-slate-500 dark:text-white/40 hover:text-amber-600 dark:hover:text-amber-300"
            }`}
          >
            <Crown className="w-3.5 h-3.5 fill-current text-amber-500" />
            <span>{t("member_tasks.categories.main") || "Main Quest (Misi Utama)"}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold border border-amber-500/25">
              {mainQuests.length}
            </span>
          </button>

          <button
            onClick={() => setQuestCategory("SIDE")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
              questCategory === "SIDE"
                ? "bg-white dark:bg-[#0a1e16] text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 shadow-sm"
                : "text-slate-500 dark:text-white/40 hover:text-emerald-600 dark:hover:text-emerald-300"
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t("member_tasks.categories.side") || "Side Quest (Misi Sampingan)"}</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/25">
              {sideQuests.length}
            </span>
          </button>
        </div>
      </motion.div>

      {/* ── Status Filter + Search & History Link ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-3 w-full min-w-0"
      >
        {/* Status Filter tabs */}
        <div className="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200/80 dark:border-white/8 rounded-2xl w-max min-w-0">
            {statusFilterTabs.map(({ key, label }) => {
              const count =
                key === "ALL"
                  ? tasks.length
                  : tasks.filter((tk) => getStatus(tk.id, submissions) === key).length;
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    statusFilter === key
                      ? "bg-white dark:bg-[#0d1f17] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-slate-500 dark:text-white/40 hover:text-slate-800 dark:hover:text-white/70"
                  }`}
                >
                  <span>{label}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${statusFilter === key ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-slate-200 dark:bg-white/10"}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search + Riwayat Button */}
        <div className="flex items-center gap-2 w-full lg:flex-1 min-w-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("member_tasks.search_placeholder") || "Cari judul quest..."}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/8 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          <Link
            href="/member/tugas/riwayat"
            className="group flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/8 hover:border-emerald-500/30 rounded-2xl transition-all duration-300 hover:shadow-[0_0_16px_rgba(16,185,129,0.1)] whitespace-nowrap shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-white/40 group-hover:text-emerald-500 transition-colors" />
            <span className="text-xs font-black text-slate-600 dark:text-white/60 group-hover:text-emerald-500 transition-colors">
              {t("member_tasks.history_btn") || "Riwayat Quest"}
            </span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-white/20 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </motion.div>

      {/* ── Quest Sections ────────────────────────────────────────── */}
      <div className="space-y-10">
        {/* ========================================================= */}
        {/* SECTION 1: MAIN QUEST (MISI UTAMA) */}
        {/* ========================================================= */}
        {(questCategory === "ALL" || questCategory === "MAIN") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 flex items-center justify-center shadow-sm">
                  <Crown className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === "en" ? "Main Quests" : "Main Quest (Misi Utama)"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-mono font-bold">
                      {filteredMainQuests.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    {t("member_tasks.main_desc") || "Misi utama organisasi dengan hadiah XP besar dan prioritas tinggi."}
                  </p>
                </div>
              </div>
            </div>

            {filteredMainQuests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredMainQuests.map((tk, i) => (
                  <QuestCard
                    key={tk.id}
                    task={tk}
                    submission={subMap[tk.id]}
                    isLocked={isTaskLocked(tk, submissions)}
                    onOpen={setActive}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 bg-white dark:bg-[#08120e] border border-dashed border-amber-500/20 rounded-3xl text-center text-xs text-slate-500 dark:text-white/40 flex flex-col items-center justify-center gap-2">
                <Crown className="w-7 h-7 text-amber-400/40" />
                <span>{t("member_tasks.empty_main") || "Tidak ada Main Quest yang sesuai dengan filter."}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SECTION 2: SIDE QUEST (MISI SAMPINGAN & TANTANGAN) */}
        {/* ========================================================= */}
        {(questCategory === "ALL" || questCategory === "SIDE") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-500/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                  <Swords className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{language === "en" ? "Side Quests" : "Side Quest (Misi Sampingan)"}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                      {filteredSideQuests.length}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    {t("member_tasks.side_desc") || "Misi sampingan dan tantangan mingguan untuk mendongkrak perolehan XP."}
                  </p>
                </div>
              </div>
            </div>

            {filteredSideQuests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSideQuests.map((tk, i) => (
                  <QuestCard
                    key={tk.id}
                    task={tk}
                    submission={subMap[tk.id]}
                    isLocked={isTaskLocked(tk, submissions)}
                    onOpen={setActive}
                    index={i}
                  />
                ))}
              </div>
            ) : (
              <div className="py-10 bg-white dark:bg-[#08120e] border border-dashed border-emerald-500/20 rounded-3xl text-center text-xs text-slate-500 dark:text-white/40 flex flex-col items-center justify-center gap-2">
                <Swords className="w-7 h-7 text-emerald-400/40" />
                <span>{t("member_tasks.empty_side") || "Tidak ada Side Quest yang sesuai dengan filter."}</span>
              </div>
            )}
          </div>
        )}

        {/* Global Empty State if completely empty */}
        {filteredMainQuests.length === 0 && filteredSideQuests.length === 0 && (
          <EmptyState
            icon={Compass}
            title={t("member_tasks.empty_title") || "Quest Tidak Ditemukan"}
            description={t("member_tasks.empty_desc") || "Tidak ada quest yang cocok dengan kata kunci atau filter pencarian Anda."}
            className="py-20 bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/5 rounded-3xl"
          />
        )}
      </div>

      {/* ── Quest Detail Modal ────────────────────────────────────── */}
      <AnimatePresence>
        {activeTask && (
          <QuestDetailModal
            task={activeTask}
            submission={subMap[activeTask.id]}
            isLocked={isTaskLocked(activeTask, submissions)}
            onClose={() => setActive(null)}
            onSubmitSuccess={(sub) => {
              handleSubmitSuccess(sub);
              setActive(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
