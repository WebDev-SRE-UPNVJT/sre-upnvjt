"use client";

import React, { useState, useEffect } from "react";
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
    label: "Hadir",
    icon:  CheckCircle2,
    badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  ABSENT: {
    label: "Alpha",
    icon:  AlertTriangle,
    badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  },
  LATE: {
    label: "Terlambat",
    icon:  Clock,
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  EXCUSED: {
    label: "Izin",
    icon:  Info,
    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
};

// ─── Check-in Modal ──────────────────────────────────────────────────────────
function CheckInModal({ session, onClose, onSuccess }) {
  const { t }           = useLanguage();
  const [status, setStatus] = useState("PRESENT");
  const [token, setToken]   = useState("");
  const [notes, setNotes]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);
  const router = useRouter();

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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && !loading && !done && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-full max-w-lg bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.4)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Isi Presensi</p>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">{session.title}</h3>
            <p className="text-xs text-slate-500 dark:text-white/40 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(session.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          {!loading && !done && (
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 dark:text-white/40 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
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
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mb-1">Berhasil!</h4>
              <p className="text-sm text-slate-500 dark:text-white/50">{t("attendance_member.modal_success_msg")}</p>
              {(status === "PRESENT" || status === "LATE") && (
                <div className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black">
                  <Zap className="w-3.5 h-3.5" />+10 XP diterima!
                </div>
              )}
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Status selector */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3">Pilih Status Kehadiran</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: "PRESENT", label: "Hadir",     icon: CheckCircle2, active: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10", icon_active: "bg-emerald-500 text-white", text_active: "text-emerald-700 dark:text-emerald-400" },
                    { key: "LATE",    label: "Terlambat",  icon: Clock,        active: "border-amber-500 bg-amber-50 dark:bg-amber-500/10",       icon_active: "bg-amber-500 text-white",   text_active: "text-amber-700 dark:text-amber-400" },
                    { key: "EXCUSED", label: "Izin",       icon: Info,         active: "border-blue-500 bg-blue-50 dark:bg-blue-500/10",           icon_active: "bg-blue-500 text-white",    text_active: "text-blue-700 dark:text-blue-400" },
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
                    className="space-y-2"
                  >
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-primary" />
                      Token Presensi
                    </label>
                    <input
                      type="text"
                      value={token}
                      onChange={(e) => setToken(e.target.value.toUpperCase())}
                      placeholder="Masukkan token dari admin…"
                      required
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white font-black uppercase tracking-widest text-center text-lg focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all placeholder:text-slate-300 dark:placeholder:text-white/20 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal"
                    />
                    <p className="text-[10px] text-slate-400 dark:text-white/25 text-center">Token diberikan oleh admin saat sesi berlangsung</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="notes"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-2"
                  >
                    <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-white/40 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      Keterangan Izin
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Jelaskan alasan izin kamu…"
                      required
                      rows={3}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 text-slate-900 dark:text-white font-medium resize-none focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/10 transition-all"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/20 rounded-xl"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed hover:scale-[1.01]
                  ${status === "PRESENT" ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_25px_rgba(16,185,129,0.3)]" :
                    status === "LATE"    ? "bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_25px_rgba(245,158,11,0.3)]" :
                                          "bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_25px_rgba(59,130,246,0.3)]"}`}
              >
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Mengirim...</>
                ) : needsToken ? (
                  <><Check className="w-4 h-4" />Kirim Presensi</>
                ) : (
                  <><FileText className="w-4 h-4" />Kirim Izin</>
                )}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function AbsensiClient({ initialAttendance, validSessions = [], userRoleName = "Member" }) {
  const { t }              = useLanguage();
  const router             = useRouter();
  const [records, setRec]  = useState(initialAttendance ?? []);
  const [mounted, setMounted] = useState(false);
  const [activeSession, setActiveSession] = useState(null);

  useEffect(() => setMounted(true), []);

  // ─── Effective records (auto-ABSENT untuk sesi yang sudah lewat) ──
  const effectiveRecords = [...records];
  const pendingSessions  = [];

  for (const sess of validSessions) {
    const hasRecord = records.some((r) => r.sessionId === sess.id);
    if (!hasRecord) {
      if (!sess.isActive) {
        effectiveRecords.push({
          id: `auto-${sess.id}`,
          sessionId: sess.id,
          session: sess,
          status: "ABSENT",
          notes: t("attendance_member.auto_absent_msg"),
          createdAt: sess.date,
        });
      } else {
        pendingSessions.push(sess);
      }
    }
  }

  effectiveRecords.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const getCount = (s) => effectiveRecords.filter((r) => r.status === s).length;

  const totalValid    = validSessions.length;
  const presentTotal  = getCount("PRESENT") + getCount("LATE");
  const attendRate    = totalValid === 0 ? 0 : Math.round((presentTotal / totalValid) * 100);

  // Streak: hitung dari sesi terbaru ke belakang
  let streak = 0;
  const sortedSessions = [...validSessions].sort((a, b) => new Date(b.date) - new Date(a.date));
  for (const sess of sortedSessions) {
    const rec = effectiveRecords.find((r) => r.sessionId === sess.id);
    if (rec && (rec.status === "PRESENT" || rec.status === "LATE")) streak++;
    else break;
  }

  const onSuccess = (newRec) => setRec((prev) => [newRec, ...prev]);

  if (!mounted) return null;

  return (
    <div className="w-full relative space-y-8">

      {/* ── Ambient ────────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/8 dark:bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-[10px] font-black text-primary tracking-widest uppercase mb-3">
          <ClipboardCheck className="w-3 h-3" /> Presensi Member
        </span>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          {t("attendance_member.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">{userRoleName}</span>
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium">
          {t("attendance_member.subtitle")}
        </p>
      </motion.div>

      {/* Active Session Banner */}
      <AnimatePresence>
        {pendingSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative rounded-[2rem] p-[1.5px] overflow-hidden shadow-[0_15px_40px_rgba(245,158,11,0.15)]"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500 bg-[length:200%_auto] animate-[bgSlide_3s_linear_infinite]" />
            <div className="relative bg-[#0f0c00]/95 dark:bg-[#0f0c00]/98 backdrop-blur-xl rounded-[2rem] p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="absolute top-0 right-0 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

              <div className="flex items-center gap-4 flex-1 relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-7 h-7 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-400/70 mb-1">Sesi Terbuka</p>
                  <h3 className="text-lg font-black text-white">
                    {pendingSessions.length === 1
                      ? pendingSessions[0].title
                      : `${pendingSessions.length} sesi presensi menunggu`}
                  </h3>
                  <p className="text-xs text-white/50 mt-0.5">Segera isi sebelum sesi ditutup</p>
                </div>
              </div>

              <div className="flex flex-col gap-2 relative z-10 w-full md:w-auto">
                {pendingSessions.slice(0, 2).map((sess) => (
                  <button
                    key={sess.id}
                    onClick={() => setActiveSession(sess)}
                    className="flex items-center justify-between gap-4 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-amber-900 font-black text-sm rounded-2xl transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(245,158,11,0.4)]"
                  >
                    <span className="truncate">{sess.title}</span>
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Target}       value={`${attendRate}%`} label="Tingkat Kehadiran"  iconBg="bg-primary/10"    iconColor="text-primary"    iconBorder="border-primary/20"    delay={0.1} />
        <StatCard icon={Flame}        value={streak}           label="Streak Hadir"        iconBg="bg-orange-500/10" iconColor="text-orange-500" iconBorder="border-orange-500/20" delay={0.15} />
        <StatCard icon={CheckCircle2} value={presentTotal}     label="Total Hadir"         iconBg="bg-emerald-500/10" iconColor="text-emerald-500" iconBorder="border-emerald-500/20" delay={0.2} />
        <StatCard icon={AlertTriangle} value={getCount("ABSENT")} label="Alpha"           iconBg="bg-red-500/10"    iconColor="text-red-500"    iconBorder="border-red-500/20"    delay={0.25} />
      </div>

      {/* Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-3"
      >
        {[
          { key: "PRESENT", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { key: "LATE",    color: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/10 border-amber-500/20" },
          { key: "EXCUSED", color: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-500/10 border-blue-500/20" },
          { key: "ABSENT",  color: "text-red-600 dark:text-red-400",        bg: "bg-red-500/10 border-red-500/20" },
        ].map(({ key, color, bg }) => {
          const meta = STATUS_META[key];
          const Icon = meta.icon;
          return (
            <div key={key} className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${bg}`}>
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className={`text-xs font-black ${color}`}>{meta.label}</span>
              <span className={`text-xs font-black ${color}`}>{getCount(key)}x</span>
            </div>
          );
        })}
      </motion.div>

      {/* History Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <SectionHeader
          icon={Calendar}
          title="Riwayat Terakhir"
          actionLabel="Lihat Semua Riwayat"
          actionHref="/member/absensi/riwayat"
          className="mb-4"
        />

        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl">
          {effectiveRecords.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t("attendance_member.no_history")}
              description="Presensi kamu akan muncul di sini setelah mengikuti sesi."
              className="py-16"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead className="border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.015]">
                  <tr>
                    {["Sesi", "Tanggal", "Status", "Keterangan"].map((h) => (
                      <th key={h} className="px-5 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/30">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                  {effectiveRecords.slice(0, 6).map((rec, i) => {
                    const meta = STATUS_META[rec.status] ?? STATUS_META.ABSENT;
                    const Icon = meta.icon;
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
                          {new Date(rec.session?.date ?? rec.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${meta.badge}`}>
                            <Icon className="w-3 h-3" />
                            {meta.label}
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
                    Menampilkan 6 dari {effectiveRecords.length} sesi
                  </span>
                  <Link
                    href="/member/absensi/riwayat"
                    className="text-xs font-black text-primary hover:text-primary/80 transition-colors"
                  >
                    Lihat semua →
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
