"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * EmptyState — Tampilan konsisten saat data kosong.
 *
 * Kenapa dibutuhkan?
 * → Tanpa empty state, halaman terlihat broken saat data belum ada.
 * → Konsistensi visual: semua halaman member punya pola yang sama.
 * → Lebih baik dari sekadar `null` — memberi konteks ke user.
 *
 * Props:
 * @param {React.ReactNode} icon    - Icon lucide
 * @param {string} title            - Judul empty state
 * @param {string} description      - Deskripsi singkat
 * @param {string} actionLabel      - Teks tombol aksi (opsional)
 * @param {string} actionHref       - URL tombol aksi (opsional)
 * @param {string} className
 */
export function EmptyState({
  icon: Icon,
  title = "Belum ada data",
  description = "Data akan muncul di sini.",
  actionLabel,
  actionHref,
  className = "",
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center text-center py-12 px-4 ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-slate-400 dark:text-white/30" />
        </div>
      )}
      <h4 className="text-sm font-black text-slate-700 dark:text-white/70">{title}</h4>
      <p className="text-xs text-slate-400 dark:text-white/30 mt-1.5 max-w-xs leading-relaxed">
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 px-5 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-black hover:bg-primary hover:text-white dark:hover:text-[#050e0a] transition-all duration-300"
        >
          {actionLabel}
        </Link>
      )}
    </motion.div>
  );
}

/**
 * SectionHeader — Header konsisten untuk tiap section di halaman member.
 *
 * Props:
 * @param {React.ReactNode} icon   - Lucide icon
 * @param {string} title           - Judul section
 * @param {string} actionLabel     - Label link "Lihat semua" (opsional)
 * @param {string} actionHref      - URL link (opsional)
 * @param {string} className
 */
export function SectionHeader({
  icon: Icon,
  title,
  actionLabel,
  actionHref,
  className = "",
}) {
  return (
    <div className={`flex justify-between items-center gap-4 flex-wrap sm:flex-nowrap ${className}`}>
      <h3 className="font-display font-black text-xl tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
        {Icon && <Icon className="w-5 h-5 text-primary flex-shrink-0" />}
        {title}
      </h3>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="group flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-black text-primary hover:bg-primary hover:text-white dark:hover:text-[#050e0a] hover:border-primary transition-all duration-300 hover:shadow-[0_0_15px_rgba(16,185,129,0.35)] shrink-0 ml-auto"
        >
          {actionLabel}
          <svg
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
