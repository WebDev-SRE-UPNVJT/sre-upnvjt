"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  BookOpen,
  Presentation,
  Crown,
  Target,
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Zap,
  Sparkles,
  ArrowUpRight,
  Check,
  Award,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { SectionHeader } from "./ui/CommonUI";

export default function PhaseProgressTree({ phaseHierarchy = [] }) {
  const { t, language } = useLanguage();
  
  // All phases open by default
  const [openPhases, setOpenPhases] = useState(() => {
    const initial = {};
    phaseHierarchy.forEach((p) => {
      initial[p.id] = true;
    });
    return initial;
  });

  const togglePhase = (id) => {
    setOpenPhases((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!phaseHierarchy || phaseHierarchy.length === 0) {
    return null;
  }

  // Calculate overall statistics
  let totalAll = 0;
  let completedAll = 0;
  let totalXpEarnable = 0;

  phaseHierarchy.forEach((p) => {
    totalAll += p.totalItems || 0;
    completedAll += p.completedItems || 0;
    (p.modules || []).forEach((m) => {
      (m.tasks || []).forEach((t) => {
        totalXpEarnable += t.rewardXp || 0;
      });
    });
  });

  const overallPct = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* ── Section Header (matches Recent XP Activities & dashboard sections) ── */}
      <SectionHeader
        icon={Layers}
        title={t("member_dashboard.phase_tree.title") || (language === "en" ? "Phase Learning Tree" : "Roadmap Pembelajaran")}
        rightElement={
          <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] sm:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
            <span className="font-mono font-black">{overallPct}%</span>
            <span className="text-slate-400 dark:text-white/40">
              ({completedAll}/{totalAll} {t("member_dashboard.phase_tree.done") || (language === "en" ? "Done" : "Tuntas")})
            </span>
          </div>
        }
      />

      {/* ── Phases List Card ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/10 rounded-xl p-3.5 sm:p-5 shadow-sm dark:shadow-none space-y-3 sm:space-y-4">
        {phaseHierarchy.map((phase, pIdx) => {
          const isOpen = !!openPhases[phase.id];
          const isPhaseCompleted = phase.totalItems > 0 && phase.completedItems >= phase.totalItems;
          const hasStarted = phase.completedItems > 0;

          return (
            <div
              key={phase.id || `phase-${pIdx}`}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isPhaseCompleted
                  ? "border-emerald-500/30 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.02]"
                  : "border-slate-200 dark:border-white/10 bg-slate-50/40 dark:bg-white/[0.01]"
              }`}
            >
              {/* Phase Header Bar */}
              <div
                onClick={() => togglePhase(phase.id)}
                className="p-3.5 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer hover:bg-slate-100/50 dark:hover:bg-white/[0.03] transition-colors select-none"
              >
                {/* Mobile Top Row / Desktop Left Side */}
                <div className="flex items-center justify-between sm:justify-start gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Phase Number Badge */}
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition-transform ${
                        isPhaseCompleted
                          ? "bg-emerald-500 text-slate-950 shadow-sm"
                          : hasStarted
                          ? "bg-slate-900 dark:bg-emerald-500/20 text-white dark:text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white/60"
                      }`}
                    >
                      {isPhaseCompleted ? <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" /> : `F${pIdx + 1}`}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">
                          FASE {pIdx + 1}
                        </span>
                        {isPhaseCompleted ? (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[9px] font-black uppercase tracking-wider">
                            {language === "en" ? "Completed" : "Tuntas 100%"}
                          </span>
                        ) : hasStarted ? (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[9px] font-bold uppercase tracking-wider">
                            {language === "en" ? "In Progress" : "Sedang Berjalan"}
                          </span>
                        ) : null}
                      </div>

                      <h3
                        className={`text-sm sm:text-base font-black truncate mt-0.5 ${
                          isPhaseCompleted
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {phase.name}
                      </h3>
                    </div>
                  </div>

                  {/* Mobile-only Chevron Toggle */}
                  <div className="sm:hidden w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/5 flex items-center justify-center text-slate-500 dark:text-white/50 shrink-0">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>

                {/* Progress bar & Desktop Chevron */}
                <div className="flex items-center gap-4 shrink-0 w-full sm:w-auto sm:pl-4">
                  <div className="w-full sm:w-48">
                    <div className="flex justify-between items-center text-[11px] font-bold mb-1.5">
                      <span className="text-slate-400 dark:text-white/40 text-[10px]">
                        {phase.completedItems}/{phase.totalItems} {language === "en" ? "Items" : "Selesai"}
                      </span>
                      <span
                        className={`font-mono font-black ${
                          phase.progressPct === 100
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-700 dark:text-white/80"
                        }`}
                      >
                        {phase.progressPct}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${phase.progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Desktop-only Chevron */}
                  <div className="hidden sm:flex w-7 h-7 rounded-lg bg-slate-200/60 dark:bg-white/5 items-center justify-center text-slate-500 dark:text-white/50 shrink-0">
                    {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Tree Body */}
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-[#07130e] p-4 sm:p-6 space-y-6"
                  >
                    {phase.modules.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-white/30 italic py-2">
                        {language === "en"
                          ? "No modules or tasks in this phase yet."
                          : "Belum ada materi atau tugas di fase ini."}
                      </p>
                    ) : (
                      phase.modules.map((mod, mIdx) => (
                        <div key={mod.id} className="relative">
                          {/* ── Module Card ─────────────────────────────── */}
                          <div
                            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              mod.isCompleted
                                ? "bg-slate-50/80 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5"
                                : "bg-white dark:bg-[#091812] border-slate-200 dark:border-white/10 hover:border-emerald-500/40 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-3 min-w-0">
                              {/* Module Icon Node */}
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 font-bold ${
                                  mod.isCompleted
                                    ? "bg-emerald-500 text-slate-950"
                                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                }`}
                              >
                                {mod.isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : (
                                  <Presentation className="w-4 h-4" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-white/40">
                                    Modul {mIdx + 1}
                                  </span>
                                  {mod.slideCount > 0 && (
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-white/40">
                                      • {mod.slideCount} Slide
                                    </span>
                                  )}
                                  {mod.isCompleted && (
                                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                                      Selesai Dibaca
                                    </span>
                                  )}
                                </div>

                                <h4
                                  className={`text-sm sm:text-base font-bold mt-1 leading-snug ${
                                    mod.isCompleted
                                      ? "line-through text-slate-400 dark:text-white/40 font-medium"
                                      : "text-slate-900 dark:text-white"
                                  }`}
                                >
                                  {mod.title}
                                </h4>
                              </div>
                            </div>

                            {/* Module Action Button */}
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                              {mod.isCompleted ? (
                                <Link
                                  href={`/member/materi/${mod.id}`}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-white/50 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1"
                                >
                                  <span>Baca Ulang</span>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                </Link>
                              ) : (
                                <Link
                                  href={`/member/materi/${mod.id}`}
                                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <span>{mod.progressPct > 0 ? "Lanjutkan" : "Buka Modul"}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                              )}
                            </div>
                          </div>

                          {/* ── Sub-tree: Quests Linked to this Module ─── */}
                          {mod.tasks && mod.tasks.length > 0 && (
                            <div className="relative ml-6 sm:ml-8 pl-5 sm:pl-6 border-l-2 border-slate-200 dark:border-white/10 space-y-3 pt-3 pb-1">
                              {mod.tasks.map((taskItem) => {
                                const isMain =
                                  taskItem.category === "MAIN" ||
                                  (!taskItem.category && (taskItem.rewardXp || 0) >= 50);
                                const isApproved = taskItem.isApproved;
                                const isPending = taskItem.submission?.status === "PENDING";
                                const isRejected = taskItem.submission?.status === "REJECTED";

                                return (
                                  <div
                                    key={taskItem.id}
                                    className={`relative flex items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border transition-all ${
                                      isApproved
                                        ? "bg-slate-50/60 dark:bg-white/[0.01] border-slate-200/60 dark:border-white/5"
                                        : isMain
                                        ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.04] border-amber-500/20 hover:border-amber-500/40"
                                        : "bg-blue-500/[0.03] dark:bg-blue-500/[0.04] border-blue-500/20 hover:border-blue-500/40"
                                    }`}
                                  >
                                    {/* Horizontal Elbow Branch Line */}
                                    <div className="absolute -left-5 sm:-left-6 top-1/2 -translate-y-1/2 w-5 sm:w-6 h-0.5 bg-slate-200 dark:bg-white/10" />

                                    {/* Left Content */}
                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                      {/* Status Icon */}
                                      <div
                                        className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                          isApproved
                                            ? "bg-emerald-500 text-slate-950"
                                            : isPending
                                            ? "bg-amber-500/20 text-amber-500"
                                            : isMain
                                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                        }`}
                                      >
                                        {isApproved ? (
                                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                                        ) : isPending ? (
                                          <Clock className="w-3.5 h-3.5" />
                                        ) : isMain ? (
                                          <Crown className="w-3.5 h-3.5 fill-current" />
                                        ) : (
                                          <Target className="w-3.5 h-3.5" />
                                        )}
                                      </div>

                                      {/* Quest Type Pill */}
                                      <span
                                        className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                                          isMain
                                            ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25"
                                            : "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25"
                                        }`}
                                      >
                                        {isMain ? "Main Quest" : "Side Quest"}
                                      </span>

                                      {/* Title */}
                                      <span
                                        className={`text-xs font-bold truncate ${
                                          isApproved
                                            ? "line-through text-slate-400 dark:text-white/40 font-medium"
                                            : "text-slate-800 dark:text-slate-200"
                                        }`}
                                        title={taskItem.title}
                                      >
                                        {taskItem.title}
                                      </span>
                                    </div>

                                    {/* Right Status & XP */}
                                    <div className="flex items-center gap-2.5 shrink-0">
                                      <span className="text-[11px] font-mono font-bold text-amber-500 flex items-center gap-0.5">
                                        <Zap className="w-3 h-3 fill-amber-400" />
                                        +{taskItem.rewardXp} XP
                                      </span>

                                      {isApproved ? (
                                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                                          Approved
                                        </span>
                                      ) : isPending ? (
                                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                                          Review
                                        </span>
                                      ) : isRejected ? (
                                        <Link
                                          href="/member/tugas"
                                          className="px-2.5 py-1 rounded-md bg-rose-500 hover:bg-rose-400 text-white text-[10px] font-bold uppercase tracking-wider"
                                        >
                                          Revisi
                                        </Link>
                                      ) : (
                                        <Link
                                          href="/member/tugas"
                                          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-emerald-500 dark:bg-white/10 dark:hover:bg-emerald-400 text-white dark:hover:text-slate-950 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"
                                        >
                                          <span>Kerjakan</span>
                                          <ChevronRight className="w-3 h-3" />
                                        </Link>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
