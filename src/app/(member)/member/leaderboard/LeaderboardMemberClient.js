"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Star, Zap, Flame, Crown, Medal,
  ArrowUp, Shield, TrendingUp, Users, Calendar,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { getUserLevelData } from "@/lib/leveling";
import LevelBadge from "../components/ui/LevelBadge";
import { EmptyState } from "../components/ui/CommonUI";

// ─── Podium config ─────────────────────────────────────────────────────────
const PODIUM_CONFIG = {
  1: {
    order: 1, // center
    height: "h-44 md:h-56",
    avatarSize: "w-20 h-20 md:w-28 md:h-28",
    avatarBorder: "border-amber-400 dark:border-amber-400",
    avatarShadow: "shadow-[0_0_35px_rgba(251,191,36,0.55)]",
    pedestalBg: "from-amber-400/25 via-amber-300/10 to-transparent dark:from-amber-500/20 dark:via-amber-600/5",
    pedestalBorder: "border-amber-400/50 dark:border-amber-500/30",
    rankColor: "text-amber-500 dark:text-amber-400",
    label: "GOLD",
    labelColor: "text-amber-500 dark:text-amber-400",
    glow: "shadow-[0_0_60px_rgba(251,191,36,0.15)]",
    sweepColor: "via-amber-400/20",
  },
  2: {
    order: 0, // left
    height: "h-32 md:h-44",
    avatarSize: "w-16 h-16 md:w-22 md:h-22",
    avatarBorder: "border-slate-300 dark:border-slate-400",
    avatarShadow: "shadow-[0_0_20px_rgba(148,163,184,0.4)]",
    pedestalBg: "from-slate-300/20 via-slate-200/10 to-transparent dark:from-slate-400/15 dark:via-slate-500/5",
    pedestalBorder: "border-slate-300/50 dark:border-slate-400/20",
    rankColor: "text-slate-500 dark:text-slate-300",
    label: "SILVER",
    labelColor: "text-slate-400 dark:text-slate-300",
    glow: "",
    sweepColor: "via-slate-300/15",
  },
  3: {
    order: 2, // right
    height: "h-24 md:h-36",
    avatarSize: "w-14 h-14 md:w-20 md:h-20",
    avatarBorder: "border-orange-400 dark:border-amber-600",
    avatarShadow: "shadow-[0_0_20px_rgba(249,115,22,0.35)]",
    pedestalBg: "from-orange-400/20 via-orange-300/10 to-transparent dark:from-amber-700/15 dark:via-amber-800/5",
    pedestalBorder: "border-orange-400/40 dark:border-amber-700/25",
    rankColor: "text-orange-500 dark:text-amber-600",
    label: "BRONZE",
    labelColor: "text-orange-500 dark:text-amber-600",
    glow: "",
    sweepColor: "via-orange-300/15",
  },
};

