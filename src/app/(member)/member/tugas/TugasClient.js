"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban, Calendar, Zap, CheckCircle2, XCircle, Clock,
  ExternalLink, Send, X, AlertTriangle, UploadCloud,
  LinkIcon, FileText, ChevronRight, Filter, Search,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EmptyState, SectionHeader } from "../components/ui/CommonUI";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  NOT_STARTED: {
    label: "Belum Dikerjakan",
    badge: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10",
    border: "hover:border-blue-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]",
    dot: "bg-slate-300 dark:bg-white/20",
  },
  PENDING: {
    label: "Menunggu Review",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
    border: "hover:border-amber-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(245,158,11,0.12)]",
    dot: "bg-amber-400 animate-pulse",
  },
  APPROVED: {
    label: "Disetujui",
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
    border: "hover:border-emerald-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.12)]",
    dot: "bg-emerald-400",
  },
  REJECTED: {
    label: "Perlu Revisi",
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
    border: "hover:border-red-500/40",
    glow: "hover:shadow-[0_0_25px_rgba(239,68,68,0.12)]",
    dot: "bg-red-400",
  },
};

const FILTER_TABS = [
  { key: "ALL",         label: "Semua" },
  { key: "NOT_STARTED", label: "Belum" },
  { key: "PENDING",     label: "Review" },
  { key: "APPROVED",    label: "Selesai" },
  { key: "REJECTED",    label: "Revisi" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function getStatus(taskId, submissions) {
  const sub = submissions.find((s) => s.taskId === taskId);
  if (!sub)                       return "NOT_STARTED";
  if (sub.status === "APPROVED")  return "APPROVED";
  if (sub.status === "REJECTED")  return "REJECTED";
  return "PENDING";
}

function getDeadlineInfo(deadlineStr) {
  if (!deadlineStr) return { isOverdue: false, text: "Tanpa Deadline", isSoon: false, isUrgent: false };

  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline - now;

  if (diffMs < 0) {
    const overdueDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
    const text = overdueDays === 0 ? "Lewat deadline (Hari ini)" : `Lewat ${overdueDays} hari`;
    return { isOverdue: true, text, isSoon: false, isUrgent: false };
  }

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { isOverdue: false, text: `Tenggat ${diffHours} jam lagi`, isSoon: true, isUrgent: true };
  } else if (diffDays <= 3) {
    return { isOverdue: false, text: `Tenggat ${diffDays} hari lagi`, isSoon: true, isUrgent: false };
  } else {
    const formatted = deadline.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
    return { isOverdue: false, text: `${diffDays} hari lagi (${formatted})`, isSoon: false, isUrgent: false };
  }
}

// ─── Task Card ───────────────────────────────────────────────────────────────
function TaskCard({ task, submission, onOpen, index }) {
  const status   = getStatus(task.id, submission ? [submission] : []);
  const cfg      = STATUS_CONFIG[status];
  const dlInfo   = getDeadlineInfo(task.deadline);
  const canSubmit = status === "NOT_STARTED" || status === "REJECTED";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 ${cfg.border} ${cfg.glow} rounded-2xl p-5 transition-all duration-300 cursor-pointer hover:scale-[1.005] overflow-hidden`}
      onClick={() => onOpen(task)}
    >
      {/* Status dot indicator */}
      <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${cfg.dot}`} />

      {/* Hover gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.03) 0%, transparent 60%)" }} />

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon */}
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/25 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
          <FolderKanban className="w-5 h-5 text-slate-400 dark:text-white/40 group-hover:text-primary transition-colors" />
        </div>

        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-sm font-black text-slate-900 dark:text-white group-hover:text-primary transition-colors truncate">{task.title}</h4>
          <p className="text-[11px] text-slate-400 dark:text-white/40 mt-1 line-clamp-1">{task.description}</p>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            {/* Deadline chip */}
            <span className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border transition-all ${
              dlInfo.isOverdue
                ? "bg-red-500/15 text-red-500 border-red-500/30 font-black shadow-[0_0_10px_rgba(239,68,68,0.2)]"
                : dlInfo.isUrgent
                ? "bg-red-500/10 text-red-400 border-red-500/25 font-bold animate-pulse"
                : dlInfo.isSoon
                ? "bg-amber-500/10 text-amber-500 border-amber-500/25 font-bold"
                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10"
            }`}>
              <Clock className="w-3 h-3" />
              {dlInfo.text}
            </span>

            {/* XP chip */}
            <span className="flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 font-mono">
              <Zap className="w-3 h-3" />+{task.rewardXp} XP
            </span>

            {/* Status badge */}
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${cfg.badge}`}>
              {STATUS_CONFIG[status].label}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-slate-300 dark:text-white/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1.5" />
      </div>

      {/* Rejected feedback preview */}
      {status === "REJECTED" && submission?.feedback && (
        <div className="mt-3 ml-15 pl-4 border-l-2 border-red-500/30 relative z-10">
          <p className="text-[10px] text-red-500/80 font-medium italic line-clamp-1">"{submission.feedback}"</p>
        </div>
      )}
    </motion.div>
  );
}

