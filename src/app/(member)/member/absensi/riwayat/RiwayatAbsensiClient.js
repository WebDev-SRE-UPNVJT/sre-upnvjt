"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ClipboardCheck, Calendar, CheckCircle2, AlertTriangle,
  Clock, Info, Target, ArrowLeft, Flame, TrendingUp, ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { EmptyState } from "../../components/ui/CommonUI";

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_META = {
  PRESENT: { label: "Hadir",     color: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25", icon: CheckCircle2 },
  LATE:    { label: "Terlambat", color: "bg-amber-400",   badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25",         icon: Clock },
  EXCUSED: { label: "Izin",      color: "bg-blue-400",    badge: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/25",             icon: Info },
  ABSENT:  { label: "Alpha",     color: "bg-red-500",     badge: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",                 icon: AlertTriangle },
};

const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
const DAYS_ID   = ["Sen","Sel","Rab","Kam","Jum","Sab","Min"];

// ─── Heatmap calendar ───────────────────────────────────────────────────────
function AttendanceHeatmap({ records }) {
  // Build a map dari dateString → status
  const statusMap = {};
  for (const rec of records) {
    const dateKey = new Date(rec.session?.date ?? rec.createdAt).toISOString().split("T")[0];
    statusMap[dateKey] = rec.status;
  }

  // Tampilkan 6 bulan terakhir
  const today    = new Date();
  const start    = new Date(today.getFullYear(), today.getMonth() - 5, 1);

  const months = [];
  let cur = new Date(start);
  while (cur <= today) {
    const monthKey = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
    if (!months.find((m) => m.key === monthKey)) {
      months.push({
        key:   monthKey,
        label: MONTHS_ID[cur.getMonth()],
        year:  cur.getFullYear(),
        month: cur.getMonth(),
      });
    }
    cur.setDate(cur.getDate() + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-4 min-w-max pb-2">
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
            <div key={key} className="flex flex-col gap-1.5">
              <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-wider mb-1">{label}</p>
              {/* Day labels */}
              <div className="grid grid-cols-7 gap-1 mb-0.5">
                {DAYS_ID.map((d) => (
                  <span key={d} className="text-[8px] font-bold text-slate-300 dark:text-white/20 text-center">{d}</span>
                ))}
              </div>
              {/* Weeks grid */}
              {weeks.map((wk, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {wk.map((day, di) => {
                    if (!day) return <div key={di} className="w-6 h-6" />;
                    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const st      = statusMap[dateStr];
                    const isFuture = new Date(dateStr) > today;

                    return (
                      <div
                        key={di}
                        title={st ? `${dateStr}: ${STATUS_META[st]?.label}` : dateStr}
                        className={`w-6 h-6 rounded-md transition-all duration-200 hover:scale-125 cursor-default border
                          ${isFuture ? "bg-slate-100 dark:bg-white/5 border-slate-100 dark:border-white/5" :
                            st === "PRESENT" ? "bg-emerald-500 border-emerald-600/50 shadow-[0_0_6px_rgba(16,185,129,0.4)]" :
                            st === "LATE"    ? "bg-amber-400 border-amber-500/50 shadow-[0_0_6px_rgba(245,158,11,0.3)]" :
                            st === "EXCUSED" ? "bg-blue-400 border-blue-500/50" :
                            st === "ABSENT"  ? "bg-red-500/70 border-red-600/50" :
                                              "bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/5"}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { color: "bg-emerald-500", label: "Hadir" },
          { color: "bg-amber-400",   label: "Terlambat" },
          { color: "bg-blue-400",    label: "Izin" },
          { color: "bg-red-500/70",  label: "Alpha" },
          { color: "bg-slate-200 dark:bg-white/10", label: "Belum ada sesi" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className={`w-3.5 h-3.5 rounded-sm ${color}`} />
            <span className="text-[10px] font-bold text-slate-400 dark:text-white/30">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Record item with accordion ──────────────────────────────────────────────
function RecordItem({ rec, index }) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[rec.status] ?? STATUS_META.ABSENT;
  const Icon = meta.icon;
  const date = new Date(rec.session?.date ?? rec.createdAt);

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
              {date.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${meta.badge}`}>
            {meta.label}
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
                <span className="text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider">Waktu Submit</span>
                <span className="font-bold text-slate-700 dark:text-white/70">
                  {new Date(rec.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              {rec.notes && (
                <div className="flex items-start gap-2">
                  <span className="text-slate-400 dark:text-white/30 font-bold uppercase tracking-wider flex-shrink-0">Keterangan</span>
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
          notes:     "Tidak mengisi presensi",
          createdAt: sess.date,
        });
      }
    }
    return all.sort((a, b) => new Date(b.session?.date ?? b.createdAt) - new Date(a.session?.date ?? a.createdAt));
  }, [records, allSessions]);

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
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Absensi
        </Link>
        <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
          Riwayat Presensi
        </h1>
        <p className="text-slate-500 dark:text-white/45 text-sm mt-2.5 font-medium max-w-lg">
          Rekap lengkap kehadiran kamu di seluruh sesi SRE UPNVJT.
        </p>
      </motion.div>

      {/* ── Summary pills ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Hadir",     val: present,  cls: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
          { label: "Terlambat", val: late,     cls: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-500/8 border-amber-500/20" },
          { label: "Izin",      val: excused,  cls: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-500/8 border-blue-500/20" },
          { label: "Alpha",     val: absent,   cls: "text-red-600 dark:text-red-400",        bg: "bg-red-500/8 border-red-500/20" },
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
            <span className="text-sm font-black text-slate-900 dark:text-white">Tingkat Kehadiran</span>
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
          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">Min. 80% untuk aktif</span>
          <span className="text-[10px] text-slate-400 dark:text-white/30 font-bold">100%</span>
        </div>
      </motion.div>

      {/* ── Heatmap ─────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl"
      >
        <div className="flex items-center gap-2 mb-5">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Kalender Kehadiran (6 Bulan)</h3>
        </div>
        <AttendanceHeatmap records={effectiveRecords} />
      </motion.div>

      {/* ── Filter + List ───────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl w-fit">
          {[
            { key: "ALL",      label: "Semua",      count: effectiveRecords.length },
            { key: "PRESENT",  label: "Hadir",      count: present },
            { key: "LATE",     label: "Terlambat",  count: late },
            { key: "EXCUSED",  label: "Izin",       count: excused },
            { key: "ABSENT",   label: "Alpha",      count: absent },
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
              <RecordItem key={rec.id} rec={rec} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={ClipboardCheck}
            title="Tidak ada data"
            description="Tidak ditemukan riwayat presensi dengan filter ini."
            className="py-16 bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl"
          />
        )}
      </div>
    </div>
  );
}
