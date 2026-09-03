"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ClipboardCheck, Calendar, Info, Clock, AlertTriangle,
  CheckCircle2, Flame, Award, Trophy, Target, X, Check,
  FileText, Key, ChevronRight, Zap, Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import StatCard from "../components/ui/StatCard";
import { EmptyState, SectionHeader } from "../components/ui/CommonUI";
import Link from "next/link";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_META = {
  PRESENT: {
    icon:  CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  ABSENT: {
    icon:  AlertTriangle,
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  },
  LATE: {
    icon:  Clock,
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  EXCUSED: {
    icon:  Info,
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
};

function getStatusLabel(status, t) {
  switch (status) {
    case "PRESENT": return t("attendance_member.status_present") || "Hadir";
    case "LATE":    return t("attendance_member.status_late") || "Terlambat";
    case "EXCUSED": return t("attendance_member.status_excused") || "Izin";
    case "ABSENT":  return t("attendance_member.status_absent") || "Alpha";
    default:        return status;
  }
}

// ─── Check-in Modal ──────────────────────────────────────────────────────────
function CheckInModal({ session, onClose, onSuccess }) {
  const { t, language }           = useLanguage();
  const [status, setStatus] = useState("PRESENT");
  const [token, setToken]   = useState("");
  const [notes, setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const router = useRouter();

  // Lock body scroll when modal is open
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const needsToken = status === "PRESENT" || status === "LATE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          status,
          notes,
          token: needsToken ? token : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal mengirim presensi");

      setDone(true);
      onSuccess(data.attendance);
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const modalNode = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto"
      onClick={(e) => e.target === e.currentTarget && !loading && !done && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] shrink-0">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">{t("attendance_member.modal.title") || "Isi Presensi"}</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{session.title}</h3>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(session.date).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {!loading && !done && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Success state */}
          {done ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-10 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center mb-4">
                <Check className="w-10 h-10 text-emerald-500" />
              </div>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">{t("attendance_member.modal.success_title") || "Berhasil!"}</h4>
              <p className="text-sm text-slate-500 dark:text-white/50">{t("attendance_member.modal.success_msg") || "Presensi berhasil dicatat!"}</p>
              {(status === "PRESENT" || status === "LATE") && (
                <div className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black">
                  <Zap className="w-3.5 h-3.5" />{t("attendance_member.modal.xp_received") || "+10 XP diterima!"}
                </div>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Status selector */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3">{t("attendance_member.modal.select_status") || "Pilih Status Kehadiran"}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "PRESENT", label: t("attendance_member.status_present") || "Hadir",     icon: CheckCircle2, active: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", icon_active: "bg-emerald-500 text-white", text_active: "text-emerald-700 dark:text-emerald-400" },
                    { key: "LATE",    label: t("attendance_member.status_late") || "Terlambat",  icon: Clock,        active: "border-amber-500 bg-amber-50 dark:bg-amber-500/10",       icon_active: "bg-amber-500 text-white",   text_active: "text-amber-700 dark:text-amber-400" },
                    { key: "EXCUSED", label: t("attendance_member.status_excused") || "Izin",       icon: Info,         active: "border-blue-500 bg-blue-50 dark:bg-blue-500/10",           icon_active: "bg-blue-500 text-white",    text_active: "text-blue-700 dark:text-blue-400" },
                  ].map(({ key, label, icon: Icon, active, icon_active, text_active }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setStatus(key); setError(""); }}
                      className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all duration-200 ${
                        status === key ? active : "border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20"}`}
                    >
                      <div className={`p-2.5 rounded-full transition-colors ${status === key ? icon_active : "bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/30"}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-black transition-colors ${status === key ? text_active : "text-slate-500 dark:text-white/40"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Token / Notes input */}
              <AnimatePresence mode="wait">
                {needsToken ? (
                  <motion.div
                    key="token"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      {t("attendance_member.modal.token_label") || "Token Kehadiran (Dari Pemateri)"}
                    </label>
                    <input
                      type="text"
                      required
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      placeholder={t("attendance_member.modal.token_placeholder") || "Contoh: SRE2026"}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-mono font-black tracking-widest text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 uppercase focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-1.5"
                  >
                    <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-white/60 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      {t("attendance_member.modal.notes_label") || "Keterangan / Alasan"}
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder={t("attendance_member.modal.notes_placeholder") || "Jelaskan alasan izin / sakit kamu..."}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Optional note for PRESENT / LATE */}
              {needsToken && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-400 dark:text-white/40">
                    {t("attendance_member.modal.notes_late_label") || "Catatan Tambahan (Opsional)"}
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("attendance_member.modal.notes_late_placeholder") || "Tuliskan alasan keterlambatan bila ada..."}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all"
                  />
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-bold rounded-2xl">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 hover:from-primary-focus hover:to-emerald-500 text-[#050e0a] font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-[#050e0a]/30 border-t-[#050e0a] animate-spin" />
                    <span>{t("attendance_member.modal.btn_submitting") || "Mengirim..."}</span>
                  </>
                ) : (
                  <span>{t("attendance_member.modal.btn_submit") || "Kirim Presensi"}</span>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );

  return typeof document !== "undefined" ? createPortal(modalNode, document.body) : null;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AbsensiClient({ initialSessions, validSessions, initialAttendance, user, userRoleName }) {
  const { t, language }     = useLanguage();
  const [sessions, setSessions] = useState(initialSessions || validSessions || []);
  const [records, setRecs]  = useState(initialAttendance ?? []);
  const [activeSession, setActiveSession] = useState(null);
  const [statusFilter, setStatusFilter]   = useState("ALL");

  useEffect(() => {
    if (initialSessions || validSessions) {
      setSessions(initialSessions || validSessions || []);
    }
  }, [initialSessions, validSessions]);

  useEffect(() => {
    if (initialAttendance) {
      setRecs(initialAttendance);
    }
  }, [initialAttendance]);

  // Effective records (termasuk auto-ABSENT untuk sesi lampau yang belum diisi)
  const effectiveRecords = sessions
    .filter((s) => !s.isActive || records.some((r) => r.sessionId === s.id))
    .map((sess) => {
      const rec = records.find((r) => r.sessionId === sess.id);
      if (rec) return { ...rec, session: sess };
      return {
        id:        `auto-${sess.id}`,
        sessionId: sess.id,
        session:   sess,
        status:    "ABSENT",
        notes:     t("attendance_member.auto_absent_msg") || "Tidak mengisi presensi",
        createdAt: sess.date,
      };
    })
    .sort((a, b) => new Date(b.session?.date ?? b.createdAt) - new Date(a.session?.date ?? a.createdAt));

  // Sesi yang masih aktif dan belum diisi oleh user
  const pendingSessions = sessions.filter(
    (s) => Boolean(s.isActive) && !records.some((r) => r.sessionId === s.id)
  );

  // Stats calculation
  const totalCompleted = effectiveRecords.length;
  const presentCount   = effectiveRecords.filter((r) => r.status === "PRESENT").length;
  const lateCount      = effectiveRecords.filter((r) => r.status === "LATE").length;
  const presentTotal   = presentCount + lateCount;
  const attendRate     = totalCompleted === 0 ? 100 : Math.round((presentTotal / totalCompleted) * 100);

  // Streak calculation (dari sesi terlama ke terbaru)
  const streak = [...effectiveRecords]
    .reverse()
    .reduce((acc, curr) => (curr.status === "PRESENT" || curr.status === "LATE" ? acc + 1 : 0), 0);

  const getCount = (st) => effectiveRecords.filter((r) => r.status === st).length;

  const onSuccess = (newRec) => {
    setRecs((prev) => {
      const filtered = prev.filter((r) => r.sessionId !== newRec.sessionId);
      return [newRec, ...filtered];
    });
  };

  const displayedRecords = effectiveRecords.filter(
    (r) => statusFilter === "ALL" || r.status === statusFilter
  );

  return (
    <div className="w-full relative space-y-8">

      {/* ── Ambient ────────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/8 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-black text-primary tracking-widest uppercase mb-3">
          <ClipboardCheck className="w-3 h-3" /> {t("attendance_member.badge_member") || "Presensi Member"}
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          {t("attendance_member.title")} 
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium">
          {t("attendance_member.subtitle")}
        </p>
      </motion.div>

      {/* ── Active Session Banner (Hero / Card Grid) ─────────────── */}
      <AnimatePresence>
        {pendingSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative rounded-3xl p-[1.5px] overflow-hidden bg-gradient-to-r from-amber-500/80 via-orange-400 to-amber-500/80 shadow-[0_15px_45px_rgba(245,158,11,0.18)]"
          >
            {/* Ambient Background Gradient & Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
            
            <div className="relative bg-gradient-to-br from-slate-900/95 via-[#120e06]/98 to-[#0b1410]/95 dark:from-[#0d0a02]/98 dark:via-[#09120e]/98 dark:to-[#040a08]/98 backdrop-blur-2xl rounded-[calc(1.5rem-1px)] p-6 sm:p-7 md:p-8 overflow-hidden">
              
              {/* Decorative radial glows */}
              <div className="absolute -top-16 -left-16 w-52 h-52 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-16 -right-16 w-60 h-60 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

              {pendingSessions.length === 1 ? (
                /* ── Single Active Session Layout ── */
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left Column Info */}
                  <div className="space-y-3.5 flex-1 min-w-0">
                    {/* Metadata Badges */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wider uppercase shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        {t("attendance_member.open_session") || "Sesi Terbuka"}
                      </span>

                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-[11px] font-black">
                        <Zap className="w-3.5 h-3.5" />
                        +10 XP
                      </span>

                      <span className="inline-flex items-center gap-1.5 text-slate-300 dark:text-white/60 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5 text-amber-400/80" />
                        {new Date(pendingSessions[0].date).toLocaleDateString(language === "en" ? "en-US" : "id-ID", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-tight leading-tight">
                        {pendingSessions[0].title}
                      </h2>
                      <p className="text-slate-300/80 dark:text-white/60 text-xs sm:text-sm mt-1.5 font-medium max-w-2xl">
                        {pendingSessions[0].description || (t("attendance_member.open_session_warn") || "Segera isi presensi sebelum sesi ditutup.")}
                      </p>
                    </div>
                  </div>

                  {/* Right Column Action */}
                  <div className="relative z-10 pt-2 lg:pt-0 shrink-0">
                    <button
                      onClick={() => setActiveSession(pendingSessions[0])}
                      className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-300 hover:via-orange-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-widest transition-all duration-300 shadow-[0_0_25px_rgba(245,158,11,0.35)] hover:shadow-[0_0_35px_rgba(245,158,11,0.55)] hover:scale-[1.02] active:scale-95 cursor-pointer"
                    >
                      <Key className="w-4 h-4 text-slate-950/80 group-hover:rotate-12 transition-transform duration-300" />
                      <span>{t("attendance_member.modal.title") || "Isi Presensi Sekarang"}</span>
                      <ChevronRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform duration-300" />
                    </button>
                  </div>
                </div>
              ) : (
                /* ── Multiple Active Sessions Layout ── */
                <div className="relative z-10 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-black tracking-wider uppercase">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                        </span>
                        {t("attendance_member.open_session") || "Sesi Terbuka"}
                      </span>
                      <span className="text-xs font-bold text-amber-200/90">
                        {pendingSessions.length} {t("attendance_member.pending_count") || "sesi presensi menunggu"}
                      </span>
                    </div>
                    <p className="text-xs text-white/50">{t("attendance_member.open_session_warn") || "Segera isi sebelum sesi ditutup"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {pendingSessions.map((sess) => (
                      <div
                        key={sess.id}
                        className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-primary/15 text-primary text-[10px] font-black">+10 XP</span>
                            <span className="text-[11px] text-white/50 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3 text-amber-400/80" />
                              {new Date(sess.date).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <h4 className="text-sm sm:text-base font-black text-white truncate">{sess.title}</h4>
                        </div>
                        <button
                          onClick={() => setActiveSession(sess)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-xs uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-amber-500/20 shrink-0 cursor-pointer"
                        >
                          <span>{t("attendance_member.modal.title") || "Isi Presensi"}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target}       value={`${attendRate}%`} label={t("attendance_member.stat_rate") || "Tingkat Kehadiran"}  iconBg="bg-primary/10"    iconColor="text-primary"    iconBorder="border-primary/20"    delay={0.1} />
        <StatCard icon={Flame}        value={streak}           label={t("attendance_member.stat_streak") || "Streak Hadir"}        iconBg="bg-orange-500/10" iconColor="text-orange-500" iconBorder="border-orange-500/20" delay={0.15} />
        <StatCard icon={CheckCircle2} value={presentTotal}     label={t("attendance_member.stat_total_present") || "Total Hadir"}         iconBg="bg-emerald-500/10" iconColor="text-emerald-500" iconBorder="border-emerald-500/20" delay={0.2} />
        <StatCard icon={AlertTriangle} value={getCount("ABSENT")} label={t("attendance_member.stat_absent") || "Alpha"}           iconBg="bg-red-500/10"    iconColor="text-red-500"    iconBorder="border-red-500/20"    delay={0.25} />
      </div>

      {/* History Table with Integrated Interactive Filters */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
            <h3 className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
              {t("attendance_member.recent_history") || "Riwayat Terakhir"}
            </h3>
            <Link
              href="/member/absensi/riwayat"
              className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary hover:bg-primary hover:text-white dark:hover:text-[#050e0a] hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0"
            >
              {t("attendance_member.view_all_history") || "Lihat Semua Riwayat"}
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { key: "ALL", label: t("attendance_member.status_all") || "Semua", count: effectiveRecords.length },
              { key: "PRESENT", label: t("attendance_member.status_present") || "Hadir", count: getCount("PRESENT") },
              { key: "LATE", label: t("attendance_member.status_late") || "Terlambat", count: getCount("LATE") },
              { key: "EXCUSED", label: t("attendance_member.status_excused") || "Izin", count: getCount("EXCUSED") },
              { key: "ABSENT", label: t("attendance_member.status_absent") || "Alpha", count: getCount("ABSENT") },
            ].map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? "bg-primary text-slate-950 shadow-md shadow-primary/20 scale-[1.02]"
                      : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 hover:bg-slate-200 dark:hover:bg-white/10"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${isActive ? "bg-black/15 text-slate-950 font-bold" : "bg-black/10 dark:bg-white/10 text-slate-500 dark:text-white/40"}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl">
          {displayedRecords.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t("attendance_member.empty_history_title") || "Belum ada riwayat"}
              description={t("attendance_member.empty_history_desc") || "Tidak ada catatan presensi untuk filter status yang dipilih."}
              className="py-16"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.015]">
                  <tr>
                    {[
                      t("attendance_member.th_session") || "Sesi",
                      t("attendance_member.th_date") || "Tanggal",
                      t("attendance_member.th_status") || "Status",
                      t("attendance_member.th_notes") || "Keterangan"
                    ].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {displayedRecords.slice(0, 6).map((rec, i) => {
                    const meta = STATUS_META[rec.status] ?? STATUS_META.ABSENT;
                    const Icon = meta.icon;
                    const statusLabel = getStatusLabel(rec.status, t);
                    return (
                      <motion.tr
                        key={rec.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0">
                              <Target className="w-4 h-4 text-primary" />
                            </div>
                            <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[160px]">
                              {rec.session?.title ?? "Sesi Kehadiran"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-500 dark:text-white/40 whitespace-nowrap">
                          {new Date(rec.session?.date ?? rec.createdAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${meta.badge}`}>
                            <Icon className="w-3 h-3" />
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-400 dark:text-white/30 max-w-[200px] truncate">
                          {rec.notes ?? <span className="italic opacity-50">—</span>}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>

              {effectiveRecords.length > 6 && (
                <div className="px-5 py-3.5 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-xs text-slate-400 dark:text-white/30">
                    {t("attendance_member.showing_x_of_y", { shown: 6, total: effectiveRecords.length }) || `Menampilkan 6 dari ${effectiveRecords.length} sesi`}
                  </span>
                  <Link
                    href="/member/absensi/riwayat"
                    className="text-xs font-black text-primary hover:text-primary/80 transition-colors"
                  >
                    {t("attendance_member.view_all_arrow") || "Lihat semua →"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeSession && (
          <CheckInModal
            session={activeSession}
            onClose={() => setActiveSession(null)}
            onSuccess={onSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
