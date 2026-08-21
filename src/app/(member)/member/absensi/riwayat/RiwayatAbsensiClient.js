"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Calendar, CheckCircle2, AlertTriangle,
  Clock, Info, Target, ArrowLeft, Flame, TrendingUp, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/i18n/LanguageProvider";
import { EmptyState } from "../../components/ui/CommonUI";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_META = {
  PRESENT: { color: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  LATE:    { color: "bg-amber-400",   badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",         icon: Clock },
  EXCUSED: { color: "bg-blue-400",    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",             icon: Info },
  ABSENT:  { color: "bg-red-500",     badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",                 icon: AlertTriangle },
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

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_ID   = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];
const DAYS_EN   = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ─── Heatmap calendar ───────────────────────────────────────────────────────
function AttendanceHeatmap({ records, t, language }) {
  const monthsArr = language === "en" ? MONTHS_EN : MONTHS_ID;
  const daysArr   = language === "en" ? DAYS_EN : DAYS_ID;

  // Build a map dari dateString → status
  const statusMap = {};
  for (const rec of records) {
    const dateKey = new Date(rec.session?.date ?? rec.createdAt).toISOString().split("T")[0];
    statusMap[dateKey] = rec.status;
  }

  // Periode 1 Tahun Kepengurusan: 12 Bulan (Agustus 2026 - Juli 2027)
  const today = new Date();
  const currentYear = today.getFullYear();
  // Mulai dari Agustus tahun periode (misal 2026) hingga Juli tahun berikutnya (misal 2027) = 12 bulan
  const periodStartYear = today.getMonth() >= 7 ? currentYear : currentYear - 1;
  const start = new Date(periodStartYear, 7, 1); // 1 Agustus
  const end   = new Date(periodStartYear + 1, 6, 31); // 31 Juli tahun berikutnya (tepat 12 bulan)

  const months = [];
  let cur = new Date(start);
  while (cur <= end) {
    const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    if (!months.find((m) => m.key === monthKey)) {
      const yearSuffix = cur.getFullYear() !== periodStartYear ? ` '${String(cur.getFullYear()).slice(-2)}` : "";
      months.push({
        key:   monthKey,
        label: `${monthsArr[cur.getMonth()]}${yearSuffix}`,
        year:  cur.getFullYear(),
        month: cur.getMonth(),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div className="space-y-6">
      {/* Responsive Calendar Grid (Wraps to next lines naturally) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {months.map(({ key, label, year, month }) => {
          const daysInMonth  = new Date(year, month + 1, 0).getDate();
          const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0=Mon

          const weeks = [];
          let week = Array(firstDayOfWeek).fill(null);
          for (let d = 1; d <= daysInMonth; d++) {
            week.push(d);
            if (week.length === 7 || d === daysInMonth) {
              while (week.length < 7) week.push(null);
              weeks.push(week);
              week = [];
            }
          }

          return (
            <div
              key={key}
              className="bg-slate-50/70 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/5 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all hover:border-primary/30 dark:hover:border-primary/30"
            >
              {/* Month & Year Header */}
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/5 pb-2">
                <p className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">{label}</p>
                <span className="text-[10px] font-bold text-slate-400 dark:text-white/30">{year}</span>
              </div>

              {/* Day of Week Labels */}
              <div className="grid grid-cols-7 gap-1 text-center">
                {daysArr.map((d) => (
                  <span key={d} className="text-[9px] font-bold text-slate-400 dark:text-white/30">{d}</span>
                ))}
              </div>

              {/* Weeks & Days Grid */}
              <div className="space-y-1">
                {weeks.map((wk, wi) => (
                  <div key={wi} className="grid grid-cols-7 gap-1">
                    {wk.map((day, di) => {
                      if (!day) return <div key={di} className="w-full aspect-square" />;
                      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const st      = statusMap[dateStr];
                      const isFuture = new Date(dateStr) > today;

                      return (
                        <div
                          key={di}
                          title={st ? `${dateStr}: ${getStatusLabel(st, t)}` : `${dateStr}`}
                          className={`w-full aspect-square max-w-[32px] mx-auto rounded-lg flex items-center justify-center text-[10px] font-bold transition-all duration-200 hover:scale-110 cursor-default border
                            ${isFuture ? "bg-slate-100/50 dark:bg-white/[0.02] border-transparent text-slate-300 dark:text-white/15" :
                              st === "PRESENT" ? "bg-emerald-500 text-white border-emerald-600/50 shadow-[0_0_8px_rgba(16,185,129,0.35)]" :
                              st === "LATE"    ? "bg-amber-400 text-amber-950 border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.3)]" :
                              st === "EXCUSED" ? "bg-blue-400 text-white border-blue-500/50" :
                              st === "ABSENT"  ? "bg-red-500/80 text-white border-red-600/50" :
                                                "bg-slate-100 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-white/50"}`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-slate-100 dark:border-white/5 flex-wrap">
        {[
          { color: "bg-emerald-500", label: t("attendance_member.status_present") || "Hadir" },
          { color: "bg-amber-400",   label: t("attendance_member.status_late") || "Terlambat" },
          { color: "bg-blue-400",    label: t("attendance_member.status_excused") || "Izin" },
          { color: "bg-red-500/80",  label: t("attendance_member.status_absent") || "Alpha" },
          { color: "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/50", label: t("attendance_member.history_page.no_sessions") || "Belum ada sesi" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-md border border-slate-200/50 dark:border-white/10 ${color} flex items-center justify-center text-[8px] font-bold`} />
            <span className="text-[11px] font-bold text-slate-600 dark:text-white/40">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Record item with accordion ──────────────────────────────────────────────
function RecordItem({ rec, index, t, language }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[rec.status] ?? STATUS_META.ABSENT;
  const Icon = meta.icon;
  const date = new Date(rec.session?.date ?? rec.createdAt);
  const statusLabel = getStatusLabel(rec.status, t);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-sm dark:hover:border-white/10"
    >
      <div
        className="flex items-center justify-between gap-4 p-4 cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${meta.badge}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">{rec.session?.title ?? "Sesi Kehadiran"}</p>
            <p className="text-[10px] text-slate-400 dark:text-white/30 mt-0.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date.toLocaleDateString(language === "en" ? "en-US" : "id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
            {statusLabel}
          </span>
          <ChevronDown className={`w-4 h-4 text-slate-400 dark:text-white/30 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-slate-100 dark:border-white/5 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider">{t("attendance_member.history_page.submit_time") || "Waktu Submit"}</span>
                <span className="font-bold text-slate-700 dark:text-white/70">
                  {new Date(rec.createdAt).toLocaleTimeString(language === "en" ? "en-US" : "id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {rec.notes && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider flex-shrink-0">{t("attendance_member.th_notes") || "Keterangan"}</span>
                  <span className="font-medium text-slate-600 dark:text-white/60 text-right">{rec.notes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RiwayatAbsensiClient({ records, allSessions }) {
  const { t, language } = useLanguage();
  const [filter, setFilter] = useState("ALL");

  // Effective records — tambahkan ABSENT otomatis untuk sesi yang terlewat
  const effectiveRecords = useMemo(() => {
    const all = [...records];
    for (const sess of allSessions) {
      const has = records.some((r) => r.sessionId === sess.id);
      if (!has && !sess.isActive) {
        all.push({
          id:        `auto-${sess.id}`,
          sessionId: sess.id,
          session:   sess,
          status:    "ABSENT",
          notes:     t("attendance_member.auto_absent_msg") || "Tidak mengisi presensi",
          createdAt: sess.date,
        });
      }
    }
    return all.sort((a, b) => new Date(b.session?.date ?? b.createdAt) - new Date(a.session?.date ?? a.createdAt));
  }, [records, allSessions, t]);

  const visible = filter === "ALL" ? effectiveRecords : effectiveRecords.filter((r) => r.status === filter);

  const present  = effectiveRecords.filter((r) => r.status === "PRESENT").length;
  const late     = effectiveRecords.filter((r) => r.status === "LATE").length;
  const excused  = effectiveRecords.filter((r) => r.status === "EXCUSED").length;
  const absent   = effectiveRecords.filter((r) => r.status === "ABSENT").length;
  const total    = allSessions.length;
  const rate     = total === 0 ? 0 : Math.round(((present + late) / total) * 100);

  return (
    <div className="w-full space-y-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/member/absensi" className="inline-flex items-center gap-1.5 text-xs font-black text-primary hover:text-primary/80 transition-colors mb-4">
          <ArrowLeft className="w-3.5 h-3.5" /> {t("attendance_member.history_page.back_btn") || "Kembali ke Absensi"}
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          {t("attendance_member.history_page.title") || "Riwayat Presensi"}
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium max-w-lg">
          {t("attendance_member.history_page.subtitle") || "Rekap lengkap kehadiran kamu di seluruh sesi SRE UPNVJT."}
        </p>
      </motion.div>

      {/* ── Summary pills ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("attendance_member.status_present") || "Hadir",     val: present,  cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
          { label: t("attendance_member.status_late") || "Terlambat", val: late,     cls: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/8 border-amber-500/20" },
          { label: t("attendance_member.status_excused") || "Izin",      val: excused,  cls: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-500/8 border-blue-500/20" },
          { label: t("attendance_member.status_absent") || "Alpha",     val: absent,   cls: "text-red-600 dark:text-red-400",        bg: "bg-red-500/8 border-red-500/20" },
        ].map((s) => (
          <div key={s.label} className={`flex flex-col items-center py-4 px-3 rounded-2xl border ${s.bg}`}>
            <span className={`text-3xl font-black ${s.cls}`}>{s.val}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-white/40 mt-1">{s.label}</span>
          </div>
        ))}
      </motion.div>

      {/* ── Rate bar ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="text-sm font-black text-slate-900 dark:text-white">{t("attendance_member.history_page.attendance_rate") || "Tingkat Kehadiran"}</span>
          </div>
          <span className="text-2xl font-black text-primary">{rate}%</span>
        </div>
        <div className="w-full h-3 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden border border-slate-200 dark:border-white/5">
          <motion.div
            className={`h-full rounded-full ${rate >= 80 ? "bg-gradient-to-r from-primary to-emerald-400" : rate >= 50 ? "bg-gradient-to-r from-amber-400 to-orange-400" : "bg-gradient-to-r from-red-500 to-rose-400"}`}
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1], delay: 0.3 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">0%</span>
          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">{t("attendance_member.history_page.min_active_req") || "Min. 80% untuk aktif"}</span>
          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">100%</span>
        </div>
      </motion.div>

      {/* ── Heatmap ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">{t("attendance_member.history_page.calendar_title") || "Kalender Kehadiran (Periode 1 Tahun)"}</h3>
        </div>
        <AttendanceHeatmap records={effectiveRecords} t={t} language={language} />
      </motion.div>

      {/* ── Filter + List ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl w-fit">
          {[
            { key: "ALL",      label: t("attendance_member.status_all") || "Semua",      count: effectiveRecords.length },
            { key: "PRESENT",  label: t("attendance_member.status_present") || "Hadir",      count: present },
            { key: "LATE",     label: t("attendance_member.status_late") || "Terlambat",  count: late },
            { key: "EXCUSED",  label: t("attendance_member.status_excused") || "Izin",       count: excused },
            { key: "ABSENT",   label: t("attendance_member.status_absent") || "Alpha",      count: absent },
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all duration-200 whitespace-nowrap ${
                filter === key
                  ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm"
                  : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"}`}
            >
              {label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${filter === key ? "bg-primary/15" : "bg-slate-200 dark:bg-white/10"}`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        {visible.length > 0 ? (
          <div className="space-y-2.5">
            {visible.map((rec, i) => (
              <RecordItem key={rec.id} rec={rec} index={i} t={t} language={language} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title={t("attendance_member.history_page.empty_title") || "Tidak ada data"}
            description={t("attendance_member.history_page.empty_desc") || "Tidak ditemukan riwayat presensi dengan filter ini."}
            className="py-16 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl"
          />
        )}
      </div>
    </div>
  );
}
