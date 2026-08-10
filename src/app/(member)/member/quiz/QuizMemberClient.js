"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Award, Clock, HelpCircle, AlertTriangle, ArrowRight,
  CheckCircle2, XCircle, ArrowLeft, Send, Sparkles, RefreshCw,
  Trophy, BookmarkCheck, ChevronLeft, ChevronRight, FileText, Zap, Gamepad2
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";

export default function QuizMemberClient({ initialQuizzes, initialSubmissions }) {
  const { t } = useLanguage();
  const router = useRouter();
  const [quizzes] = useState(initialQuizzes || []);
  const [submissions, setSubmissions] = useState(initialSubmissions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Modals
  const [confirmSubmitModal, setConfirmSubmitModal] = useState(false);
  const [startConfirmModal, setStartConfirmModal] = useState(null);

  const timerRef = useRef(null);

  const getQuizAttempts = (quizId) => {
    const attempts = submissions.filter(s => s.quizId === quizId);
    if (attempts.length === 0) return { count: 0, bestScore: null, passed: false };
    const bestScore = Math.max(...attempts.map(a => a.totalScore ?? a.mcqScore ?? 0));
    const passed = attempts.some(a => a.isPassed);
    return { count: attempts.length, bestScore, passed };
  };

  // Start Quiz (redirect to immersive page)
  const handleStartQuiz = (qz) => {
    setStartConfirmModal(null);
    router.push(`/member/quiz/${qz.id}`);
  };

  return (
    <div className="w-full relative select-none">
      {/* Gamified Background Elements */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Floating Icons Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <motion.div
          animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-20 left-10"
        >
          <Gamepad2 className="w-16 h-16 text-primary" />
        </motion.div>
        <motion.div
          animate={{ y: [0, 30, 0], rotate: [0, -15, 0] }}
          transition={{ duration: 7, repeat: Infinity }}
          className="absolute top-60 right-20"
        >
          <Target className="w-24 h-24 text-emerald-500" />
        </motion.div>
        <motion.div
          animate={{ y: [0, -40, 0], rotate: [0, 20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-20 left-1/3"
        >
          <Trophy className="w-20 h-20 text-amber-500" />
        </motion.div>
      </div>

      {/* Header */}
      <div className="mb-12 relative z-10 text-center">
        <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-primary/30 text-xs font-black text-primary tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
          RE-Solve
        </span>
        <h1 className="text-4xl md:text-6xl font-display font-black tracking-tighter text-slate-900 dark:text-white flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 mb-4 drop-shadow-sm text-center">
          <span>{t("member_quiz.title")}</span>
        </h1>
        <p className="text-slate-600 dark:text-white/60 max-w-2xl mx-auto font-medium text-sm md:text-base leading-relaxed">
          {t("member_quiz.subtitle")}
        </p>
      </div>

      {isLoading && (
        <div className="py-20 flex items-center justify-center relative z-10">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl bg-rose-100 dark:bg-rose-500/10 border-l-4 border-rose-500 text-rose-600 dark:text-rose-400 text-sm font-bold flex gap-3 items-center relative z-10 shadow-md"
        >
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      {!isLoading && quizzes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-24 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-[#08120e]/50 backdrop-blur-md border-2 border-dashed border-slate-300 dark:border-white/10 rounded-3xl relative z-10 shadow-sm dark:shadow-none"
        >
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
            <HelpCircle className="w-12 h-12 text-slate-300 dark:text-white/20 animate-pulse" />
          </div>
          <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">
            {t("member_quiz.no_quiz")}
          </h3>
          <p className="text-slate-500 dark:text-white/50 text-sm max-w-sm leading-relaxed font-medium">
            {t("member_quiz.no_quiz_desc")}
          </p>
        </motion.div>
      ) : (
        !isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
            {quizzes.map((qz, idx) => {
              const status = getQuizAttempts(qz.id);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={qz.id}
                  className="group relative rounded-[2rem] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] z-10 hover:z-20"
                >
                  {/* Ambient Glow Effect */}
                  <div className="absolute -inset-2 bg-primary/30 dark:bg-primary/40 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none" />

                  <div className="relative bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 group-hover:border-primary/50 rounded-[2rem] h-full p-6 flex flex-col justify-between overflow-hidden transition-colors duration-500 shadow-xl shadow-slate-200/50 dark:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    {/* Card Background Pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-50" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 dark:from-[#08120e] dark:via-[#08120e]/80 to-transparent pointer-events-none" />

                    <div className="relative z-10">
                      <div className="flex justify-between items-start mb-5">
                        <div
                          className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${
                            status.passed
                              ? "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/30"
                              : status.count > 0
                                ? "bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-500/30"
                                : "bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-white/40 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {status.passed
                            ? t("member_quiz.status_passed")
                            : status.count > 0
                              ? t("member_quiz.status_not_passed")
                              : t("member_quiz.status_unattempted")}
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-50 dark:bg-amber-500/10 border-2 border-amber-200 dark:border-amber-500/20 text-[11px] font-black text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/10">
                          <Sparkles className="w-3.5 h-3.5 fill-amber-500 dark:fill-amber-400" />{" "}
                          +{qz.rewardXp} XP
                        </div>
                      </div>

                      <h3 className="font-display font-black text-slate-800 dark:text-white text-lg md:text-xl mb-2 group-hover:text-primary transition-colors line-clamp-2 leading-tight break-words">
                        {qz.title}
                      </h3>
                      {qz.description && (
                        <p className="text-xs md:text-sm text-slate-500 dark:text-white/50 line-clamp-2 leading-relaxed mb-6 font-medium break-words">
                          {qz.description}
                        </p>
                      )}

                      <div className="space-y-3 mb-6 bg-slate-50 dark:bg-black/30 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-white/60 font-bold">
                            <Clock className="w-4 h-4 text-primary" /> Waktu
                          </div>
                          <span className="font-black text-slate-800 dark:text-white">
                            {qz.timeLimitMinutes
                              ? `${qz.timeLimitMinutes} ${t("member_quiz.minutes")}`
                              : "∞"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <div className="flex items-center gap-2 text-slate-600 dark:text-white/60 font-bold">
                            <Target className="w-4 h-4 text-primary" /> Syarat
                          </div>
                          <span className="font-black text-slate-800 dark:text-white">
                            {qz.passingScore}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col gap-3 relative z-10">
                      {status.count > 0 && (
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/5">
                          <span>
                            {t("member_quiz.best_score")}:{" "}
                            <span className="text-primary">
                              {status.bestScore}
                            </span>
                          </span>
                        </div>
                      )}
                      {status.count > 0 ? (
                        <button
                          disabled
                          className="w-full py-4 bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-white/30 cursor-not-allowed rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-widest border border-slate-300 dark:border-white/10"
                        >
                          <span>Sudah Dikerjakan</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => setStartConfirmModal(qz)}
                          className="w-full py-4 bg-slate-900 dark:bg-primary text-white dark:text-[#050e0a] group-hover:bg-primary group-hover:text-white dark:group-hover:bg-primary-focus transition-all rounded-xl font-black flex items-center justify-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-slate-900/20 dark:shadow-[0_0_20px_rgba(16,185,129,0.2)] dark:group-hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] transform group-hover:-translate-y-1"
                        >
                          <span>{t("member_quiz.btn_start_quiz")}</span>
                          <ArrowRight className="w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* Confirm Start Quiz Modal */}
      <AnimatePresence>
        {startConfirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setStartConfirmModal(null)}
              className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#08120e] border-2 border-slate-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-2xl z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-500/30 flex items-center justify-center mx-auto mb-6 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
                <Target className="w-10 h-10 text-amber-500 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-3 uppercase tracking-tight">
                {t("member_quiz.modal_start_title")}
              </h3>
              <p className="text-sm text-slate-500 dark:text-white/60 mb-8 leading-relaxed font-medium">
                {t("member_quiz.modal_start_desc")}
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setStartConfirmModal(null)}
                  className="flex-1 py-4 rounded-xl border-2 border-slate-200 dark:border-white/10 text-xs font-black text-slate-600 dark:text-white/60 hover:bg-slate-50 dark:hover:bg-white/5 uppercase tracking-widest"
                >
                  {t("member_quiz.btn_cancel")}
                </button>
                <button
                  onClick={() => handleStartQuiz(startConfirmModal)}
                  className="flex-1 py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all uppercase tracking-widest"
                >
                  {t("member_quiz.btn_yes_start")}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
