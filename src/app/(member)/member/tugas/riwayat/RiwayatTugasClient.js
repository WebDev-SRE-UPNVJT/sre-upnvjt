"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, CheckCircle2, XCircle, Clock, Zap,
  ExternalLink, AlertTriangle, Calendar, ChevronDown, ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../components/ui/CommonUI";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CFG = {
  PENDING:  { label: "Menunggu Review", icon: Clock,         cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",    line: "bg-amber-400" },
  APPROVED: { label: "Disetujui",       icon: CheckCircle2,  cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", line: "bg-emerald-400" },
  REJECTED: { label: "Perlu Revisi",    icon: XCircle,       cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",             line: "bg-red-400" },
};

const FILTER_OPTS = [
  { key: "ALL",      label: "Semua" },
  { key: "PENDING",  label: "Menunggu" },
  { key: "APPROVED", label: "Disetujui" },
  { key: "REJECTED", label: "Revisi" },
];

function fmt(dateStr) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ─── Single timeline item ────────────────────────────────────────────────────
function SubmissionItem({ sub, index }) {
  const [expanded, setExpanded] = useState(false);
  const cfg   = STATUS_CFG[sub.status] ?? STATUS_CFG.PENDING;
  const Icon  = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-5"
    >
      {/* Timeline line */}
      <div className="flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border-2 z-10 ${
          sub.status === "APPROVED" ? "bg-emerald-500/15 border-emerald-500/30" :
          sub.status === "REJECTED" ? "bg-red-500/15 border-red-500/30" :
                                      "bg-amber-500/15 border-amber-500/30"}`}>
          <Icon className={`w-4 h-4 ${
            sub.status === "APPROVED" ? "text-emerald-500" :
            sub.status === "REJECTED" ? "text-red-500" : "text-amber-500"}`} />
        </div>
        <div className={`w-0.5 flex-1 mt-2 ${cfg.line} opacity-20`} />
      </div>

      {/* Card */}
      <div className="flex-1 pb-6">
        <div
          className={`bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm transition-all duration-300 ${
            sub.status === "APPROVED" ? "hover:border-emerald-500/25" :
            sub.status === "REJECTED" ? "hover:border-red-500/25" : "hover:border-amber-500/25"}`}
        >
          {/* Card header */}
          <div
            className="flex items-start justify-between gap-3 p-4 cursor-pointer"
            onClick={() => setExpanded(!expanded)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${cfg.cls}`}>
                  {cfg.label}
                </span>
                {sub.task?.rewardXp > 0 && sub.status === "APPROVED" && (
                  <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 font-mono">
                    <Zap className="w-3 h-3" />+{sub.task.rewardXp} XP diterima
                  </span>
                )}
              </div>
              <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">{sub.task?.title ?? "Tugas"}</h4>
              <div className="flex items-center gap-1.5 mt-1">
                <Calendar className="w-3 h-3 text-slate-400 dark:text-white/30" />
                <span className="text-[10px] text-slate-400 dark:text-white/30">
                  Dikumpulkan: {fmt(sub.submittedAt ?? sub.createdAt)}
                </span>
              </div>
            </div>

            <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-white/30 flex-shrink-0 transition-transform duration-300 mt-1 ${expanded ? "rotate-180" : ""}`} />
          </div>

          {/* Expanded detail */}
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-white/5 pt-3">
                  {/* Task description */}
                  {sub.task?.description && (
                    <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed">{sub.task.description}</p>
                  )}

                  {/* Submitted file/link */}
                  {sub.fileUrl && (
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/8 rounded-xl">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-slate-500 dark:text-white/40 uppercase tracking-wider mb-0.5">File/Link Submisi</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{sub.fileUrl}</p>
                      </div>
                      <a
                        href={sub.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-slate-400 dark:text-white/30 hover:text-primary transition-colors flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}

                  {/* Reviewer feedback */}
                  {sub.feedback && (
                    <div className={`flex items-start gap-2.5 p-3 rounded-xl border ${
                      sub.status === "REJECTED"
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-emerald-500/5 border-emerald-500/20"}`}>
                      <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        sub.status === "REJECTED" ? "text-red-500" : "text-emerald-500"}`} />
                      <div>
                        <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${
                          sub.status === "REJECTED" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          Catatan Reviewer:
                        </p>
                        <p className="text-xs text-slate-600 dark:text-white/60">{sub.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Deadline info */}
                  {sub.task?.deadline && (
                    <p className="text-[10px] text-slate-400 dark:text-white/25 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deadline tugas: {new Date(sub.task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
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

export default function RiwayatTugasClient({ submissions }) {
  const [filter, setFilter] = useState("ALL");

  const visible = submissions.filter(
    (s) => filter === "ALL" || s.status === filter
  );

  const approved = submissions.filter((s) => s.status === "APPROVED").length;
  const pending  = submissions.filter((s) => s.status === "PENDING").length;
  const rejected = submissions.filter((s) => s.status === "REJECTED").length;

  return (
    <div className="w-full space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Link
          href="/member/tugas"
          className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Daftar Tugas
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          Riwayat Tugas
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium">
          Semua pengumpulan tugas yang pernah kamu submit.
        </p>
      </motion.div>

      {/* ── Summary stats ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4"
      >
        {[
          { label: "Disetujui",  val: approved, cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
          { label: "Review",     val: pending,  cls: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/8 border-amber-500/20" },
          { label: "Revisi",     val: rejected, cls: "text-red-600 dark:text-red-400",        bg: "bg-red-500/8 border-red-500/20" },
        ].map((s) => (
          <div key={s.label} className={`flex flex-col items-center py-4 px-3 rounded-2xl border ${s.bg}`}>
            <span className={`text-3xl font-black ${s.cls}`}>{s.val}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mt-1">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Filter ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl w-fit"
      >
        {FILTER_OPTS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${
              filter === key
                ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm"
                : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"}`}
          >
            {label}
          </button>
        ))}
      </motion.div>

      {/* ── Timeline ────────────────────────────────────────────── */}
      {visible.length > 0 ? (
        <div className="relative">
          {visible.map((sub, i) => (
            <SubmissionItem key={sub.id} sub={sub} index={i} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderKanban}
          title="Belum ada riwayat"
          description={filter !== "ALL" ? `Tidak ada tugas dengan status "${FILTER_OPTS.find(f => f.key === filter)?.label}".` : "Kumpulkan tugas pertamamu sekarang!"}
          actionLabel="Lihat Tugas"
          actionHref="/member/tugas"
          className="py-20 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl"
        />
      )}
    </div>
  );
}
