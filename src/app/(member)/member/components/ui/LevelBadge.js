"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Flame, Star, Crown } from "lucide-react";
import { getUserLevelData, LEVEL_TIERS } from "@/lib/leveling";

/**
 * Konfigurasi visual tiap level.
 *
 * Kenapa dipisah dari leveling.js?
 * → leveling.js adalah pure utility (bisa dipakai di server/client).
 * → Konfigurasi icon & gradient adalah concern UI — tidak boleh masuk ke lib/.
 * → Separation of concerns: logic di lib/, visual di components/.
 */
const LEVEL_CONFIG = {
  1: {
    icon: Shield,
    gradient: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/30",
    text: "text-blue-600 dark:text-blue-400",
    glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]",
    label: "RE-Source",
  },
  2: {
    icon: Zap,
    gradient: "from-teal-500/20 to-emerald-500/10",
    border: "border-teal-500/30",
    text: "text-teal-600 dark:text-teal-400",
    glow: "shadow-[0_0_12px_rgba(20,184,166,0.3)]",
    label: "RE-Act",
  },
  3: {
    icon: Flame,
    gradient: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-700 dark:text-emerald-300",
    glow: "shadow-[0_0_12px_rgba(16,185,129,0.3)]",
    label: "RE-Charge",
  },
  4: {
    icon: Star,
    gradient: "from-amber-500/20 to-orange-500/10",
    border: "border-amber-500/30",
    text: "text-amber-600 dark:text-amber-400",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.3)]",
    label: "RE-Gen",
  },
  5: {
    icon: Crown,
    gradient: "from-purple-500/20 to-pink-500/10",
    border: "border-purple-500/30",
    text: "text-purple-600 dark:text-purple-400",
    glow: "shadow-[0_0_12px_rgba(168,85,247,0.3)]",
    label: "RE-Power",
  },
};

/**
 * LevelBadge — Reusable badge untuk level member.
 *
 * Props:
 * @param {number}  xp      - Total XP member (akan dihitung levelnya)
 * @param {number}  level   - Langsung pakai level (opsional, override xp)
 * @param {"sm"|"md"|"lg"} size  - Ukuran badge
 * @param {boolean} showLabel    - Tampilkan nama level (default: true)
 * @param {boolean} animated     - Animasi pulse pada icon (default: true)
 * @param {string}  className    - Class tambahan
 */
export default function LevelBadge({
  xp,
  level,
  size = "md",
  showLabel = true,
  animated = true,
  className = "",
}) {
  // Hitung level dari XP kalau `level` tidak diberikan langsung
  const resolvedLevel = level ?? getUserLevelData(xp ?? 0).currentLevel;
  const config = LEVEL_CONFIG[resolvedLevel] ?? LEVEL_CONFIG[1];
  const Icon = config.icon;

  const sizeMap = {
    sm: { wrap: "px-2 py-0.5 gap-1", icon: "w-3 h-3", text: "text-[9px]" },
    md: { wrap: "px-3 py-1.5 gap-1.5", icon: "w-3.5 h-3.5", text: "text-[10px]" },
    lg: { wrap: "px-4 py-2 gap-2", icon: "w-4 h-4", text: "text-xs" },
  };
  const sz = sizeMap[size];

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, type: "spring", stiffness: 200 }}
      className={[
        "inline-flex items-center rounded-full border font-black uppercase tracking-widest",
        `bg-gradient-to-r ${config.gradient}`,
        config.border,
        config.text,
        animated ? config.glow : "",
        sz.wrap,
        sz.text,
        className,
      ].join(" ")}
    >
      <Icon
        className={[sz.icon, animated ? "animate-pulse" : ""].join(" ")}
      />
      {showLabel && (
        <span>
          Lv.{resolvedLevel} {config.label}
        </span>
      )}
    </motion.span>
  );
}
