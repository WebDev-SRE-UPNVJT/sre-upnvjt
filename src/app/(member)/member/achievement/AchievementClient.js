"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Zap, Trophy, Star, Flame, Shield, Crown,
  CheckCircle2, BookOpen, TrendingUp,
  Lock, Sparkles, Compass, Check, Layers, Gem, Swords
} from "lucide-react";
import { getUserLevelData, LEVEL_TIERS } from "@/lib/leveling";
import LevelBadge from "../components/ui/LevelBadge";
import XPProgressBar from "../components/ui/XPProgressBar";
import { SectionHeader } from "../components/ui/CommonUI";

// ─── XP source icons ─────────────────────────────────────────────────────────
const SOURCE_ICON = {
  task:            { icon: Trophy,   color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20" },
  task_import:     { icon: Trophy,   color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/20" },
  task_revocation: { icon: Trophy,   color: "text-rose-500",    bg: "bg-rose-500/10 border-rose-500/20" },
  quiz:            { icon: BookOpen, color: "text-blue-500",    bg: "bg-blue-500/10 border-blue-500/20" },
  manual:          { icon: Zap,      color: "text-purple-500",  bg: "bg-purple-500/10 border-purple-500/20" },
};

// ─── Badge definitions — Focused on Modul, Main Quest, Side Quest, and XP/Level
const BADGE_DEFS = [
  // ── 1. Modul Reading Milestones (100% Selesai) ──
  {
    id: "mod_1",
    label: "First Reader",
    icon: BookOpen,
    color: "text-blue-500",
    bg: "from-blue-500/20 to-blue-400/5",
    border: "border-blue-500/30",
    condition: (s) => s.completedModules >= 1,
    desc: "Tuntaskan membaca 1 modul materi (100%)",
  },
  {
    id: "mod_3",
    label: "Knowledge Seeker",
    icon: Layers,
    color: "text-cyan-500",
    bg: "from-cyan-500/20 to-cyan-400/5",
    border: "border-cyan-500/30",
    condition: (s) => s.completedModules >= 3,
    desc: "Tuntaskan membaca 3 modul materi (100%)",
  },
  {
    id: "mod_6",
    label: "Module Scholar",
    icon: Gem,
    color: "text-teal-500",
    bg: "from-teal-500/20 to-teal-400/5",
    border: "border-teal-500/30",
    condition: (s) => s.completedModules >= 6,
    desc: "Tuntaskan membaca 6 modul materi (100%)",
  },
  {
    id: "mod_all",
    label: "Grand Polymath",
    icon: Sparkles,
    color: "text-indigo-400",
    bg: "from-indigo-500/20 to-indigo-400/5",
    border: "border-indigo-500/30",
    condition: (s) => s.totalModules >= 6 && s.completedModules >= s.totalModules,
    desc: "Tuntaskan membaca seluruh modul materi (min. 6 modul)",
  },

  // ── 2. Main Quest Milestones ──
  {
    id: "main_1",
    label: "Quest Pioneer",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "from-emerald-500/20 to-emerald-400/5",
    border: "border-emerald-500/30",
    condition: (s) => s.approvedMainQuests >= 1,
    desc: "Selesaikan 1 Main Quest wajib",
  },
  {
    id: "main_3",
    label: "Core Champion",
    icon: Swords,
    color: "text-emerald-400",
    bg: "from-emerald-500/20 to-teal-400/5",
    border: "border-emerald-500/30",
    condition: (s) => s.approvedMainQuests >= 3,
    desc: "Selesaikan 3 Main Quest",
  },
  {
    id: "main_6",
    label: "Veteran Hero",
    icon: Trophy,
    color: "text-amber-500",
    bg: "from-amber-500/20 to-amber-400/5",
    border: "border-amber-500/30",
    condition: (s) => s.approvedMainQuests >= 6,
    desc: "Selesaikan 6 Main Quest",
  },
  {
    id: "main_all",
    label: "Grand Questmaster",
    icon: Crown,
    color: "text-amber-400",
    bg: "from-amber-500/25 to-yellow-400/5",
    border: "border-amber-500/40",
    condition: (s) => s.totalMainQuests >= 6 && s.approvedMainQuests >= s.totalMainQuests,
    desc: "Selesaikan seluruh Main Quest penugasan (min. 6 tugas)",
  },

  // ── 3. Side Quest Milestones ──
  {
    id: "side_1",
    label: "Curious Explorer",
    icon: Compass,
    color: "text-violet-500",
    bg: "from-violet-500/20 to-violet-400/5",
    border: "border-violet-500/30",
    condition: (s) => s.approvedSideQuests >= 1,
    desc: "Selesaikan 1 Side Quest opsional",
  },
  {
    id: "side_3",
    label: "Adventurer",
    icon: Star,
    color: "text-fuchsia-500",
    bg: "from-fuchsia-500/20 to-fuchsia-400/5",
    border: "border-fuchsia-500/30",
    condition: (s) => s.approvedSideQuests >= 3,
    desc: "Selesaikan 3 Side Quest",
  },
  {
    id: "side_all",
    label: "Completionist",
    icon: Shield,
    color: "text-pink-500",
    bg: "from-pink-500/20 to-pink-400/5",
    border: "border-pink-500/30",
    condition: (s) => s.totalSideQuests >= 3 && s.approvedSideQuests >= s.totalSideQuests,
    desc: "Selesaikan seluruh Side Quest tantangan",
  },

  // ── 4. XP Milestones (Sesuai Skema 500 XP / Modul) ──
  {
    id: "xp_500",
    label: "Energized",
    icon: Zap,
    color: "text-yellow-500",
    bg: "from-yellow-500/20 to-yellow-400/5",
    border: "border-yellow-500/30",
    condition: (s) => s.xp >= 500,
    desc: "Kumpulkan 500 XP (Target 1 Modul)",
  },
  {
    id: "xp_1500",
    label: "High Voltage",
    icon: Zap,
    color: "text-amber-500",
    bg: "from-amber-500/20 to-amber-400/5",
    border: "border-amber-500/30",
    condition: (s) => s.xp >= 1500,
    desc: "Kumpulkan 1.500 XP (Target 3 Modul)",
  },
  {
    id: "xp_2500",
    label: "Supercharged",
    icon: Flame,
    color: "text-orange-500",
    bg: "from-orange-500/20 to-orange-400/5",
    border: "border-orange-500/30",
    condition: (s) => s.xp >= 2500,
    desc: "Kumpulkan 2.500 XP (Target 5 Modul)",
  },
  {
    id: "xp_3500",
    label: "Maximum Output",
    icon: Crown,
    color: "text-purple-500",
    bg: "from-purple-500/20 to-purple-400/5",
    border: "border-purple-500/30",
    condition: (s) => s.xp >= 3500,
    desc: "Kumpulkan 3.500 XP (Mastery Tier)",
  },

  // ── 5. Level Tiers (SRE Theme) ──
  {
    id: "lv2",
    label: "RE-Act",
    icon: Shield,
    color: "text-teal-400",
    bg: "from-teal-500/20 to-teal-400/5",
    border: "border-teal-500/30",
    condition: (s) => s.level >= 2,
    desc: "Capai Level 2 (RE-Act)",
  },
  {
    id: "lv3",
    label: "RE-Charge",
    icon: Flame,
    color: "text-emerald-400",
    bg: "from-emerald-500/20 to-emerald-400/5",
    border: "border-emerald-500/30",
    condition: (s) => s.level >= 3,
    desc: "Capai Level 3 (RE-Charge)",
  },
  {
    id: "lv4",
    label: "RE-Gen",
    icon: Award,
    color: "text-cyan-400",
    bg: "from-cyan-500/20 to-cyan-400/5",
    border: "border-cyan-500/30",
    condition: (s) => s.level >= 4,
    desc: "Capai Level 4 (RE-Gen)",
  },
  {
    id: "lv5",
    label: "RE-Power",
    icon: Crown,
    color: "text-purple-400",
    bg: "from-purple-500/20 to-purple-400/5",
    border: "border-purple-500/30",
    condition: (s) => s.level >= 5,
    desc: "Capai Level 5 (RE-Power - MAX)",
  },
];

// ─── Badge Card Component (Original SRE Portal Design) ───────────────────────
function BadgeCard({ badge, unlocked, index }) {
  const Icon = badge.icon;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 200, damping: 20 }}
      className={`relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl border transition-all duration-300 group ${
        unlocked
          ? `bg-gradient-to-b ${badge.bg} ${badge.border} shadow-sm hover:shadow-md hover:scale-[1.03]`
          : "bg-slate-50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 opacity-50 grayscale"
      }`}
    >
      {/* Icon Emblem */}
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110 ${
          unlocked
            ? `bg-gradient-to-br ${badge.bg} border ${badge.border}`
            : "bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/10"
        }`}
      >
        {unlocked ? (
          <Icon className={`w-6 h-6 ${badge.color}`} />
        ) : (
          <Lock className="w-5 h-5 text-slate-400 dark:text-white/20" />
        )}
      </div>

      <p className={`text-xs font-black ${unlocked ? badge.color : "text-slate-400 dark:text-white/30"}`}>
        {badge.label}
      </p>
      <p className="text-[10px] text-slate-500 dark:text-white/35 mt-1 leading-relaxed">{badge.desc}</p>

      {/* Unlocked status badge */}
      {unlocked && (
        <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
          <Check className="w-2.5 h-2.5" /> Diraih
        </span>
      )}

      {/* Ambient glow */}
      {unlocked && (
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${badge.bg} opacity-0 group-hover:opacity-30 transition-opacity pointer-events-none`}
        />
      )}
    </motion.div>
  );
}