// ─── Avatar ─────────────────────────────────────────────────────────────────
function Avatar({ name, url, size = "w-10 h-10", borderCls = "", shadowCls = "", textSize = "text-sm" }) {
  return url ? (
    <img src={url} alt={name} className={`${size} rounded-full object-cover border-4 ${borderCls} ${shadowCls} relative z-10`} />
  ) : (
    <div className={`${size} rounded-full flex items-center justify-center font-black border-4 ${borderCls} ${shadowCls} bg-gradient-to-br from-primary/20 to-emerald-500/10 text-primary relative z-10 ${textSize}`}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

export default function LeaderboardMemberClient({ initialLeaderboard, currentUserId }) {
  const { t } = useLanguage();
  const [period, setPeriod]           = useState("all");
  const [leaderboard, setLeaderboard] = useState(initialLeaderboard ?? []);
  const [isLoading, setIsLoading]     = useState(false);
  const [mounted, setMounted]         = useState(false);

  const periods = [
    { key: "all",   label: t("leaderboard.period_all") || "Semua Waktu", icon: Trophy },
    { key: "month", label: t("leaderboard.period_month") || "Bulan Ini",   icon: Calendar },
    { key: "week",  label: t("leaderboard.period_week") || "Minggu Ini",  icon: TrendingUp },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Fetch by period ────────────────────────────────────────────────
  const handlePeriodChange = useCallback(async (newPeriod) => {
    if (newPeriod === period) return;
    setPeriod(newPeriod);

    if (newPeriod === "all") {
      setLeaderboard(initialLeaderboard ?? []);
      return;
    }

    setIsLoading(true);
    try {
      const res  = await fetch(`/api/leaderboard?period=${newPeriod}`);
      const data = await res.json();
      setLeaderboard(Array.isArray(data) ? data : []);
    } catch {
      setLeaderboard([]);
    } finally {
      setIsLoading(false);
    }
  }, [period, initialLeaderboard]);

  // ─── Derived data ────────────────────────────────────────────────────
  const maxXp          = leaderboard[0]?.xp ?? 100;
  const top3           = [1, 2, 3].map((r) => leaderboard.find((i) => i.rank === r)).filter(Boolean);
  const restList       = leaderboard.filter((i) => i.rank > 3);
  const currentUser    = leaderboard.find((i) => i.id === currentUserId);
  const xpToNextRank   = currentUser && currentUser.rank > 1
    ? (leaderboard.find((i) => i.rank === currentUser.rank - 1)?.xp ?? 0) - currentUser.xp + 1
    : 0;

  // ─── RENDER ──────────────────────────────────────────────────────────
  return (
    <div className="w-full relative pb-36 sm:pb-44 select-none space-y-10">

      {/* ── Ambient glows ──────────────────────────────────────────── */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-primary/10 dark:bg-primary/8 rounded-[100%] blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-20 right-0 w-80 h-80 bg-amber-500/8 dark:bg-amber-500/5 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
      >
        <div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-[10px] font-black text-amber-600 dark:text-amber-400 tracking-widest uppercase">
            <Trophy className="w-3 h-3" /> {t("leaderboard.badge_hof") || "Hall of Fame"}
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white mt-4 flex items-center gap-3 leading-none">
            <Trophy className="w-9 h-9 text-amber-500 dark:text-amber-400 animate-[bounce_2s_ease-in-out_infinite]" />
            {t("leaderboard.title")}
          </h1>
          <p className="text-slate-500 dark:text-white/45 max-w-xl text-sm mt-2.5 leading-relaxed font-medium">
            {t("leaderboard.subtitle")}
          </p>
        </div>

        {/* Period Tabs */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-2xl">
          {periods.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => handlePeriodChange(key)}
              className={[
                "relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all duration-300",
                period === key
                  ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm"
                  : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70",
              ].join(" ")}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 dark:bg-[#07130e]/50 backdrop-blur-sm rounded-3xl"
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <p className="text-sm font-black text-primary">{t("leaderboard.loading") || "Memuat data..."}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium Top 3 */}
      {top3.length > 0 && (
        <div className="relative">
          {/* Stage glow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-32 bg-gradient-to-t from-primary/12 dark:from-primary/8 to-transparent blur-2xl pointer-events-none" />

          {/* Floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
            {["bottom-20 left-[28%]", "bottom-36 right-[32%]", "bottom-28 left-[48%]"].map((pos, i) => (
              <div
                key={i}
                className={`absolute ${pos} w-1.5 h-1.5 rounded-full animate-ping`}
                style={{
                  background: ["#f59e0b","#10b981","#60a5fa"][i],
                  animationDuration: `${2.5 + i}s`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>

          {/* Podium stage — sorted visually: rank2 left, rank1 center, rank3 right */}
          <div className="flex justify-center items-end gap-4 md:gap-8 pt-20 px-4">
            {[2, 1, 3].map((rankNum) => {
              const item = top3.find((p) => p.rank === rankNum);
              if (!item) return null;
              const cfg = PODIUM_CONFIG[rankNum];
              const isGold = rankNum === 1;
              const isMe   = item.id === currentUserId;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 40, scale: 0.85 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.7,
                    delay: rankNum === 1 ? 0.1 : rankNum === 2 ? 0.25 : 0.4,
                    type: "spring",
                    stiffness: 90,
                  }}
                  className={`flex flex-col items-center w-24 md:w-40 group hover:-translate-y-3 transition-transform duration-500 cursor-default`}
                >
                  {/* Crown for #1 */}
                  {isGold && (
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                      className="mb-2 drop-shadow-[0_0_18px_rgba(251,191,36,0.8)]"
                    >
                      <Crown className="w-10 h-10 md:w-14 md:h-14 text-amber-400 fill-amber-400" />
                    </motion.div>
                  )}

                  {/* Avatar */}
                  <div className="relative mb-4">
                    {isGold && (
                      <>
                        <div className="absolute -inset-3 rounded-full border border-dashed border-amber-400/40 animate-[spin_10s_linear_infinite]" />
                        <div className="absolute -inset-5 rounded-full border border-dashed border-amber-300/20 animate-[spin_15s_linear_infinite_reverse]" />
                      </>
                    )}
                    <Avatar
                      name={item.name}
                      url={item.profilePictureUrl}
                      size={cfg.avatarSize}
                      borderCls={cfg.avatarBorder}
                      shadowCls={cfg.avatarShadow}
                      textSize={isGold ? "text-2xl" : "text-xl"}
                    />
                    {/* Rank badge */}
                    <div className={`absolute -bottom-2 -right-2 z-20 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-[#07130e] shadow-lg
                      ${isGold ? "bg-amber-400 text-amber-900" : rankNum === 2 ? "bg-slate-400 text-slate-900" : "bg-orange-500 text-white"}`}>
                      #{rankNum}
                    </div>
                    {/* "You" indicator */}
                    {isMe && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-primary text-white text-[8px] font-black rounded-full whitespace-nowrap z-30">
                        {t("leaderboard.you") || "Kamu"}
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <p className="text-xs md:text-sm font-black text-slate-800 dark:text-white text-center truncate w-full mb-1">
                    {item.name}
                  </p>
                  <LevelBadge xp={item.xp} size="sm" showLabel={false} animated={isGold} className="mb-3" />

                  {/* Pedestal */}
                  <div className={`w-full ${cfg.height} bg-gradient-to-b ${cfg.pedestalBg} border ${cfg.pedestalBorder} border-b-0 rounded-t-[22px] flex flex-col justify-end items-center p-3 relative overflow-hidden ${cfg.glow} group-hover:brightness-110 transition-all duration-500`}>
                    {/* Sweep light */}
                    <div className={`absolute top-0 left-[-120%] w-[50%] h-full bg-gradient-to-r from-transparent ${cfg.sweepColor} to-transparent skew-x-[25deg] ${isGold ? "animate-[sweep_2.5s_ease-in-out_infinite]" : "animate-[sweep_4s_ease-in-out_infinite]"}`} />

                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-grid-pattern opacity-10 dark:opacity-5" />

                    <div className="relative z-10 text-center">
                      <div className={`text-xl md:text-2xl font-black font-mono flex items-center justify-center gap-1 ${cfg.rankColor}`}>
                        <Zap className="w-4 h-4 fill-current animate-pulse" />
                        {item.xp.toLocaleString()}
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-widest mt-1.5 flex items-center justify-center gap-1 ${cfg.labelColor}`}>
                        {isGold && <Trophy className="w-3 h-3 text-amber-400 fill-amber-400 inline" />}
                        {cfg.label}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rank List */}
      <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl overflow-hidden shadow-xl dark:shadow-2xl">

        {/* Table header */}
        <div className="grid grid-cols-[45px_1fr_100px] md:grid-cols-[60px_1fr_auto_160px] gap-2 md:gap-4 px-4 md:px-6 py-3.5 md:py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/[0.015]">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
            {t("leaderboard.table_rank") || "Rank"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
            {t("leaderboard.table_member") || "Member"}
          </span>
          <span className="hidden md:inline text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30">
            {t("leaderboard.table_level") || "Level"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/30 text-right md:text-left">
            {t("leaderboard.table_xp") || "XP Progress"}
          </span>
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
          {leaderboard.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t("leaderboard.empty_title") || "Belum ada data leaderboard"}
              description={period !== "all" ? (t("leaderboard.empty_period_desc") || "Belum ada aktivitas XP dalam periode ini.") : (t("leaderboard.empty_desc") || "Data akan muncul setelah ada member dengan XP.")}
              className="py-16"
            />
          ) : leaderboard.map((item, i) => {
            const isMe        = item.id === currentUserId;
            const levelData   = getUserLevelData(item.xp);
            const barPct      = Math.max(3, (item.xp / Math.max(maxXp, 1)) * 100);
            const isTop3      = item.rank <= 3;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.8), duration: 0.35 }}
                className={[
                  "grid grid-cols-[45px_1fr_100px] md:grid-cols-[60px_1fr_auto_160px] gap-2 md:gap-4 items-center px-4 md:px-6 py-3.5 md:py-4 transition-all duration-300",
                  "hover:bg-slate-50 dark:hover:bg-white/[0.025]",
                  isMe
                    ? "bg-emerald-500/8 dark:bg-primary/8 border-l-2 border-primary"
                    : "",
                ].join(" ")}
              >
                {/* Rank */}
                <div className="flex items-center gap-1">
                  {isTop3 ? (
                    <div className="flex items-center gap-1">
                      <Medal className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${item.rank === 1 ? "text-amber-500" : item.rank === 2 ? "text-slate-400" : "text-orange-500"} fill-current`} />
                      <span className={`text-xs sm:text-sm font-black ${item.rank === 1 ? "text-amber-500 dark:text-amber-400" : item.rank === 2 ? "text-slate-400 dark:text-slate-300" : "text-orange-500 dark:text-amber-600"}`}>
                        #{item.rank}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs sm:text-sm font-black text-slate-400 dark:text-white/30">#{item.rank}</span>
                  )}
                  {isMe && <Flame className="w-3 h-3 text-primary animate-pulse shrink-0 hidden sm:inline" />}
                </div>

                {/* Member */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <Avatar
                      name={item.name}
                      url={item.profilePictureUrl}
                      size="w-8 h-8 sm:w-9 sm:h-9"
                      borderCls={isMe ? "border-primary/40" : "border-slate-200 dark:border-white/10"}
                      textSize="text-xs sm:text-sm"
                    />
                    {isMe && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary border-2 border-white dark:border-[#08120e]" />}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs sm:text-sm font-black truncate ${isMe ? "text-primary" : "text-slate-800 dark:text-white"}`}>
                      {item.name} {isMe && <span className="text-[9px] bg-primary/15 text-primary px-1.5 py-0.5 rounded-full ml-1 font-bold">{t("leaderboard.you") || "Kamu"}</span>}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <p className="text-[10px] text-slate-400 dark:text-white/30 truncate">{item.divisionName ?? item.npm ?? "Member"}</p>
                      {/* Level badge icon for mobile */}
                      <span className="md:hidden shrink-0">
                        <LevelBadge xp={item.xp} size="xs" showLabel={false} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Level Badge (Desktop Only) */}
                <div className="hidden md:block">
                  <LevelBadge xp={item.xp} size="sm" showLabel animated={false} />
                </div>

                {/* XP Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-600 dark:text-white/60 font-mono">
                      <Zap className="w-3 h-3 text-amber-500 fill-amber-500/70" />
                      {item.xp.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-white/25">{Math.round(barPct)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${isMe ? "bg-gradient-to-r from-primary to-emerald-400" : "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-white/20 dark:to-white/10"}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8, delay: Math.min(i * 0.04 + 0.2, 1), ease: [0.34, 1.56, 0.64, 1] }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Floating My Rank Widget (Portal to document.body for fixed screen position) */}
      {mounted && typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.92 }}
              transition={{ type: "spring", bounce: 0.45, delay: 0.4 }}
              className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-2xl z-[9999] pointer-events-none"
            >
              <div className="relative group pointer-events-auto">
                {/* Pulsing border glow */}
                <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-primary via-emerald-400 to-teal-500 opacity-25 group-hover:opacity-45 blur-md transition-opacity duration-500 animate-[pulse_3s_ease-in-out_infinite]" />

                <div className="relative bg-white/96 dark:bg-[#07130e]/96 backdrop-blur-xl border border-slate-200 dark:border-white/10 px-4 sm:px-6 py-3.5 sm:py-4 rounded-3xl shadow-[0_20px_50px_-10px_rgba(16,185,129,0.35)] flex items-center justify-between gap-3 sm:gap-4 hover:scale-[1.015] transition-transform duration-300">

                  {/* Left: avatar + info */}
                  <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/30 flex items-center justify-center">
                        <Flame className="w-5 h-5 sm:w-6 sm:h-6 text-primary fill-primary/20 animate-pulse" />
                      </div>
                      <div className="absolute -top-2 -right-2 sm:-top-2.5 sm:-right-2.5 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-amber-900 border-2 border-white dark:border-[#07130e] flex items-center justify-center font-black text-[8px] sm:text-[9px] shadow-[0_0_8px_rgba(251,191,36,0.6)]">
                        #{currentUser.rank}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">{t("leaderboard.my_position") || "Posisiku"}</p>
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate max-w-[120px] sm:max-w-[200px]">{currentUser.name}</p>
                      <LevelBadge xp={currentUser.xp} size="sm" className="mt-0.5 sm:mt-1" />
                    </div>
                  </div>

                  {/* Right: XP to next rank */}
                  {xpToNextRank > 0 ? (
                    <div className="flex flex-col items-end gap-1 sm:gap-1.5 shrink-0 max-w-[150px] sm:max-w-[220px]">
                      <div className="flex items-center gap-1 text-[9px] sm:text-[10px] font-black text-amber-600 dark:text-amber-400 text-right leading-tight">
                        <ArrowUp className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                        <span>{t("leaderboard.need_xp_to_rank", { count: xpToNextRank.toLocaleString() }) || `Butuh ${xpToNextRank.toLocaleString()} XP untuk naik rank`}</span>
                      </div>
                      <div className="w-full h-1.5 sm:h-2 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(75, (currentUser.xp / (currentUser.xp + xpToNextRank)) * 100)}%` }}
                          transition={{ duration: 1, delay: 0.8 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl bg-amber-500/10 border border-amber-500/25 shrink-0">
                      <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500/50 animate-bounce" />
                      <span className="text-[11px] sm:text-xs font-black text-amber-600 dark:text-amber-400">{t("leaderboard.rank_first") || "Peringkat #1!"}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* Keyframe untuk sweep light di podium */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes sweep {
          0%   { left: -120%; }
          100% { left: 220%; }
        }
      ` }} />
    </div>
  );
}
