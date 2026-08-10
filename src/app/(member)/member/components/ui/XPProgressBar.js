"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Zap } from "lucide-react";
import { getUserLevelData, LEVEL_TIERS } from "@/lib/leveling";
import { useLanguage } from "@/i18n/LanguageProvider";

/**
 * XPProgressBar — Animated XP progress bar dengan level milestone markers.
 *
 * Kenapa pakai useMotionValue + useSpring, bukan CSS transition?
 * → Framer Motion spring = physics-based easing, terasa lebih hidup.
 * → CSS transition tidak bisa di-control mid-animation (misal kalau XP update real-time).
 * → useSpring memungkinkan animasi "berat" yang terasa satisfying (gaming feel).
 *
 * Props:
 * @param {number} xp          - Total XP saat ini
 * @param {boolean} showStats  - Tampilkan angka XP & level name (default: true)
 * @param {boolean} showMarkers - Tampilkan milestone marker per level (default: false)
 * @param {"sm"|"md"|"lg"} size - Ketebalan bar
 * @param {string} className
 */
export default function XPProgressBar({
  xp = 0,
  showStats = true,
  showMarkers = false,
  size = "md",
  className = "",
}) {
  const levelData = getUserLevelData(xp);
  const { progressPercentage, totalXp, nextLevelXp, levelName, currentLevel } = levelData;

  // Spring animation untuk progress bar — terasa "game-like"
  const rawProgress = useMotionValue(0);
  const springProgress = useSpring(rawProgress, {
    stiffness: 60,
    damping: 20,
    restDelta: 0.001,
  });

  useEffect(() => {
    // Delay sedikit agar animasi terlihat setelah komponen mount
    const timer = setTimeout(() => {
      rawProgress.set(progressPercentage);
    }, 300);
    return () => clearTimeout(timer);
  }, [progressPercentage, rawProgress]);

  const heightMap = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };
  const barHeight = heightMap[size] ?? "h-2.5";

  // XP untuk level max (tidak ada next level)
  const isMaxLevel = currentLevel === LEVEL_TIERS[0].level;
  const displayNextXp = nextLevelXp ?? LEVEL_TIERS[0].minXp;

  const { t } = useLanguage();

  return (
    <div className={`w-full ${className}`}>
      {showStats && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {levelName}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-500 dark:text-white/50 font-mono">
            {isMaxLevel
              ? `${totalXp.toLocaleString()} XP — MAX LEVEL`
              : `${totalXp.toLocaleString()} / ${displayNextXp.toLocaleString()} XP`}
          </span>
        </div>
      )}

      {/* Bar Track */}
      <div
        className={`relative w-full ${barHeight} bg-slate-200 dark:bg-white/5 rounded-full overflow-hidden border border-slate-300/50 dark:border-white/5`}
      >
        {/* Glow layer di belakang bar */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/40 to-emerald-400/40 blur-md rounded-full"
          style={{ scaleX: springProgress.get() / 100, originX: 0 }}
        />

        {/* Bar utama */}
        <motion.div
          className="h-full bg-gradient-to-r from-primary via-emerald-400 to-teal-400 rounded-full relative overflow-hidden"
          style={{
            width: springProgress.get() + "%",
          }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        >
          {/* Shimmer effect di atas bar */}
          <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.25)_50%,transparent_100%)] animate-[shimmer_2.5s_ease-in-out_infinite] bg-[length:200%_100%]" />
        </motion.div>

        {/* Milestone markers (opsional) */}
        {showMarkers &&
          LEVEL_TIERS.slice(0, -1)
            .reverse()
            .map((tier) => {
              const markerPct =
                currentLevel < tier.level
                  ? null
                  : ((tier.minXp - (getUserLevelData(xp).currentLevel === 1 ? 0 : LEVEL_TIERS.find((t) => t.level === currentLevel)?.minXp ?? 0)) /
                      ((nextLevelXp ?? tier.minXp) - (LEVEL_TIERS.find((t) => t.level === currentLevel)?.minXp ?? 0))) *
                    100;
              if (markerPct === null || markerPct < 0) return null;
              return (
                <div
                  key={tier.level}
                  className="absolute top-0 bottom-0 w-0.5 bg-white/30"
                  style={{ left: `${markerPct}%` }}
                />
              );
            })}
      </div>

      {showStats && !isMaxLevel && (
        <p className="text-[9px] text-slate-400 dark:text-white/30 font-bold mt-1.5 text-right">
          {t("dashboard.xp_to_next", { xp: (displayNextXp - totalXp).toLocaleString() })}
        </p>
      )}
    </div>
  );
}
