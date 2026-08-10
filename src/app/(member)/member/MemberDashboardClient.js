"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  FolderKanban,
  Flame,
  ArrowRight,
  Star,
  BookOpen,
  Clock,
  Zap,
  Award,
  Play,
  Activity,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { getUserLevelData } from "@/lib/leveling";
import { useLanguage } from "@/i18n/LanguageProvider";
import LevelBadge from "./components/ui/LevelBadge";
import XPProgressBar from "./components/ui/XPProgressBar";
import StatCard from "./components/ui/StatCard";
import { EmptyState, SectionHeader } from "./components/ui/CommonUI";

// ─── Stagger helper ────────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
});

// ─── XP Source Icon map ────────────────────────────────────────────────────
const XP_ICONS = {
  task: <FolderKanban className="w-4 h-4" />,
  quiz: <Star className="w-4 h-4" />,
  attendance: <Flame className="w-4 h-4" />,
  manual: <Award className="w-4 h-4" />,
};

export default function MemberDashboardClient({
  user,
  profile,
  rank,
  tasks,
  submissions,
  completedTasksCount,
  presentCount,
  latestPpt,
  latestLiterature,
  xpLogs,
}) {
  const { t } = useLanguage();
  const [pptProgress, setPptProgress] = useState(0);

  // Baca progress PPT dari localStorage (client-only)
  useEffect(() => {
    if (!latestPpt) return;
    try {
      const saved = localStorage.getItem(`sre_materi_progress_${latestPpt.id}`);
      if (saved) {
        const { currentSlideIdx = 0 } = JSON.parse(saved);
        const total = latestPpt.slides?.length || 1;
        setPptProgress(
          total > 1 ? Math.round((currentSlideIdx / (total - 1)) * 100) : 100,
        );
      }
    } catch (_) {}
  }, [latestPpt]);

  const levelData = getUserLevelData(profile?.xp ?? 0);
  const xp = profile?.xp ?? 0;
  const firstName = user?.name?.split(" ")[0] ?? "Member";

  // Status per task
  const getTaskStatus = (taskId) => {
    const sub = submissions?.find((s) => s.taskId === taskId);
    if (!sub)
      return {
        label: "Belum Dikerjakan",
        cls: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10",
      };
    if (sub.status === "APPROVED")
      return {
        label: "Selesai",
        cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    if (sub.status === "REJECTED")
      return {
        label: "Perlu Revisi",
        cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
      };
    return {
      label: "Menunggu Review",
      cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  };

  // Time-based greeting helper (Indonesian & English via i18n)
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11)
      return t("dashboard.greeting.morning") || "Selamat Pagi";
    if (hour >= 11 && hour < 15)
      return t("dashboard.greeting.afternoon") || "Selamat Siang";
    if (hour >= 15 && hour < 18)
      return t("dashboard.greeting.evening") || "Selamat Sore";
    return t("dashboard.greeting.night") || "Selamat Malam";
  };

  const timeGreeting = getTimeGreeting();

  // ─── RENDER ──────────────────────────────────────────────────────────────
  return (
    <div className="w-full relative space-y-8 select-none">
      {/* ── Ambient background glows ─────────────────────────────────── */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/8 dark:bg-primary/5 rounded-full blur-[130px] pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-10" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-emerald-500/8 dark:bg-emerald-500/5 rounded-full blur-[110px] pointer-events-none mix-blend-multiply dark:mix-blend-screen -z-10" />

      {/* Hero: Welcome + Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* ── Welcome + XP Progress (2/3 width) ────────────────────── */}
        <motion.div
          {...fadeUp(0)}
          className="lg:col-span-2 relative bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-7 md:p-9 flex flex-col justify-between overflow-hidden shadow-xl dark:shadow-2xl"
        >
          {/* Decorative glow */}
          <div className="absolute -right-20 -top-20 w-56 h-56 rounded-full bg-primary/15 dark:bg-primary/8 blur-[60px] pointer-events-none" />

          <div className="relative z-10">
            <LevelBadge xp={xp} size="sm" className="mb-5" />
            <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-slate-900 dark:text-white leading-none">
              {timeGreeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 dark:to-emerald-300">
                {firstName}!
              </span>
            </h1>
            <p className="text-slate-500 dark:text-white/50 text-sm font-medium mt-3 max-w-lg leading-relaxed">
              {t("member_dashboard.welcome_msg")}
            </p>
          </div>

          {/* XP Progress Panel */}
          <div className="relative z-10 mt-7 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-2xl p-5">
            <XPProgressBar xp={xp} showStats size="md" />
          </div>
        </motion.div>

        {/* ── Profile Summary Card (1/3 width, desktop only) ────────── */}
        <motion.div
          {...fadeUp(0.1)}
          className="hidden lg:flex bg-gradient-to-b from-emerald-50 dark:from-[#0a1f15] to-white dark:to-[#07130e] border border-slate-200 dark:border-primary/20 rounded-3xl p-7 flex-col justify-between items-center text-center relative overflow-hidden shadow-xl group"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08)_0%,transparent_70%)] group-hover:opacity-150 transition-opacity pointer-events-none" />

          {/* Avatar */}
          <div className="relative">
            <div className="absolute -inset-2 rounded-full border border-dashed border-primary/40 animate-[spin_12s_linear_infinite]" />
            <div className="absolute -inset-4 rounded-full border border-dashed border-emerald-500/20 animate-[spin_18s_linear_infinite_reverse]" />
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#07130e] shadow-[0_0_40px_rgba(16,185,129,0.2)] relative z-10"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/10 border-4 border-white dark:border-[#07130e] flex items-center justify-center font-black text-3xl text-primary shadow-[0_0_40px_rgba(16,185,129,0.15)] relative z-10">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 border-2 border-white dark:border-[#07130e] z-20 shadow-lg">
              <Award className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Name + Dept */}
          <div className="mt-5 w-full">
            <h3 className="text-xl font-black text-slate-900 dark:text-white truncate">
              {user?.name}
            </h3>
            <p className="text-xs font-bold tracking-widest uppercase text-emerald-600 dark:text-primary/70 mt-1 truncate">
              {user?.department?.name ?? "Member"}
            </p>
            <LevelBadge xp={xp} size="sm" className="mt-3 mx-auto" />
          </div>

          {/* Mini stats */}
          <div className="flex w-full mt-5 px-2 py-3 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 divide-x divide-slate-200 dark:divide-white/10">
            {[
              {
                label: "Rank",
                val: `#${rank}`,
                color: "text-slate-900 dark:text-white",
              },
              {
                label: "Hadir",
                val: presentCount,
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: "Tugas",
                val: completedTasksCount,
                color: "text-amber-600 dark:text-amber-400",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex-1 flex flex-col items-center"
              >
                <span className="text-[9px] text-slate-400 dark:text-white/40 font-bold uppercase">
                  {item.label}
                </span>
                <span className={`text-sm font-black ${item.color}`}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>

          <Link
            href="/member/profil"
            className="w-full mt-5 py-3 rounded-2xl bg-gradient-to-r from-primary to-emerald-400 hover:from-primary-focus hover:to-emerald-500 text-xs font-black text-[#050e0a] tracking-widest uppercase transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:scale-[1.02]"
          >
            {t("member_dashboard.profile.view_full")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Trophy}
          value={xp}
          label={t("member_dashboard.stats.total_xp")}
          iconBg="bg-amber-500/10"
          iconColor="text-amber-500"
          iconBorder="border-amber-500/20"
          delay={0.15}
        />
        <StatCard
          icon={FolderKanban}
          value={completedTasksCount}
          label={t("member_dashboard.stats.tasks_approved")}
          iconBg="bg-blue-500/10"
          iconColor="text-blue-500"
          iconBorder="border-blue-500/20"
          delay={0.2}
        />
        <StatCard
          icon={Star}
          value={`#${rank}`}
          label={t("member_dashboard.stats.rank")}
          iconBg="bg-purple-500/10"
          iconColor="text-purple-500"
          iconBorder="border-purple-500/20"
          delay={0.25}
        />
        <StatCard
          icon={Flame}
          value={presentCount}
          label={t("member_dashboard.stats.attendance")}
          iconBg="bg-orange-500/10"
          iconColor="text-orange-500"
          iconBorder="border-orange-500/20"
          delay={0.3}
        />
      </div>

      {/* Active Quest */}
      {latestPpt && (
        <motion.div
          {...fadeUp(0.35)}
          className="relative rounded-[2rem] p-[1.5px] overflow-hidden group shadow-[0_20px_60px_rgba(16,185,129,0.12)]"
        >
          {/* Animated gradient border */}
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 bg-[length:200%_auto] animate-[bgSlide_4s_linear_infinite] opacity-70" />

          <div className="relative bg-[#050e0a]/96 dark:bg-[#050e0a]/98 backdrop-blur-xl rounded-[2rem] p-7 md:p-9 flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Ambient glows */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/15 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-teal-500/15 rounded-full blur-[100px] pointer-events-none group-hover:scale-125 transition-transform duration-1000" />

            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2.5 mb-4">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Activity className="w-3 h-3" /> Quest Aktif
                </span>
                <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3 fill-current" /> +10 XP
                </span>
              </div>

              <h2 className="text-2xl md:text-4xl font-display font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60 tracking-tight line-clamp-2">
                {latestPpt.title}
              </h2>
              <p className="text-white/45 text-sm mt-3 max-w-xl leading-relaxed line-clamp-2">
                {latestPpt.description ??
                  "Modul pembelajaran resmi SRE UPN Veteran Jawa Timur."}
              </p>

              {/* Progress bar materi */}
              <div className="mt-6 max-w-md">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    Progress Materi
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    {pptProgress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pptProgress}%` }}
                    transition={{
                      duration: 1.2,
                      ease: [0.34, 1.56, 0.64, 1],
                      delay: 0.5,
                    }}
                  />
                </div>
              </div>

              <div className="mt-7">
                <Link
                  href="/member/materi"
                  className="relative inline-flex items-center gap-3 bg-emerald-500 text-[#050e0a] font-black px-8 py-4 rounded-2xl text-sm tracking-widest uppercase overflow-hidden transition-transform active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.65)] group/btn"
                >
                  <div className="absolute inset-0 bg-white/15 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  <Play className="w-5 h-5 fill-current relative z-10" />
                  <span className="relative z-10">Mulai Belajar</span>
                </Link>
              </div>
            </div>

            {/* Thumbnail */}
            <div className="w-full md:w-72 aspect-[4/3] rounded-2xl bg-black/40 border-2 border-white/10 group-hover:border-emerald-500/40 overflow-hidden relative shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-colors duration-500 z-10 flex-shrink-0">
              {latestPpt.coverImageUrl ? (
                <img
                  src={latestPpt.coverImageUrl}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-emerald-500/40">
                  <BookOpen className="w-10 h-10 mb-2 animate-pulse" />
                  <span className="text-xs font-black tracking-widest uppercase">
                    Materi
                  </span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#050e0a] via-[#050e0a]/20 to-transparent opacity-80" />
              <div className="absolute bottom-4 left-4">
                <span className="px-2.5 py-1 bg-white/10 border border-white/10 rounded-lg text-[10px] font-black text-white/80 backdrop-blur-md">
                  {latestPpt.slides?.length ?? "?"} Slide
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tasks & XP Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Tasks Preview (2/3) ────────────────────────────────────── */}
        <motion.div {...fadeUp(0.4)} className="xl:col-span-2 space-y-4">
          <SectionHeader
            icon={FolderKanban}
            title={t("member_dashboard.tasks.title")}
            actionLabel={t("member_dashboard.tasks.view_all")}
            actionHref="/member/tugas"
          />

          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-5 space-y-2.5 shadow-xl dark:shadow-2xl">
            {tasks?.length > 0 ? (
              [...tasks]
                .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
                .slice(0, 5)
                .map((tk, i) => {
                  const status = getTaskStatus(tk.id);
                  const now = new Date();
                  const deadline = new Date(tk.deadline);
                  const diffMs = deadline - now;
                  const isOverdue = diffMs < 0;
                  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

                  let deadlineBadgeText = "";
                  let deadlineBadgeStyle = "";

                  if (isOverdue) {
                    const overdueDays = Math.floor(
                      Math.abs(diffMs) / (1000 * 60 * 60 * 24),
                    );
                    deadlineBadgeText =
                      overdueDays === 0
                        ? "Lewat deadline (Hari ini)"
                        : `Lewat ${overdueDays} hari`;
                    deadlineBadgeStyle =
                      "bg-red-500/15 text-red-500 border-red-500/30 font-black shadow-[0_0_10px_rgba(239,68,68,0.2)]";
                  } else if (diffDays === 0) {
                    deadlineBadgeText = `Tenggat ${diffHours} jam lagi`;
                    deadlineBadgeStyle =
                      "bg-red-500/10 text-red-400 border-red-500/25 font-bold animate-pulse";
                  } else if (diffDays <= 3) {
                    deadlineBadgeText = `Tenggat ${diffDays} hari lagi`;
                    deadlineBadgeStyle =
                      "bg-amber-500/10 text-amber-500 border-amber-500/25 font-bold";
                  } else {
                    const formatted = deadline.toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    deadlineBadgeText = `${diffDays} hari lagi (${formatted})`;
                    deadlineBadgeStyle =
                      "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10";
                  }

                  return (
                    <motion.div
                      key={tk.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                    >
                      <Link
                        href="/member/tugas"
                        className="group relative flex items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-primary/30 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.12)] hover:scale-[1.01] overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Icon + Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center flex-shrink-0 transition-colors">
                            <FolderKanban className="w-4.5 h-4.5 text-slate-400 dark:text-white/40 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-black text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                              {tk.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span
                                className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md border ${deadlineBadgeStyle}`}
                              >
                                <Clock className="w-3 h-3 shrink-0" />
                                {deadlineBadgeText}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-shrink-0 relative z-10">
                          <span
                            className={`hidden sm:inline-flex px-2.5 py-1 rounded-lg border text-[9px] font-black uppercase tracking-widest ${status.cls}`}
                          >
                            {status.label}
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-400 font-mono">
                            <Zap className="w-3 h-3" />+{tk.rewardXp}
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })
            ) : (
              <EmptyState
                icon={FolderKanban}
                title={t("member_dashboard.tasks.no_tasks")}
                description={t("member_dashboard.tasks.no_tasks_desc")}
              />
            )}
          </div>
        </motion.div>

        {/* ── XP Activity Log (1/3) ─────────────────────────────────── */}
        <motion.div {...fadeUp(0.45)} className="space-y-4">
          <SectionHeader
            icon={TrendingUp}
            title={t("member_dashboard.xp_logs.title")}
            actionLabel="Semua"
            actionHref="/member/achievement"
          />

          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-5 space-y-1 shadow-xl dark:shadow-2xl">
            {xpLogs?.length > 0 ? (
              [...xpLogs]
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5)
                .map((log, i) => {
                  const date = new Date(log.createdAt).toLocaleDateString(
                    "id-ID",
                    {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  );
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.06 }}
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                          {XP_ICONS[log.sourceType] ?? XP_ICONS.manual}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 dark:text-white truncate">
                            {log.reason}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-white/30 mt-0.5">
                            {date}
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 font-mono">
                        <Zap className="w-2.5 h-2.5" />+{log.amount}
                      </span>
                    </motion.div>
                  );
                })
            ) : (
              <EmptyState
                icon={Star}
                title={t("member_dashboard.xp_logs.no_xp")}
                description={t("member_dashboard.xp_logs.no_xp_desc")}
              />
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Links */}
      <motion.div {...fadeUp(0.5)}>
        <SectionHeader icon={Activity} title="Menu Cepat" className="mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            {
              href: "/member/leaderboard",
              icon: Trophy,
              label: "Leaderboard",
              color: "text-amber-500",
              bg: "bg-amber-500/10",
              border: "border-amber-500/20",
            },
            {
              href: "/member/tugas",
              icon: FolderKanban,
              label: "Tugas",
              color: "text-blue-500",
              bg: "bg-blue-500/10",
              border: "border-blue-500/20",
            },
            {
              href: "/member/absensi",
              icon: ClipboardCheck,
              label: "Absensi",
              color: "text-emerald-500",
              bg: "bg-emerald-500/10",
              border: "border-emerald-500/20",
            },
            {
              href: "/member/dokumen",
              icon: BookOpen,
              label: "Dokumen",
              color: "text-purple-500",
              bg: "bg-purple-500/10",
              border: "border-purple-500/20",
            },
            {
              href: "/member/achievement",
              icon: Award,
              label: "Achievement",
              color: "text-pink-500",
              bg: "bg-pink-500/10",
              border: "border-pink-500/20",
            },
          ].map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.06 }}
            >
              <Link
                href={item.href}
                className={`group flex flex-col items-center gap-2.5 p-5 rounded-2xl bg-white dark:bg-[#08120e] border ${item.border} hover:border-opacity-60 dark:border-white/5 dark:hover:border-white/10 shadow-sm hover:shadow-md dark:shadow-none transition-all duration-300 hover:scale-[1.03]`}
              >
                <div
                  className={`p-3 rounded-xl ${item.bg} ${item.border} border ${item.color} group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-white/70">
                  {item.label}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