// ─── XP Log Item Component ───────────────────────────────────────────────────
function XpLogItem({ log, index }) {
  const isNegative = log.amount < 0;
  const src = SOURCE_ICON[log.sourceType] ?? (isNegative
    ? { icon: Zap, color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" }
    : SOURCE_ICON.manual);
  const Icon = src.icon;
  const date = new Date(log.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  const time = new Date(log.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="group flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.025] transition-all duration-200"
    >
      <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform ${src.bg}`}>
        <Icon className={`w-4 h-4 ${src.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-black text-slate-900 dark:text-white truncate">{log.reason}</p>
        <p className="text-[9px] text-slate-400 dark:text-white/30 mt-0.5">{date} · {time}</p>
      </div>
      <span
        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black font-mono ${
          isNegative
            ? "bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400"
            : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400"
        }`}
      >
        <Zap className="w-2.5 h-2.5" />
        {isNegative ? log.amount : `+${log.amount}`}
      </span>
    </motion.div>
  );
}

// ─── Main Achievement Client ─────────────────────────────────────────────────
export default function AchievementClient({
  profile,
  xpLogs = [],
  taskSubs = [],
  moduleProgress = [],
  publishedModules = [],
  allTasks = [],
}) {
  const [activeTab, setTab] = useState("badges");

  const xp        = profile?.xp ?? 0;
  const levelData = getUserLevelData(xp);

  // 1. Modul Progress (100% selesai membaca)
  const totalModules     = publishedModules.length;
  const completedModules = moduleProgress.filter((p) => p.isCompleted).length;

  // 2. Main Quests & Side Quests
  const totalMainQuests = allTasks.filter((t) => (t.category || "MAIN").toUpperCase() === "MAIN").length;
  const totalSideQuests = allTasks.filter((t) => (t.category || "").toUpperCase() === "SIDE").length;

  const approvedMainQuests = taskSubs.filter(
    (s) => (s.task?.category || "MAIN").toUpperCase() === "MAIN"
  ).length;

  const approvedSideQuests = taskSubs.filter(
    (s) => (s.task?.category || "").toUpperCase() === "SIDE"
  ).length;

  const stats = useMemo(() => ({
    xp,
    level: levelData.currentLevel,
    completedModules,
    totalModules,
    approvedMainQuests,
    totalMainQuests,
    approvedSideQuests,
    totalSideQuests,
  }), [xp, levelData.currentLevel, completedModules, totalModules, approvedMainQuests, totalMainQuests, approvedSideQuests, totalSideQuests]);

  const unlockedBadges = useMemo(() => BADGE_DEFS.filter((b) => b.condition(stats)), [stats]);
  const lockedBadges   = useMemo(() => BADGE_DEFS.filter((b) => !b.condition(stats)), [stats]);

  return (
    <div className="w-full space-y-8">

      {/* ── Ambient ──────────────────────────────────────────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-primary/8 dark:bg-primary/5 rounded-full blur-[130px] pointer-events-none -z-10" />

      {/* ── Hero: Profile + XP ───────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gradient-to-br from-[#050e0a] to-[#071510] border border-primary/20 rounded-2xl p-6 sm:p-8 md:p-9 overflow-hidden shadow-lg"
      >
        {/* Glows */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/20 border border-primary/30 text-[10px] font-black text-primary tracking-widest uppercase">
                <Sparkles className="w-3 h-3" /> Gamification Hub
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-white leading-none">
              Achievement
            </h1>
            <p className="text-white/45 text-sm mt-3 leading-relaxed max-w-md">
              Pantau perkembangan level, badge yang sudah kamu raih dari membaca modul & menyelesaikan tugas, serta seluruh riwayat XP-mu.
            </p>

            <div className="mt-6">
              <LevelBadge xp={xp} size="lg" className="mb-4" />
              <XPProgressBar xp={xp} showStats size="md" className="max-w-md" />
            </div>
          </div>

          {/* Right: Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total XP",     val: xp.toLocaleString(),                                 color: "text-amber-400",   icon: Zap },
              { label: "Badge Unlock", val: `${unlockedBadges.length}/${BADGE_DEFS.length}`,     color: "text-purple-400",  icon: Award },
              { label: "Modul 100%",   val: `${completedModules}/${totalModules || "—"}`,        color: "text-blue-400",    icon: BookOpen },
              { label: "Main Quest",   val: `${approvedMainQuests}/${totalMainQuests || "—"}`,   color: "text-emerald-400", icon: Trophy },
            ].map(({ label, val, color, icon: Icon }) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 ${color}`} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{label}</span>
                </div>
                <p className={`text-2xl font-black ${color} font-mono`}>{val}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Level Roadmap ────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <SectionHeader icon={TrendingUp} title="Level Roadmap" className="mb-4" />
        <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
          <div className="flex items-stretch gap-0">
            {[...LEVEL_TIERS].reverse().map((tier, i) => {
              const isUnlocked = levelData.currentLevel >= tier.level;
              const isCurrent  = levelData.currentLevel === tier.level;
              const isLast     = i === LEVEL_TIERS.length - 1;

              return (
                <React.Fragment key={tier.level}>
                  <div className={`flex flex-col items-center flex-1 min-w-0 ${isCurrent ? "scale-[1.05] z-10" : ""} transition-transform`}>
                    <div
                      className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border-2 flex items-center justify-center text-xs font-black mb-2 transition-all ${
                        isUnlocked
                          ? isCurrent
                            ? "bg-primary border-primary text-[#050e0a] shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                            : "bg-primary/20 border-primary/40 text-primary"
                          : "bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/10 text-slate-400 dark:text-white/20"
                      }`}
                    >
                      {isUnlocked ? tier.level : <Lock className="w-4 h-4" />}
                    </div>
                    <p
                      className={`text-[10px] font-black text-center leading-tight hidden sm:block ${
                        isUnlocked
                          ? isCurrent
                            ? "text-primary"
                            : "text-slate-600 dark:text-white/60"
                          : "text-slate-300 dark:text-white/20"
                      }`}
                    >
                      {tier.name}
                    </p>
                    <p
                      className={`text-[8px] sm:text-[9px] font-bold text-center mt-0.5 font-mono ${
                        isUnlocked ? "text-slate-400 dark:text-white/30" : "text-slate-200 dark:text-white/10"
                      }`}
                    >
                      {tier.minXp} XP
                    </p>
                  </div>
                  {!isLast && (
                    <div className="flex-none w-4 md:w-8 flex items-start pt-4">
                      <div
                        className={`w-full h-0.5 mt-1 rounded-full ${
                          isUnlocked && levelData.currentLevel > tier.level
                            ? "bg-primary"
                            : "bg-slate-200 dark:bg-white/10"
                        }`}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* ── Tabs (Badges vs Riwayat XP) ──────────────────────────────── */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/8 rounded-xl w-fit">
        {[
          { key: "badges", label: `Badge (${unlockedBadges.length}/${BADGE_DEFS.length})`, icon: Award },
          { key: "xp",     label: `Riwayat XP (${xpLogs?.length ?? 0})`,                  icon: Zap },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-black transition-all duration-200 ${
              activeTab === key
                ? "bg-white dark:bg-[#0d1f17] text-primary border border-primary/20 shadow-sm"
                : "text-slate-500 dark:text-white/40 hover:text-slate-700 dark:hover:text-white/70"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === "badges" ? (
          <motion.div key="badges" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            
            {/* Unlocked section */}
            {unlockedBadges.length > 0 && (
              <div className="mb-8">
                <p className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Sudah Diraih ({unlockedBadges.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {unlockedBadges.map((b, i) => (
                    <BadgeCard key={b.id} badge={b} unlocked index={i} />
                  ))}
                </div>
              </div>
            )}

            {/* Locked section */}
            {lockedBadges.length > 0 && (
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-white/30 mb-4 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" /> Belum Terbuka ({lockedBadges.length})
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
                  {lockedBadges.map((b, i) => (
                    <BadgeCard key={b.id} badge={b} unlocked={false} index={i} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div key="xp" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none divide-y divide-slate-100 dark:divide-white/[0.04]">
              {xpLogs?.length > 0 ? (
                xpLogs.map((log, i) => <XpLogItem key={log.id} log={log} index={i} />)
              ) : (
                <div className="py-20 text-center">
                  <Zap className="w-12 h-12 mx-auto text-slate-300 dark:text-white/10 mb-3" />
                  <p className="text-sm font-black text-slate-500 dark:text-white/40">Belum ada riwayat XP</p>
                  <p className="text-xs text-slate-400 dark:text-white/25 mt-1">
                    Tuntaskan membaca modul atau selesaikan penugasan untuk mendapatkan XP!
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
