"use client";

import { motion } from "framer-motion";

/**
 * StatCard — Kartu statistik reusable untuk Dashboard, Riwayat Absensi, dll.
 *
 * Kenapa tidak inline di setiap halaman?
 * → DRY: Dashboard punya 4 stat card, Riwayat Absensi punya 3.
 *   Kalau diinline, perubahan desain harus dilakukan di banyak tempat.
 * → Komponen ini menerima `delay` untuk staggered animation —
 *   setiap card muncul satu per satu, bukan sekaligus.
 *
 * Props:
 * @param {React.ReactNode} icon       - Lucide icon component
 * @param {string|number}   value      - Nilai utama yang ditampilkan besar
 * @param {string}          label      - Label di bawah nilai
 * @param {string}          iconBg     - Class Tailwind untuk background icon (contoh: "bg-amber-500/10")
 * @param {string}          iconColor  - Class Tailwind untuk warna icon (contoh: "text-amber-500")
 * @param {string}          iconBorder - Class border icon
 * @param {string}          valueColor - Class warna value (opsional, default slate-900/white)
 * @param {number}          delay      - Delay animasi (detik), untuk stagger
 * @param {string}          href       - Jika ada, wrap card dengan Link
 * @param {string}          className
 */
export default function StatCard({
  icon: Icon,
  value,
  label,
  iconBg = "bg-primary/10",
  iconColor = "text-primary",
  iconBorder = "border-primary/20",
  valueColor = "",
  delay = 0,
  className = "",
  children,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={[
        "group relative bg-white dark:bg-[#08120e]",
        "border border-slate-200 dark:border-white/5",
        "rounded-2xl p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4",
        "overflow-hidden shadow-sm dark:shadow-none",
        "hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]",
        "hover:border-slate-300 dark:hover:border-white/10",
        "transition-all duration-300 cursor-default",
        className,
      ].join(" ")}
    >
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/0 to-transparent group-hover:from-primary/5 transition-all duration-500 pointer-events-none rounded-2xl" />

      {/* Icon */}
      <div
        className={[
          "relative z-10 p-2.5 sm:p-3 rounded-xl border flex-shrink-0",
          "group-hover:scale-110 transition-transform duration-300",
          iconBg,
          iconColor,
          iconBorder,
        ].join(" ")}
      >
        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-w-0 flex-1">
        <p
          className={[
            "text-xl sm:text-2xl font-black leading-none tabular-nums truncate",
            valueColor || "text-slate-900 dark:text-white",
          ].join(" ")}
        >
          {value}
        </p>
        <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-white/40 font-bold uppercase tracking-wider mt-1.5 leading-tight line-clamp-2">
          {label}
        </p>
        {children}
      </div>
    </motion.div>
  );
}