// ─── Submit Modal ────────────────────────────────────────────────────────────
function TaskDetailModal({ task, submission, onClose, onSubmitSuccess }) {
  const { t }             = useLanguage();
  const router            = useRouter();
  const fileRef           = useRef(null);
  const [type, setType]   = useState(task?.submissionType === "LINK" ? "link" : "file");
  const [url, setUrl]     = useState(submission?.fileUrl ?? "");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const status    = getStatus(task.id, submission ? [submission] : []);
  const canSubmit = status === "NOT_STARTED" || status === "REJECTED";
  const statusCfg = STATUS_CONFIG[status];

  const maxMb = task?.maxUploadSizeMb || 10;
  const allowMulti = task?.allowMultipleFiles ?? false;

  const validateAndSetFiles = (rawFiles) => {
    setError("");
    let incoming = Array.from(rawFiles || []);

    for (const f of incoming) {
      if (f.size > maxMb * 1024 * 1024) {
        setError(`Ukuran berkas "${f.name}" (${(f.size / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${maxMb} MB.`);
        return;
      }
    }

    if (!allowMulti) {
      setFiles(incoming.slice(0, 1));
    } else {
      setFiles(prev => {
        const combined = [...prev];
        for (const file of incoming) {
          if (!combined.some(f => f.name === file.name && f.size === file.size)) {
            combined.push(file);
          }
        }
        return combined;
      });
    }
  };

  const removeFileAtIndex = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
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
        if (!url.trim()) { setError("Link tidak boleh kosong."); setLoading(false); return; }
        fd.append("fileUrl", url.trim());
      } else {
        if (files.length === 0) { setError("Pilih file terlebih dahulu."); setLoading(false); return; }
        for (const f of files) {
          if (f.size > maxMb * 1024 * 1024) {
            setError(`Ukuran berkas "${f.name}" melebihi batas maksimal ${maxMb} MB.`);
            setLoading(false);
            return;
          }
          fd.append("file", f);
        }
      }

      const res = await fetch(`/api/tasks/${task.id}/submissions`, { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim submisi.");

      setSuccess("🎉 Tugas berhasil disubmit! Menunggu review.");
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] relative"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between p-6 pb-4 bg-white dark:bg-[#07130e] border-b border-slate-100 dark:border-white/5">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${statusCfg.badge}`}>
                {statusCfg.label}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-black text-amber-500 font-mono">
                <Zap className="w-3 h-3" />+{task.rewardXp} XP
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">{task.title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-4">
            <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed whitespace-pre-line">{task.description}</p>
          </div>

          {/* Deadline + submission type + limits */}
          <div className="flex flex-wrap gap-2.5">
            {(() => {
              const isOverdue = task.deadline && new Date(task.deadline) < new Date();
              return (
                <span className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border ${
                  isOverdue
                    ? "bg-red-500/10 border-red-500/20 text-red-500"
                    : "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/50"
                }`}>
                  <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-red-500" : ""}`} />
                  Deadline: {new Date(task.deadline).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                  {isOverdue && (
                    <span className="ml-1 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-red-500 text-white">
                      Lewat Deadline
                    </span>
                  )}
                </span>
              );
            })()}
            <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              {type === "link" ? <LinkIcon className="w-3.5 h-3.5" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {type === "link" ? "Hanya Link / Tautan" : "Hanya File / Berkas"}
            </span>
            {type === "file" && (
              <>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                  Maks {maxMb} MB
                </span>
                <span className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                  {allowMulti ? "Boleh >1 File" : "Maks 1 File"}
                </span>
              </>
            )}
          </div>

          {/* Rejected feedback */}
          {status === "REJECTED" && submission?.feedback && (
            <div className="flex items-start gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-2xl">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-red-600 dark:text-red-400 mb-1">Feedback Reviewer:</p>
                <p className="text-sm text-slate-600 dark:text-white/60">{submission.feedback}</p>
              </div>
            </div>
          )}

          {/* Current submission preview */}
          {(status === "PENDING" || status === "APPROVED") && submission?.fileUrl && (
            <div className="flex items-center gap-3 p-4 bg-emerald-500/8 border border-emerald-500/20 rounded-2xl">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">Submisi kamu</p>
                <p className="text-xs text-slate-500 dark:text-white/40 truncate mt-0.5">{submission.fileUrl}</p>
              </div>
              <a href={submission.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition-colors flex-shrink-0">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}

          {/* ── Submit form ──────────────────────────────────────────── */}
          {canSubmit && (
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Link input */}
              {type === "link" && (
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://drive.google.com/... atau link lainnya"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}

              {/* File drop zone */}
              {type === "file" && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                    ${isDragging
                      ? "border-primary bg-primary/5"
                      : files.length > 0
                        ? "border-emerald-500/50 bg-emerald-500/5"
                        : "border-slate-300 dark:border-white/15 hover:border-primary/50 hover:bg-primary/5"}`}
                >
                  <input ref={fileRef} type="file" multiple={allowMulti} className="hidden" onChange={(e) => validateAndSetFiles(e.target.files)} />

                  {files.length > 0 ? (
                    <div className="space-y-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-white/10">
                        <span className="text-xs font-bold text-slate-600 dark:text-white/70">
                          {files.length} {allowMulti ? "berkas terpilih" : "berkas terpilih"}
                        </span>
                        <div className="flex items-center gap-3">
                          {allowMulti && (
                            <button
                              type="button"
                              onClick={() => fileRef.current?.click()}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              + Tambah File
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setFiles([])}
                            className="text-xs text-red-500 hover:underline"
                          >
                            Hapus Semua
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center gap-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{f.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-white/30 font-mono">{(f.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFileAtIndex(i)}
                              className="p-1 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Hapus file ini"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition-colors ${isDragging ? "text-primary" : "text-slate-300 dark:text-white/20"}`} />
                      <p className="text-sm font-black text-slate-600 dark:text-white/60">
                        {allowMulti ? "Drag & drop beberapa file di sini" : "Drag & drop file di sini"}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-white/30 mt-1">
                        {allowMulti ? "atau klik untuk memilih multiple file" : "atau klik untuk pilih file"}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}
                {success && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 p-3.5 bg-emerald-500/8 border border-emerald-500/20 rounded-xl">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{success}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 hover:from-primary-focus hover:to-emerald-500 text-sm font-black text-[#050e0a] tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 shadow-[0_0_25px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#050e0a]/30 border-t-[#050e0a] animate-spin" />
                    {type === "file" ? "Mengupload ke Google Drive..." : "Mengirim..."}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {status === "REJECTED" ? "Submit Ulang" : "Kirim Tugas"}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════
export default function TugasClient({ user, initialTasks, initialSubmissions }) {
  const { t }                   = useLanguage();
  const [tasks]                 = useState(initialTasks ?? []);
  const [submissions, setSubm]  = useState(initialSubmissions ?? []);
  const [activeTask, setActive] = useState(null);
  const [filter, setFilter]     = useState("ALL");
  const [search, setSearch]     = useState("");

  // Derive submissions map
  const subMap = Object.fromEntries(submissions.map((s) => [s.taskId, s]));

  // Filter + search tasks
  const visibleTasks = tasks
    .filter((tk) => {
      const status = getStatus(tk.id, submissions);
      if (filter !== "ALL" && status !== filter) return false;
      if (search && !tk.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Stats
  const approvedCount = submissions.filter((s) => s.status === "APPROVED").length;
  const pendingCount  = submissions.filter((s) => s.status === "PENDING").length;
  const totalTasks    = tasks.length;

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
    <div className="w-full space-y-8 select-none">

      {/* ── Header ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4"
      >
        <div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/25 text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-widest uppercase mb-3">
            <FolderKanban className="w-3 h-3" /> Penugasan Aktif
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
            {t("member_tasks.title")}
          </h1>
          <p className="text-slate-500 dark:text-white/45 text-sm mt-2 font-medium">
            {t("member_tasks.subtitle")}
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: "Total",   val: totalTasks,    color: "text-slate-700 dark:text-white" },
            { label: "Review",  val: pendingCount,  color: "text-amber-600 dark:text-amber-400" },
            { label: "Selesai", val: approvedCount, color: "text-emerald-600 dark:text-emerald-400" },
          ].map((s) => (
            <div key={s.label} className="flex flex-col items-center px-4 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-2xl shadow-sm">
              <span className={`text-xl font-black ${s.color}`}>{s.val}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">{s.label}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Filter + Search ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {/* Filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl overflow-x-auto">
          {FILTER_TABS.map(({ key, label }) => {
            const count = key === "ALL"
              ? tasks.length
              : tasks.filter((tk) => getStatus(tk.id, submissions) === key).length;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all duration-200 ${
                  filter === key
                    ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm"
                    : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"}`}
              >
                {label}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${filter === key ? "bg-primary/15" : "bg-slate-200 dark:bg-white/10"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search + Riwayat */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari tugas..."
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/8 rounded-2xl text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/25 focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
          <Link
            href="/member/tugas/riwayat"
            className="group flex items-center gap-1.5 px-3.5 py-2.5 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/8 hover:border-primary/30 rounded-2xl transition-all duration-300 hover:shadow-[0_0_16px_rgba(16,185,129,0.1)] whitespace-nowrap flex-shrink-0"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-white/40 group-hover:text-primary transition-colors" />
            <span className="text-xs font-black text-slate-600 dark:text-white/60 group-hover:text-primary transition-colors">Riwayat</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-white/20 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </motion.div>

      {/* ── Task Grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleTasks.length > 0 ? (
          visibleTasks.map((tk, i) => (
            <TaskCard
              key={tk.id}
              task={tk}
              submission={subMap[tk.id]}
              onOpen={setActive}
              index={i}
            />
          ))
        ) : (
          <div className="md:col-span-2">
            <EmptyState
              icon={FolderKanban}
              title={filter !== "ALL" ? `Tidak ada tugas dengan status "${FILTER_TABS.find(f => f.key === filter)?.label}"` : "Belum ada tugas"}
              description="Tugas akan muncul di sini saat sudah dibuat oleh admin."
              className="py-20 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl"
            />
          </div>
        )}
      </div>

      {/* ── Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeTask && (
          <TaskDetailModal
            task={activeTask}
            submission={subMap[activeTask.id]}
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
