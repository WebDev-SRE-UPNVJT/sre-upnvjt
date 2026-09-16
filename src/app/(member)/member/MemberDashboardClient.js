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
  Presentation,
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
import { resolveImageUrl } from "@/lib/imageUrl";
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
  const fullName = user?.name ?? "Member";

  // Status per task
  const getTaskStatus = (taskId) => {
    const sub = submissions?.find((s) => s.taskId === taskId);
    if (!sub)
      return {
        label: t("member_dashboard.tasks.status_not_started") || "Belum Dikerjakan",
        cls: "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/50 border-slate-200 dark:border-white/10",
      };
    if (sub.status === "APPROVED")
      return {
        label: t("member_dashboard.tasks.status_completed") || "Selesai",
        cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
    if (sub.status === "REJECTED")
      return {
        label: t("member_dashboard.tasks.status_revising") || "Perlu Revisi",
        cls: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20",
      };
    return {
      label: t("member_dashboard.tasks.status_reviewing") || "Menunggu Review",
      cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20",
    };
  };

  // Time-based greeting helper (Indonesian & English via i18n)
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11)
      return t("member_dashboard.greeting.morning") || t("dashboard.greeting.morning") || "Selamat Pagi";
    if (hour >= 11 && hour < 15)
      return t("member_dashboard.greeting.afternoon") || t("dashboard.greeting.afternoon") || "Selamat Siang";
    if (hour >= 15 && hour < 18)
      return t("member_dashboard.greeting.evening") || t("dashboard.greeting.evening") || "Selamat Sore";
    return t("member_dashboard.greeting.night") || t("dashboard.greeting.night") || "Selamat Malam";
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
          className="lg:col-span-2 relative bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden shadow-sm dark:shadow-none"
        >
          {/* Subtle light accent */}
          <div className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-primary/10 dark:bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <LevelBadge xp={xp} size="sm" className="mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {timeGreeting},{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400 dark:to-emerald-300">
                <span className="inline md:hidden">{firstName}!</span>
                <span className="hidden md:inline">{fullName}!</span>
              </span>
            </h1>
            <p className="text-slate-500 dark:text-white/50 text-sm font-medium mt-2.5 max-w-lg leading-relaxed">
              {t("member_dashboard.welcome_msg")}
            </p>
          </div>

          {/* XP Progress Panel */}
          <div className="relative z-10 mt-6 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-lg p-4 sm:p-5">
            <XPProgressBar xp={xp} showStats size="md" />
          </div>
        </motion.div>

        {/* ── Profile Summary Card (1/3 width, desktop only) ────────── */}
        <motion.div
          {...fadeUp(0.1)}
          className="hidden lg:flex bg-gradient-to-b from-emerald-50/50 dark:from-[#0a1f15] to-white dark:to-[#07130e] border border-slate-200 dark:border-white/10 rounded-xl p-6 sm:p-7 flex-col justify-between items-center text-center relative overflow-hidden shadow-sm dark:shadow-none group"
        >
          {/* Avatar */}
          <div className="relative">
            {user?.profilePictureUrl ? (
              <img
                src={user.profilePictureUrl}
                alt={user.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-primary/40 shadow-md relative z-10"
              />
            ) : (
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/10 border-2 border-primary/40 flex items-center justify-center font-black text-2xl sm:text-3xl text-primary shadow-md relative z-10">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1.5 border-2 border-white dark:border-[#07130e] z-20 shadow-md">
              <Award className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          {/* Name + Dept */}
          <div className="mt-4 w-full">
            <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">
              {user?.name}
            </h3>
            <p className="text-xs font-bold tracking-wider uppercase text-emerald-600 dark:text-primary/80 mt-0.5 truncate">
              {user?.department?.name ?? "Member"}
            </p>
            <LevelBadge xp={xp} size="sm" className="mt-2.5 mx-auto" />
          </div>

          {/* Mini stats */}
          <div className="flex w-full mt-4 px-2 py-2.5 bg-slate-50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5 divide-x divide-slate-200 dark:divide-white/10">
            {[
              {
                label: t("member_dashboard.profile.rank") || "Rank",
                val: `#${rank}`,
                color: "text-slate-900 dark:text-white",
              },
              {
                label: t("member_dashboard.profile.attendance") || "Hadir",
                val: presentCount,
                color: "text-emerald-600 dark:text-emerald-400",
              },
              {
                label: t("member_dashboard.profile.tasks") || "Tugas",
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
            className="w-full mt-4 py-2.5 rounded-xl bg-primary hover:bg-primary-focus text-xs font-black text-[#050e0a] tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm hover:scale-[1.01]"
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

      {/* Active Material Banner */}
      {latestPpt && (
        <motion.div
          {...fadeUp(0.35)}
          className="relative rounded-xl overflow-hidden group border border-emerald-500/30 bg-gradient-to-br from-[#06241b] via-[#083024] to-[#041a13] dark:from-[#051c15] dark:via-[#07261d] dark:to-[#03140e] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8 shadow-lg"
        >
          <div className="flex-1 relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> {t("member_dashboard.latest_material") || "Materi Terbaru"}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-tight leading-snug line-clamp-2">
              {latestPpt.title}
            </h2>
            <p className="text-white/70 text-xs sm:text-sm font-medium mt-2 max-w-xl leading-relaxed line-clamp-2">
              {latestPpt.description ??
                "Modul pembelajaran resmi SRE UPN Veteran Jawa Timur."}
            </p>

            {/* Progress bar materi */}
            <div className="mt-5 max-w-md">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-emerald-300/80 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {t("member_dashboard.material_progress") || "Progress Materi"}
                </span>
                <span className="text-xs font-black text-emerald-300 font-mono">
                  {pptProgress}%
                </span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10 relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${pptProgress}%` }}
                  transition={{
                    duration: 1,
                    ease: [0.34, 1.56, 0.64, 1],
                    delay: 0.5,
                  }}
                />
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/member/materi"
                className="inline-flex items-center gap-2.5 bg-emerald-400 hover:bg-emerald-300 text-[#041a13] font-black px-6 py-3 rounded-lg text-xs tracking-wider uppercase transition-all duration-200 active:scale-95 shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>
                  {pptProgress > 0 ? (t("member_dashboard.continue_learning") || "Lanjutkan Belajar") : (t("member_dashboard.start_learning") || "Mulai Belajar")}
                </span>
              </Link>
            </div>
          </div>

          {/* Thumbnail */}
          <div className="w-full md:w-64 aspect-[16/10] sm:aspect-[4/3] rounded-lg bg-black/60 border border-emerald-400/30 overflow-hidden relative shadow-md flex-shrink-0">
            {latestPpt.coverImageUrl ? (
              <img
                src={resolveImageUrl(latestPpt.coverImageUrl)}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-emerald-400/50 bg-gradient-to-br from-emerald-950 to-slate-950">
                <BookOpen className="w-9 h-9 mb-1.5" />
                <span className="text-[11px] font-black tracking-widest uppercase">
                  {t("member_dashboard.slides_count") || "Materi"}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#041a13] via-transparent to-transparent opacity-80" />
            <div className="absolute bottom-2.5 left-2.5">
              <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-400/30 rounded-md text-[10px] font-black text-emerald-300 uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-emerald-400" />
                {latestPpt.slides?.length ?? "?"} {t("member_dashboard.slides_count") || "Slide"}
              </span>
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

          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 space-y-2.5 shadow-sm dark:shadow-none">
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
                      "bg-red-500/15 text-red-500 border-red-500/30 font-black";
                  } else if (diffDays === 0) {
                    deadlineBadgeText = `Tenggat ${diffHours} jam lagi`;
                    deadlineBadgeStyle =
                      "bg-red-500/10 text-red-400 border-red-500/25 font-bold";
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
                        className="group relative flex items-center justify-between gap-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 hover:border-primary/30 rounded-lg p-3.5 transition-all duration-200 hover:shadow-sm overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Icon + Info */}
                        <div className="flex items-center gap-3 flex-1 min-w-0 relative z-10">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 group-hover:bg-primary/10 group-hover:border-primary/30 flex items-center justify-center flex-shrink-0 transition-colors">
                            <FolderKanban className="w-4.5 h-4.5 text-slate-400 dark:text-white/40 group-hover:text-primary transition-colors" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
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
                          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-black text-amber-500 font-mono">
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
            actionLabel={t("member_dashboard.view_all_short") || "Semua"}
            actionHref="/member/achievement"
          />

          <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-4 sm:p-5 space-y-1 shadow-sm dark:shadow-none">
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
                      className="group flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-white/[0.03] transition-all duration-200"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
                          {XP_ICONS[log.sourceType] ?? XP_ICONS.manual}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {log.reason}
                          </p>
                          <p className="text-[9px] text-slate-400 dark:text-white/30 mt-0.5">
                            {date}
                          </p>
                        </div>
                      </div>
                      <span className="flex-shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-500 font-mono">
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
        <SectionHeader icon={Activity} title={t("member_dashboard.quick_menu") || "Menu Cepat"} className="mb-4" />
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
          {[
            {
              href: "/member/leaderboard",
              icon: Trophy,
              label: t("member_dashboard.quick_menu_items.leaderboard") || "Leaderboard",
              color: "text-amber-500 dark:text-amber-400",
              bg: "bg-amber-500/10 dark:bg-amber-500/15",
              border: "border-amber-500/25",
              hoverGlow: "",
            },
            {
              href: "/member/tugas",
              icon: FolderKanban,
              label: t("member_dashboard.quick_menu_items.tasks") || "Tugas",
              color: "text-blue-500 dark:text-blue-400",
              bg: "bg-blue-500/10 dark:bg-blue-500/15",
              border: "border-blue-500/25",
              hoverGlow: "",
            },
            {
              href: "/member/absensi",
              icon: ClipboardCheck,
              label: t("member_dashboard.quick_menu_items.attendance") || "Absensi",
              color: "text-emerald-500 dark:text-emerald-400",
              bg: "bg-emerald-500/10 dark:bg-emerald-500/15",
              border: "border-emerald-500/25",
              hoverGlow: "",
            },
            {
              href: "/member/materi",
              icon: Presentation,
              label: t("member_dashboard.quick_menu_items.material") || "Materi",
              color: "text-teal-500 dark:text-teal-400",
              bg: "bg-teal-500/10 dark:bg-teal-500/15",
              border: "border-teal-500/25",
              hoverGlow: "",
            },
            {
              href: "/member/dokumen",
              icon: BookOpen,
              label: t("member_dashboard.quick_menu_items.documents") || "Dokumen",
              color: "text-purple-500 dark:text-purple-400",
              bg: "bg-purple-500/10 dark:bg-purple-500/15",
              border: "border-purple-500/25",
              hoverGlow: "",
            },
            {
              href: "/member/achievement",
              icon: Award,
              label: t("member_dashboard.quick_menu_items.achievement") || "Achievement",
              color: "text-pink-500 dark:text-pink-400",
              bg: "bg-pink-500/10 dark:bg-pink-500/15",
              border: "border-pink-500/25",
              hoverGlow: "",
            },
          ].map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.04 }}
            >
              <Link
                href={item.href}
                className={`group flex flex-col items-center justify-center gap-2 p-3 sm:p-4 rounded-xl bg-white dark:bg-[#07130e] border ${item.border} hover:border-emerald-500/40 dark:border-white/10 dark:hover:border-emerald-400/30 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5`}
              >
                <div
                  className={`p-2.5 rounded-lg ${item.bg} ${item.border} border ${item.color} group-hover:scale-105 transition-transform duration-200`}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-white text-center leading-tight truncate w-full">
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
