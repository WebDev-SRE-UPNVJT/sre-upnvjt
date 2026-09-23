"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, CheckCircle2, XCircle, Clock, Zap,
  ExternalLink, AlertTriangle, Calendar, ChevronDown, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../components/ui/CommonUI";
import { useLanguage } from "@/i18n/LanguageProvider";
import { formatJakartaDisplay } from "@/lib/dateUtils";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING: {
    icon: Clock,
    cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    line: "bg-amber-400",
  },
  APPROVED: {
    icon: CheckCircle2,
    cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    line: "bg-emerald-400",
  },
  REJECTED: {
    icon: XCircle,
    cls: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25",
    line: "bg-rose-400",
  },
};

function getStatusLabel(status, t) {
  switch (status) {
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

function fmt(dateStr, language) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Single timeline item ────────────────────────────────────────────────────
function SubmissionItem({ sub, index }) {
  const { t, language } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CFG[sub.status] ?? STATUS_CFG.PENDING;
  const Icon = cfg.icon;
  const statusLabel = getStatusLabel(sub.status, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-3 sm:gap-5 w-full min-w-0"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2 z-10 transition-transform ${
            sub.status === "APPROVED"
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500"
              : sub.status === "REJECTED"
              ? "bg-rose-500/15 border-rose-500/30 text-rose-500"
              : "bg-amber-500/15 border-amber-500/30 text-amber-500"
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className={`w-0.5 flex-1 mt-2 ${cfg.line} opacity-20`} />
      </div>

      {/* Card */}
      <div className="flex-1 min-w-0 pb-5 sm:pb-6">
        <div
          className={`bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/5 rounded-xl overflow-hidden shadow-sm transition-all duration-300 ${
            sub.status === "APPROVED"
              ? "hover:border-emerald-500/30 hover:shadow-[0_4px_20px_rgba(16,185,129,0.08)]"
              : sub.status === "REJECTED"
              ? "hover:border-rose-500/30 hover:shadow-[0_4px_20px_rgba(244,63,94,0.08)]"
              : "hover:border-amber-500/30 hover:shadow-[0_4px_20px_rgba(245,158,11,0.08)]"
          }`}
        >
          {/* Card header */}
          <div
            className="flex items-start justify-between gap-2.5 sm:gap-3 p-3.5 sm:p-4.5 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5">
                <span
                  className={`text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border uppercase tracking-wider ${cfg.cls}`}
                >
                  {statusLabel}
                </span>
                {sub.task?.rewardXp > 0 && sub.status === "APPROVED" && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    <Zap className="w-3 h-3 fill-emerald-500" />+{sub.task.rewardXp}{" "}
                    {t("member_task_history.card.xp_received") || "XP diterima"}
                  </span>
                )}
              </div>

              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                {sub.task?.title ?? (language === "en" ? "Quest" : "Tugas")}
              </h4>

              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-white/30 shrink-0" />
                <span className="text-[10px] text-slate-400 dark:text-white/40 truncate">
                  {t("member_task_history.card.submitted_at", {
                    date: fmt(sub.submittedAt ?? sub.createdAt, language),
                  }) ||
                    (language === "en"
                      ? `Submitted: ${fmt(sub.submittedAt ?? sub.createdAt, language)}`
                      : `Dikumpulkan: ${fmt(sub.submittedAt ?? sub.createdAt, language)}`)}
                </span>
              </div>
            </div>

            <ChevronDown
              className={`w-4 h-4 text-slate-400 dark:text-white/30 shrink-0 transition-transform duration-300 mt-1 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="px-3.5 sm:px-4.5 pb-4 space-y-3 border-t border-slate-100 dark:border-white/5 pt-3">
                  {/* Task details */}
                  {(sub.task?.instructions || sub.task?.introduction) && (
                    <div
                      className="text-xs text-slate-600 dark:text-white/60 leading-relaxed prose prose-sm dark:prose-invert max-w-none break-words [&_p]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: sub.task.instructions || sub.task.introduction }}
                    />
                  )}

                  {/* Submitted file/link */}
                  {sub.fileUrl && (
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8 rounded-xl min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">
                          {t("member_task_history.card.file_link_label") || "Berkas / Tautan Submisi"}
                        </p>
                        <p className="text-xs font-bold text-slate-700 dark:text-white truncate">
                          {sub.fileUrl}
                        </p>
                      </div>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 dark:text-white/30 hover:text-emerald-500 transition-colors shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Reviewer feedback */}
                  {sub.feedback && (
                    <div
                      className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                        sub.status === "REJECTED"
                          ? "bg-rose-500/5 border-rose-500/20"
                          : "bg-emerald-500/10 border-emerald-500/25"
                      }`}
                    >
                      {sub.status === "REJECTED" ? (
                        <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p
                            className={`text-[10px] font-black uppercase tracking-wider ${
                              sub.status === "REJECTED"
                                ? "text-rose-600 dark:text-rose-400"
                                : "text-emerald-700 dark:text-emerald-300"
                            }`}
                          >
                            {sub.status === "REJECTED"
                              ? (t("member_task_history.card.reviewer_notes_revision") || "Catatan Revisi Reviewer:")
                              : (t("member_task_history.card.reviewer_notes") || "Catatan & Evaluasi Reviewer:")}
                          </p>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-white/80 whitespace-pre-line leading-relaxed font-medium">
                          {sub.feedback}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Deadline info */}
                  {sub.task?.deadline && (
                    <p className="text-[10px] text-slate-400 dark:text-white/30 flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {t("member_task_history.card.task_deadline", {
                        date: formatJakartaDisplay(
                          sub.task.deadline,
                          { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false },
                          language === "en" ? "en-US" : "id-ID"
                        ) + " WIB",
                      }) ||
                        (language === "en"
                          ? `Quest deadline: ${formatJakartaDisplay(sub.task.deadline, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }, "en-US")} WIB`
                          : `Tenggat waktu: ${formatJakartaDisplay(sub.task.deadline, { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }, "id-ID")} WIB`)}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function RiwayatTugasClient({ submissions = [] }) {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState("ALL");

  const filterOpts = [
    { key: "ALL", label: t("member_task_history.tabs.all") || "Semua" },
    { key: "PENDING", label: t("member_task_history.tabs.pending") || "Menunggu" },
    { key: "APPROVED", label: t("member_task_history.tabs.approved") || "Disetujui" },
    { key: "REJECTED", label: t("member_task_history.tabs.rejected") || "Revisi" },
  ];

  const visible = submissions.filter(
    (s) => filter === "ALL" || s.status === filter
  );

  const approved = submissions.filter((s) => s.status === "APPROVED").length;
  const pending = submissions.filter((s) => s.status === "PENDING").length;
  const rejected = submissions.filter((s) => s.status === "REJECTED").length;

  return (
    <div className="w-full max-w-full space-y-6 sm:space-y-8 overflow-x-hidden">
      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <Link
          href="/member/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("member_task_history.back_btn") || "Kembali ke Daftar Quest"}</span>
        </Link>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          {t("member_task_history.title") || "Riwayat Quest"}
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-xs sm:text-sm font-medium leading-relaxed">
          {t("member_task_history.subtitle") ||
            "Semua pengumpulan quest dan misi yang pernah kamu selesaikan."}
        </p>
      </motion.div>

      {/* ── Summary stats ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2 sm:gap-4 w-full"
      >
        {[
          {
            label: t("member_task_history.stats.approved") || (language === "en" ? "Approved" : "Disetujui"),
            val: approved,
            cls: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: t("member_task_history.stats.review") || (language === "en" ? "Review" : "Review"),
            val: pending,
            cls: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-500/10 border-amber-500/20",
          },
          {
            label: t("member_task_history.stats.rejected") || (language === "en" ? "Revision" : "Revisi"),
            val: rejected,
            cls: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-500/10 border-rose-500/20",
          },
        ].map((s) => (
          <div
            key={s.label}
            className={`flex flex-col items-center justify-center py-3 sm:py-4 px-2 sm:px-3 rounded-xl border ${s.bg} text-center min-w-0`}
          >
            <span className={`text-xl sm:text-3xl font-black ${s.cls}`}>{s.val}</span>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mt-1 truncate max-w-full">
              {s.label}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── Filter ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full max-w-full min-w-0 overflow-x-auto no-scrollbar py-0.5"
      >
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl w-max min-w-0">
          {filterOpts.map(({ key, label }) => {
            const count =
              key === "ALL"
                ? submissions.length
                : submissions.filter((s) => s.status === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-black whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  filter === key
                    ? "bg-white dark:bg-[#0d1f17] text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold ${
                    filter === key
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-white/40"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── Timeline ────────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div className="relative space-y-1">
          {visible.map((sub, i) => (
            <SubmissionItem key={sub.id} sub={sub} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title={t("member_task_history.empty_title") || "Belum ada riwayat quest"}
          description={
            filter !== "ALL"
              ? t("member_task_history.empty_filter", {
                  status: filterOpts.find((f) => f.key === filter)?.label,
                }) ||
                `Tidak ada quest dengan status "${filterOpts.find((f) => f.key === filter)?.label}".`
              : t("member_task_history.empty_desc") ||
                "Kumpulkan quest pertamamu sekarang!"
          }
          actionLabel={t("member_task_history.btn_view_tasks") || "Lihat Daftar Quest"}
          actionHref="/member/tugas"
          className="py-16 sm:py-20 bg-white dark:bg-[#08120e] border border-slate-200/80 dark:border-white/10 rounded-xl"
        />
      )}
    </div>
  );
}
