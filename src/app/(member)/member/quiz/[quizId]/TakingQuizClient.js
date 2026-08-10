"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import {
  X,
  Check,
  Clock,
  Send,
  Target,
  ChevronRight,
  Trophy,
  Zap,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
  Flame,
  Star,
  Shield,
} from "lucide-react";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

const OPTION_THEMES = [
  {
    base: "from-emerald-900/60 to-emerald-800/40 border-emerald-500/40 hover:border-emerald-400/80 hover:from-emerald-800/70 hover:to-emerald-700/50",
    label: "bg-emerald-500/30 text-emerald-300 border-emerald-500/50",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]",
    shadow: "shadow-[0_6px_0_rgba(16,185,129,0.3)]",
  },
  {
    base: "from-teal-900/60 to-teal-800/40 border-teal-500/40 hover:border-teal-400/80 hover:from-teal-800/70 hover:to-teal-700/50",
    label: "bg-teal-500/30 text-teal-300 border-teal-500/50",
    glow: "shadow-[0_0_20px_rgba(20,184,166,0.15)]",
    shadow: "shadow-[0_6px_0_rgba(20,184,166,0.3)]",
  },
  {
    base: "from-cyan-900/60 to-cyan-800/40 border-cyan-500/40 hover:border-cyan-400/80 hover:from-cyan-800/70 hover:to-cyan-700/50",
    label: "bg-cyan-500/30 text-cyan-300 border-cyan-500/50",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.15)]",
    shadow: "shadow-[0_6px_0_rgba(6,182,212,0.3)]",
  },
  {
    base: "from-green-900/60 to-green-800/40 border-green-500/40 hover:border-green-400/80 hover:from-green-800/70 hover:to-green-700/50",
    label: "bg-green-500/30 text-green-300 border-green-500/50",
    glow: "shadow-[0_0_20px_rgba(34,197,94,0.15)]",
    shadow: "shadow-[0_6px_0_rgba(34,197,94,0.3)]",
  },
];


// Dynamic font size based on text length — scales with viewport
function getDynamicQuestionSize(text = "") {
  const len = text.length;
  if (len < 60)  return "clamp(1.25rem, 2.8vw, 2.25rem)";  // clean & balanced
  if (len < 100) return "clamp(1.15rem, 2.4vw, 1.85rem)";  // medium
  if (len < 160) return "clamp(1.05rem, 2.0vw, 1.5rem)";   // long
  if (len < 220) return "clamp(0.95rem, 1.6vw, 1.35rem)";  // longer
  return         "clamp(0.875rem, 1.3vw, 1.2rem)";        // very long
}

function getDynamicOptionSize(text = "") {
  const len = text.length;
  if (len < 50)  return "clamp(1.1rem, 1.8vw, 2.2rem)";
  if (len < 100) return "clamp(1rem, 1.5vw, 1.9rem)";
  if (len < 180) return "clamp(0.9rem, 1.25vw, 1.6rem)";
  return         "clamp(0.85rem, 1.05vw, 1.3rem)";
}

function ParticleField() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: `hsla(${140 + Math.random() * 40}, 70%, 60%, 0.4)`,
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            opacity: [0, 0.6, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function CorrectParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-40">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-sm"
          style={{
            width: `${4 + Math.random() * 6}px`,
            height: `${8 + Math.random() * 12}px`,
            left: `${20 + Math.random() * 60}%`,
            top: `${20 + Math.random() * 40}%`,
            backgroundColor: ["#34d399", "#6ee7b7", "#fbbf24", "#a3e635", "#67e8f9"][i % 5],
            rotate: `${Math.random() * 360}deg`,
          }}
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{
            opacity: 0,
            y: -120 - Math.random() * 80,
            x: (Math.random() - 0.5) * 200,
            scale: 0,
            rotate: `${Math.random() * 720}deg`,
          }}
          transition={{ duration: 1.5, ease: "easeOut", delay: Math.random() * 0.3 }}
        />
      ))}
    </div>
  );
}

export default function TakingQuizClient({ quiz, user }) {
  const { t } = useLanguage();
  const router = useRouter();
  const questions = quiz.questions || [];

  const storageKey = `quiz_progress_${quiz.id}`;

  const [mounted, setMounted] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);

  const [answers, setAnswers] = useState(() => {
    return questions.map((q) => ({
      questionId: q.id,
      selectedOptionId:
        q.type === "multiple_choice" || q.type === "true_false" ? "" : null,
      selectedOptionIds: q.type === "multiple_choice_complex" ? [] : null,
      essayText: q.type === "short_answer" ? "" : null,
    }));
  });

  const [correctStreak, setCorrectStreak] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [showStreakBadge, setShowStreakBadge] = useState(false);

  const [timeLeft, setTimeLeft] = useState(
    quiz.timeLimitMinutes ? quiz.timeLimitMinutes * 60 : 0,
  );
  const [timerActive, setTimerActive] = useState(!!quiz.timeLimitMinutes);

  // Load progress and timestamp from localStorage once mounted on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(storageKey);
      let startTime = Date.now();

      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (typeof parsed.currentIdx === "number" && parsed.currentIdx < questions.length) {
            setCurrentIdx(parsed.currentIdx);
          }
          if (parsed.answers) {
            setAnswers(parsed.answers);
          }
          if (parsed.startTime) {
            startTime = parsed.startTime;
          } else {
            // Add startTime to old saved state if missing
            parsed.startTime = startTime;
            localStorage.setItem(storageKey, JSON.stringify(parsed));
          }
        } catch (e) {
          console.error("Failed to parse progress", e);
        }
      }

      if (quiz.timeLimitMinutes > 0) {
        const totalDurationSec = quiz.timeLimitMinutes * 60;
        const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
        const remaining = Math.max(0, totalDurationSec - elapsedSec);
        setTimeLeft(remaining);
      }
    }
    setMounted(true);
  }, [storageKey, questions.length, quiz.timeLimitMinutes]);

  // Save progress and startTime only after mount/initialization is complete
  useEffect(() => {
    if (mounted && typeof window !== "undefined" && questions.length > 0) {
      const saved = localStorage.getItem(storageKey);
      let startTime = Date.now();
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.startTime) startTime = parsed.startTime;
        } catch (_) {}
      }
      localStorage.setItem(storageKey, JSON.stringify({ currentIdx, answers, startTime }));
    }
  }, [currentIdx, answers, storageKey, questions.length, mounted]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const isSubmittingRef = useRef(false);

  const [feedback, setFeedback] = useState({
    status: "none",
    selectedId: null,
    correctId: null,
    points: 0,
  });

  const [showCorrectParticles, setShowCorrectParticles] = useState(false);
  const [shuffledOptionsMap, setShuffledOptionsMap] = useState({});

  useEffect(() => {
    const newShuffled = {};
    questions.forEach((q) => {
      if (q.options) {
        const opts = [...q.options];
        for (let i = opts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [opts[i], opts[j]] = [opts[j], opts[i]];
        }
        newShuffled[q.id] = opts;
      }
    });
    setShuffledOptionsMap(newShuffled);
  }, [questions]);

  const timerRef = useRef(null);

  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerActive, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && !isSubmittingRef.current && quiz.timeLimitMinutes > 0) {
      handleSubmitQuiz();
    }
  }, [timeLeft]);

  const handleSelectOption = (qId, optionId, rawType) => {
    if (feedback.status !== "none") return;
    const currentQ = questions.find((q) => q.id === qId);
    const qType = (rawType || currentQ?.type || "").toLowerCase();

    setAnswers((prev) =>
      prev.map((ans) => {
        if (ans.questionId !== qId) return ans;
        if (qType === "multiple_choice_complex" || qType === "complex") {
          const currentIds = ans.selectedOptionIds || [];
          if (currentIds.includes(optionId)) {
            return { ...ans, selectedOptionIds: currentIds.filter((id) => id !== optionId) };
          } else {
            return { ...ans, selectedOptionIds: [...currentIds, optionId] };
          }
        } else {
          return { ...ans, selectedOptionId: optionId };
        }
      }),
    );

    if (qType === "multiple_choice" || qType === "true_false" || qType === "mcq" || qType === "tf") {
      const isCorrect = String(optionId).trim() === String(currentQ.correctOptionId || "").trim();
      const questionPoints = typeof currentQ.points === "number" ? currentQ.points : (parseInt(currentQ.points) || 10);
      const pts = isCorrect ? questionPoints : 0;

      setFeedback({
        status: isCorrect ? "correct" : "incorrect",
        selectedId: optionId,
        correctId: currentQ.correctOptionId,
        points: pts,
      });

      if (isCorrect) {
        setTotalScore((s) => s + pts);
        setCorrectStreak((s) => {
          const next = s + 1;
          if (next > 0 && next % 3 === 0) setShowStreakBadge(true);
          return next;
        });
        setShowCorrectParticles(true);
        setTimeout(() => setShowCorrectParticles(false), 1600);
      } else {
        setCorrectStreak(0);
      }

      setTimeout(() => {
        setFeedback({ status: "none", selectedId: null, correctId: null, points: 0 });
        setShowStreakBadge(false);
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(currentIdx + 1);
        } else {
          handleSubmitQuiz();
        }
      }, 2200);
    }
  };

  const handleValidateManual = () => {
    if (feedback.status !== "none") return;
    const currentQ = questions[currentIdx];
    const ans = answers.find((a) => a.questionId === currentQ.id);
    const qType = (currentQ?.type || "").toLowerCase();

    if (qType === "essay" || qType === "long_essay") {
      // Long essay questions do not have auto-grading; they will be reviewed by mentor
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        handleSubmitQuiz();
      }
      return;
    }

    let isCorrect = true;
    let correctId = null;
    let pointsEarned = 0;
    const questionPoints = typeof currentQ.points === "number" ? currentQ.points : (parseInt(currentQ.points) || 10);

    if (qType === "multiple_choice_complex" || qType === "complex") {
      const correctArr = (currentQ.correctOptionId || "").split(",").map((s) => s.trim()).filter(Boolean);
      const selectedArr = ans?.selectedOptionIds || [];
      const maxPoints = questionPoints;
      if (correctArr.length > 0) {
        const pointsPerCorrect = maxPoints / correctArr.length;
        let earned = 0;
        selectedArr.forEach((id) => {
          if (correctArr.includes(id)) earned += pointsPerCorrect;
          else earned -= pointsPerCorrect;
        });
        pointsEarned = Math.max(0, Math.round(earned));
        isCorrect = pointsEarned > 0;
      }
      correctId = currentQ.correctOptionId;
    } else if (qType === "short_answer" || qType === "short_essay") {
      const userAns = (ans?.essayText || "").trim().toLowerCase();
      const correctKey = (currentQ.correctOptionId || "").trim().toLowerCase();
      if (correctKey) {
        isCorrect = userAns === correctKey;
        pointsEarned = isCorrect ? questionPoints : 0;
      } else {
        isCorrect = true;
        pointsEarned = questionPoints;
      }
    }

    if (isCorrect) {
      setTotalScore((s) => s + pointsEarned);
      setCorrectStreak((s) => s + 1);
      setShowCorrectParticles(true);
      setTimeout(() => setShowCorrectParticles(false), 1600);
    } else {
      setCorrectStreak(0);
    }

    setFeedback({ status: isCorrect ? "correct" : "incorrect", selectedId: "manual", correctId, points: pointsEarned });

    setTimeout(() => {
      setFeedback({ status: "none", selectedId: null, correctId: null, points: 0 });
      if (currentIdx < questions.length - 1) {
        setCurrentIdx(currentIdx + 1);
      } else {
        handleSubmitQuiz();
      }
    }, 2200);
  };

  const handleTextChange = (qId, text) => {
    setAnswers((prev) =>
      prev.map((ans) => (ans.questionId === qId ? { ...ans, essayText: text } : ans)),
    );
  };

  const handleSubmitQuiz = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    if (typeof window !== "undefined") localStorage.removeItem(storageKey);
    setTimerActive(false);
    setIsSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error || t("member_quiz.err_submit"));
        setTimerActive(true);
      }
    } catch (err) {
      setError(t("member_quiz.err_conn"));
      setTimerActive(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const timerPercent = quiz.timeLimitMinutes
    ? (timeLeft / (quiz.timeLimitMinutes * 60)) * 100
    : 100;
  const isTimerCritical = timeLeft < 60 && quiz.timeLimitMinutes > 0;
  const isTimerWarning = timeLeft < quiz.timeLimitMinutes * 30 && quiz.timeLimitMinutes > 0;

  // ─── HYDRATION/MOUNT GUARD ──────────────────────────────────────────────────
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-[100] bg-[#05120a] flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin" />
      </div>
    );
  }

  // ─── RESULT SCREEN ──────────────────────────────────────────────────────────
  if (result) {
    const isPassed = result.isPassed;
    const isPending = result.hasEssay && isPassed === null;
    return (
      <div className="fixed inset-0 bg-[#030d07] z-[100] flex flex-col items-center justify-center p-6 select-none overflow-hidden text-white">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-teal-500/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-green-500/5 rounded-full blur-[80px]" />
        </div>

        {/* Tech grid */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        <ParticleField />

        {/* Confetti for passed */}
        {isPassed && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-sm"
                style={{
                  width: `${4 + Math.random() * 8}px`,
                  height: `${10 + Math.random() * 15}px`,
                  left: `${Math.random() * 100}%`,
                  top: `-10%`,
                  backgroundColor: ["#34d399", "#fbbf24", "#6ee7b7", "#a3e635", "#67e8f9", "#f472b6"][i % 6],
                  rotate: `${Math.random() * 360}deg`,
                }}
                animate={{
                  y: ["0vh", "120vh"],
                  rotate: [`${Math.random() * 360}deg`, `${Math.random() * 720}deg`],
                  opacity: [1, 0.8, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 3,
                  delay: Math.random() * 2,
                  ease: "easeIn",
                  repeat: Infinity,
                  repeatDelay: Math.random() * 3,
                }}
              />
            ))}
          </div>
        )}

        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
          className="relative z-20 w-full max-w-lg"
        >
          {/* Main result card */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 md:p-10 text-center shadow-[0_40px_80px_rgba(0,0,0,0.5)] ring-1 ring-emerald-500/10">
            {/* Status Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.6 }}
              className="relative w-28 h-28 mx-auto mb-6"
            >
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
                  isPending ? "bg-amber-500" : isPassed ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <div
                className={`w-full h-full rounded-full flex items-center justify-center relative z-10 border-2 ${
                  isPending
                    ? "bg-gradient-to-br from-amber-500/20 to-amber-900/40 border-amber-500/60 shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                    : isPassed
                    ? "bg-gradient-to-br from-emerald-500/20 to-emerald-900/40 border-emerald-500/60 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
                    : "bg-gradient-to-br from-rose-500/20 to-rose-900/40 border-rose-500/60 shadow-[0_0_40px_rgba(244,63,94,0.3)]"
                }`}
              >
                {isPending ? (
                  <Trophy className="w-14 h-14 text-amber-400 animate-pulse" />
                ) : isPassed ? (
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                  >
                    <Trophy className="w-14 h-14 text-emerald-400" />
                  </motion.div>
                ) : (
                  <X className="w-14 h-14 text-rose-400" />
                )}
              </div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div
                className={`text-[10px] uppercase tracking-[0.4em] font-bold mb-2 ${
                  isPending ? "text-amber-400/70" : isPassed ? "text-emerald-400/70" : "text-rose-400/70"
                }`}
              >
                {isPending ? "Pending Review" : isPassed ? "Misi Selesai" : "Misi Gagal"}
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-3 tracking-tight">
                {isPending ? "MISSION COMPLETED!" : isPassed ? "MISSION PASSED!" : "MISSION FAILED"}
              </h1>
              <p className="text-white/50 mb-8 text-sm max-w-xs mx-auto leading-relaxed">
                {result.hasEssay
                  ? "Jawaban short answer kamu akan dinilai oleh mentor. Skor MCQ sudah dikalkulasi."
                  : isPassed
                  ? "Luar biasa! Kamu berhasil melewati syarat kelulusan dan klaim XP reward."
                  : "Jangan menyerah, pelajari kembali materinya dan coba lagi!"}
              </p>
            </motion.div>

            {/* Score cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="grid grid-cols-2 gap-3 mb-8"
            >
              {/* Score */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
                <div className="text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold mb-2 relative z-10">
                  Final Score
                </div>
                <div
                  className={`text-3xl sm:text-4xl md:text-5xl font-black relative z-10 ${
                    isPending ? "text-amber-400" : isPassed ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {result.submission?.totalScore ?? result.submission?.mcqScore ?? 0}
                  </motion.span>
                </div>
              </div>

              {/* XP Reward */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 md:p-5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />
                <div className="absolute top-2 right-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  >
                    <Star className="w-4 h-4 text-amber-400/50 fill-amber-400/30" />
                  </motion.div>
                </div>
                <div className="text-[9px] uppercase tracking-[0.3em] text-amber-500/60 font-bold mb-2 relative z-10">
                  XP Reward
                </div>
                <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 flex items-center gap-1 relative z-10">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 fill-amber-400 shrink-0" />
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    +{result.gainedXp || 0}
                  </motion.span>
                </div>
              </div>
            </motion.div>

            {/* Passing score indicator */}
            {quiz.passingScore && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mb-8"
              >
                <div className="flex items-center justify-between text-xs text-white/40 mb-2 font-medium">
                  <span>Nilai Kelulusan</span>
                  <span className={isPassed ? "text-emerald-400" : "text-rose-400"}>
                    {result.submission?.totalScore ?? result.submission?.mcqScore ?? 0} / {quiz.passingScore}
                  </span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${Math.min(100, ((result.submission?.totalScore ?? result.submission?.mcqScore ?? 0) / quiz.passingScore) * 100)}%`,
                    }}
                    transition={{ delay: 0.9, duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${isPassed ? "bg-gradient-to-r from-emerald-500 to-teal-400" : "bg-gradient-to-r from-rose-500 to-orange-400"}`}
                  />
                </div>
              </motion.div>
            )}

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3"
            >
              <button
                onClick={() => router.push("/member/quiz")}
                className="w-full py-4 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 font-bold uppercase tracking-widest transition-all text-sm flex items-center justify-center gap-2"
              >
                <ArrowRight className="w-4 h-4" /> Kembali ke Daftar Kuis
              </button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    );
  }

  // ─── QUIZ TAKING SCREEN ─────────────────────────────────────────────────────
  const currentQ = questions[currentIdx];
  if (!currentQ) return null;
  const currentAns = answers.find((a) => a.questionId === currentQ.id);
  const progressPercent = ((currentIdx + 1) / questions.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] bg-[#05120a] text-white flex flex-col font-sans select-none overflow-hidden" style={{ height: '100dvh' }}>
      {/* ── Ambient Background ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-600/6 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
            maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          }}
        />
        {/* Floating game symbols */}
        <motion.div animate={{ y: [0, -30, 0], opacity: [0.06, 0.15, 0.06] }} transition={{ duration: 9, repeat: Infinity }} className="absolute top-[20%] left-[10%] text-emerald-400 text-6xl font-black">+</motion.div>
        <motion.div animate={{ y: [0, 40, 0], rotate: [45, 90, 45] }} transition={{ duration: 14, repeat: Infinity }} className="absolute bottom-[30%] right-[10%] w-12 h-12 border-[3px] border-emerald-500/15 rounded-xl rotate-45" />
        <motion.div animate={{ y: [0, -25, 0], opacity: [0.04, 0.12, 0.04] }} transition={{ duration: 11, repeat: Infinity }} className="absolute top-[60%] right-[20%] text-teal-400/20 text-5xl font-black">×</motion.div>
      </div>

      {/* ── Correct Answer Particles ── */}
      {/* ── Custom Scrollbar CSS ── */}
      <style>{`
        .quiz-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
        .quiz-scroll::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 99px;
        }
        .quiz-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(52,211,153,0.7) 0%, rgba(20,184,166,0.4) 100%);
          border-radius: 99px;
          box-shadow: 0 0 6px rgba(52,211,153,0.5);
        }
        .quiz-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(52,211,153,1) 0%, rgba(20,184,166,0.7) 100%);
          box-shadow: 0 0 10px rgba(52,211,153,0.8);
        }
        .quiz-scroll { scrollbar-width: thin; scrollbar-color: rgba(52,211,153,0.5) transparent; }
      `}</style>

      {/* ── Correct Answer Particles ── */}
      <AnimatePresence>
        {showCorrectParticles && <CorrectParticles />}
      </AnimatePresence>

      {/* ── TOP BAR ── */}
      <div className="shrink-0 relative z-20 px-4 pt-4 pb-0">
        {/* Main top row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Quiz title pill */}
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/60 font-bold truncate">
              {quiz.title || "Quiz Mission"}
            </div>
          </div>

          {/* Timer */}
          {quiz.timeLimitMinutes > 0 && (
            <motion.div
              animate={isTimerCritical ? { scale: [1, 1.04, 1] } : {}}
              transition={{ duration: 0.5, repeat: Infinity }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-black text-xl tracking-widest transition-all ${
                isTimerCritical
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]"
                  : isTimerWarning
                  ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              }`}
            >
              <Clock className={`w-4 h-4 ${isTimerCritical ? "animate-pulse" : ""}`} />
              {formatTime(timeLeft)}
            </motion.div>
          )}

          {/* Close button */}
          <button
            onClick={() => router.push("/member/quiz")}
            className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-500/20 hover:border-rose-500/40 transition-all group"
          >
            <X className="w-4 h-4 text-white/50 group-hover:text-rose-400 transition-colors" />
          </button>
        </div>

        {/* Progress section */}
        <div className="flex items-center gap-3">
          {/* Streak badge */}
          <AnimatePresence>
            {correctStreak >= 2 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shrink-0 ${
                  correctStreak >= 5
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                    : "bg-orange-500/15 border-orange-500/30 text-orange-400"
                }`}
              >
                <Flame className="w-3 h-3" />
                {correctStreak}x
              </motion.div>
            )}
          </AnimatePresence>

          {/* XP bar-style progress */}
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
              <motion.div
                initial={false}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent rounded-full" />
              </motion.div>
            </div>
            <div className="text-xs font-black text-emerald-400/80 shrink-0 tabular-nums w-10 text-right">
              {currentIdx + 1}/{questions.length}
            </div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT (no page scroll, only internal text scroll) ── */}
      <div className="flex-1 min-h-0 flex flex-col relative z-10 px-4 md:px-6 gap-3 py-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="flex-1 min-h-0 flex flex-col gap-3"
          >
            {/* ── Question Card (flex-1, text scrolls inside) ── */}
            <div className="flex-1 min-h-0 w-full">
              {/* Meta badges row */}
              <div className="flex items-center gap-2 mb-2">
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  {(() => {
                    const qType = (currentQ.type || "").toLowerCase();
                    if (qType === "multiple_choice" || qType === "mcq") return "Pilihan Ganda";
                    if (qType === "true_false" || qType === "tf") return "Benar / Salah";
                    if (qType === "multiple_choice_complex" || qType === "complex") return "Multi Pilihan";
                    return "Jawaban Singkat";
                  })()}
                </div>
                {currentQ.points && (
                  <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-amber-400" />
                    {currentQ.points} pts
                  </div>
                )}
              </div>

              {/* Question card — fills all remaining height, text scrolls inside */}
              <div className="relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden" style={{ height: 'calc(100% - 32px)' }}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/3 pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
               {/* Scrollable text area inside card — custom styled scrollbar */}
                <div className="quiz-scroll h-full overflow-y-auto px-6 md:px-10">
                  <div className="min-h-full flex items-center justify-center py-5">
                    <h2
                      className="font-black leading-tight text-white/95 text-center w-full transition-all duration-300"
                      style={{ fontSize: getDynamicQuestionSize(currentQ.question) }}
                    >
                      {currentQ.question}
                    </h2>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Answer Options ── */}
            {/* Mobile: scrollable vertical 40vh | Desktop: overflow-hidden 30vh horizontal */}
            <div
              className="shrink-0 w-full relative quiz-scroll md:overflow-hidden overflow-y-auto md:h-[30vh] h-[40vh]"
            >
              {/* Points popup on correct */}
              <AnimatePresence>
                {feedback.status === "correct" && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0, y: 0 }}
                    animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 0], y: [0, -30, -80] }}
                    transition={{ duration: 1.3, times: [0, 0.25, 1] }}
                    className="absolute -top-4 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm border border-emerald-400/50 px-5 py-2.5 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    <span className="text-white font-black text-lg">+{feedback.points}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Streak popup */}
              <AnimatePresence>
                {showStreakBadge && correctStreak >= 3 && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-10 left-1/2 -translate-x-1/2 pointer-events-none z-50 flex items-center gap-2 bg-amber-500/90 px-4 py-1.5 rounded-full border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                  >
                    <Flame className="w-4 h-4 text-white fill-white" />
                    <span className="text-white font-black text-xs uppercase tracking-wider">{correctStreak}x Streak!</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MULTIPLE CHOICE / TRUE-FALSE */}
              {(() => {
                const qType = (currentQ.type || "").toLowerCase();
                const isMcqOrTf = qType === "multiple_choice" || qType === "true_false" || qType === "mcq" || qType === "tf";
                const isComplex = qType === "multiple_choice_complex" || qType === "complex";
                const isEssay = qType === "short_answer" || qType === "essay" || qType === "short_essay";

                if (isMcqOrTf) {
                  return (
                    <>
                      {/* ── DESKTOP: horizontal flex row ── */}
                      <div className="hidden md:flex flex-row gap-3 h-full">
                        {(shuffledOptionsMap[currentQ.id] || currentQ.options || []).map((opt, idx) => {
                          const theme = OPTION_THEMES[idx % OPTION_THEMES.length];

                          if (feedback.status !== "none") {
                            const isSelected = opt.id === feedback.selectedId;
                            const isCorrect = opt.id === feedback.correctId;
                            if (feedback.status === "correct" && !isCorrect) return null;
                            if (feedback.status === "incorrect" && !isSelected && !isCorrect) return null;
                            return (
                              <motion.div key={opt.id} initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                className={`flex-1 relative rounded-2xl overflow-hidden flex flex-col border-2 ${
                                  isCorrect ? "bg-emerald-500/20 border-emerald-400/70 shadow-[0_0_30px_rgba(16,185,129,0.25)]" : "bg-rose-500/15 border-rose-400/50"
                                }`}
                              >
                                <div className={`shrink-0 w-10 h-10 m-3 mb-0 rounded-xl border-2 flex items-center justify-center font-black text-sm ${
                                  isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-rose-500 border-rose-400 text-white"
                                }`}>
                                  {isCorrect ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-5 h-5" strokeWidth={3} />}
                                </div>
                                <div className="quiz-scroll flex-1 overflow-y-auto px-4">
                                  <div className="min-h-full flex items-center py-3">
                                    <span className="font-bold text-white leading-snug block" style={{ fontSize: getDynamicOptionSize(opt.text) }}>{opt.text}</span>
                                  </div>
                                </div>
                                {!isCorrect && <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />}
                              </motion.div>
                            );
                          }

                          const isSelected = currentAns?.selectedOptionId === opt.id;
                          return (
                            <motion.button key={opt.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.type)}
                              className={`flex-1 relative rounded-2xl overflow-hidden flex flex-col border-2 text-left transition-all ${
                                isSelected
                                  ? "bg-emerald-500/25 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.25)]"
                                  : `bg-gradient-to-br ${theme.base} ${theme.shadow}`
                              }`}
                            >
                              <div className={`shrink-0 w-10 h-10 m-3 mb-0 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${
                                isSelected ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]" : theme.label
                              }`}>
                                {OPTION_LABELS[idx]}
                              </div>
                              <div className="flex-1 overflow-y-auto px-4 quiz-scroll">
                                <div className="min-h-full flex items-center py-3">
                                  <span className={`font-bold leading-snug block ${isSelected ? "text-white" : "text-white/90"}`} style={{ fontSize: getDynamicOptionSize(opt.text) }}>
                                    {opt.text}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>}
                              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* ── MOBILE: vertical scrollable stack, equal height cards ── */}
                      <div className="md:hidden flex flex-col gap-2.5 h-full">
                        {(shuffledOptionsMap[currentQ.id] || currentQ.options || []).map((opt, idx) => {
                          const theme = OPTION_THEMES[idx % OPTION_THEMES.length];

                          if (feedback.status !== "none") {
                            const isSelected = opt.id === feedback.selectedId;
                            const isCorrect = opt.id === feedback.correctId;
                            if (feedback.status === "correct" && !isCorrect) return null;
                            if (feedback.status === "incorrect" && !isSelected && !isCorrect) return null;
                            return (
                              <motion.div key={opt.id} initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                                className={`shrink-0 relative rounded-2xl overflow-hidden flex flex-row items-center gap-3 border-2 ${
                                  isCorrect ? "bg-emerald-500/20 border-emerald-400/70" : "bg-rose-500/15 border-rose-400/50"
                                }`}
                              style={{ height: '120px' }}
                              >
                                <div className={`shrink-0 w-10 h-10 ml-3 rounded-xl border-2 flex items-center justify-center font-black text-sm ${
                                  isCorrect ? "bg-emerald-500 border-emerald-400 text-white" : "bg-rose-500 border-rose-400 text-white"
                                }`}>
                                  {isCorrect ? <Check className="w-5 h-5" strokeWidth={3} /> : <X className="w-5 h-5" strokeWidth={3} />}
                                </div>
                                <div className="quiz-scroll flex-1 overflow-y-auto h-full pr-4">
                                  <div className="min-h-full flex items-center py-2">
                                    <span className="font-bold text-white text-base leading-snug block">{opt.text}</span>
                                  </div>
                                </div>
                                {!isCorrect && <div className="absolute inset-0 bg-black/35 backdrop-blur-[1px]" />}
                              </motion.div>
                            );
                          }

                          const isSelected = currentAns?.selectedOptionId === opt.id;
                          return (
                            <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelectOption(currentQ.id, opt.id, currentQ.type)}
                              className={`shrink-0 relative w-full rounded-2xl overflow-hidden flex flex-row items-center gap-3 border-2 text-left transition-all ${
                                isSelected
                                  ? "bg-emerald-500/25 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
                                  : `bg-gradient-to-r ${theme.base}`
                              }`}
                              style={{ height: '120px' }}
                            >
                              <div className={`shrink-0 w-10 h-10 ml-3 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${
                                isSelected ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]" : theme.label
                              }`}>
                                {OPTION_LABELS[idx]}
                              </div>
                              <div className="quiz-scroll flex-1 overflow-y-auto h-full pr-3">
                                <div className="min-h-full flex items-center py-2">
                                  <span className={`font-bold text-base leading-snug block ${isSelected ? "text-white" : "text-white/90"}`}>
                                    {opt.text}
                                  </span>
                                </div>
                              </div>
                              {isSelected && <div className="absolute top-2 right-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>}
                              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                            </motion.button>
                          );
                        })}
                      </div>
                    </>
                  );
                }

                if (isComplex) {
                  return (
                    <div className="flex flex-col h-full gap-2">
                      <div className="shrink-0 flex items-center gap-2">
                        <div className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-widest">
                          Pilih semua jawaban yang benar
                        </div>
                      </div>

                      {/* Desktop: horizontal */}
                      <div className="hidden md:flex flex-1 min-h-0 flex-row gap-3">
                        {(shuffledOptionsMap[currentQ.id] || currentQ.options || []).map((opt, idx) => {
                          const isSelected = (currentAns?.selectedOptionIds || []).includes(opt.id);
                          const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                          return (
                            <motion.button key={opt.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelectOption(currentQ.id, opt.id, "multiple_choice_complex")}
                              className={`flex-1 relative rounded-2xl overflow-hidden flex flex-col border-2 text-left transition-all ${
                                isSelected ? "bg-emerald-500/25 border-emerald-400/80 shadow-[0_0_25px_rgba(16,185,129,0.2)]" : `bg-gradient-to-br ${theme.base}`
                              }`}
                            >
                              <div className={`shrink-0 w-10 h-10 m-3 mb-0 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${
                                isSelected ? "bg-emerald-500 border-emerald-400 text-white" : theme.label
                              }`}>
                                {isSelected ? <Check className="w-5 h-5" strokeWidth={3} /> : OPTION_LABELS[idx]}
                              </div>
                              <div className="flex-1 overflow-y-auto px-4 quiz-scroll">
                                <div className="min-h-full flex items-center py-3">
                                  <span className={`font-bold leading-snug block ${isSelected ? "text-white" : "text-white/90"}`} style={{ fontSize: getDynamicOptionSize(opt.text) }}>
                                    {opt.text}
                                  </span>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>

                      {/* Mobile: vertical scrollable stack */}
                      <div className="md:hidden flex flex-col gap-2.5 overflow-y-auto quiz-scroll flex-1">
                        {(shuffledOptionsMap[currentQ.id] || currentQ.options || []).map((opt, idx) => {
                          const isSelected = (currentAns?.selectedOptionIds || []).includes(opt.id);
                          const theme = OPTION_THEMES[idx % OPTION_THEMES.length];
                          return (
                            <motion.button key={opt.id} whileTap={{ scale: 0.97 }}
                              onClick={() => handleSelectOption(currentQ.id, opt.id, "multiple_choice_complex")}
                              className={`shrink-0 relative w-full rounded-2xl overflow-hidden flex flex-row items-center gap-3 border-2 text-left transition-all ${
                                isSelected ? "bg-emerald-500/25 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : `bg-gradient-to-r ${theme.base}`
                              }`}
                              style={{ height: '120px' }}
                            >
                              <div className={`shrink-0 w-10 h-10 ml-3 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${
                                isSelected ? "bg-emerald-500 border-emerald-400 text-white" : theme.label
                              }`}>
                                {isSelected ? <Check className="w-5 h-5" strokeWidth={3} /> : OPTION_LABELS[idx]}
                              </div>
                              <div className="quiz-scroll flex-1 overflow-y-auto h-full pr-3">
                                <div className="min-h-full flex items-center py-2">
                                  <span className={`font-bold text-base leading-snug block ${isSelected ? "text-white" : "text-white/90"}`}>
                                    {opt.text}
                                  </span>
                                </div>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Default / Fallback (Short Answer or Essay)
                return (
                  <div className="h-full flex flex-col justify-center items-center px-4">
                    <div className="w-full max-w-xl">
                      <input
                        type="text"
                        value={currentAns?.essayText || ""}
                        onChange={(e) => handleTextChange(currentQ.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleValidateManual();
                          }
                        }}
                        disabled={feedback.status !== "none"}
                        className="w-full bg-white/5 border-2 border-white/10 focus:border-emerald-500/50 rounded-2xl px-6 py-4 text-center text-lg md:text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:bg-white/8 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                        placeholder="Ketik jawaban Anda di sini..."
                      />
                      <div className="text-[10px] text-center text-emerald-400/40 uppercase tracking-widest font-black mt-3">
                        Tekan Enter untuk melanjutkan
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <div className="shrink-0 bg-rose-500/15 text-rose-300 px-4 py-2.5 rounded-xl border border-rose-500/25 font-bold text-sm">
            {error}
          </div>
        )}
      </div>

      {/* ── FEEDBACK BAR (absolute within container) ── */}
      <AnimatePresence>
        {feedback.status !== "none" && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className={`absolute bottom-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl ${
              feedback.status === "correct"
                ? "bg-emerald-600/95 border-t border-emerald-400/30"
                : "bg-rose-700/95 border-t border-rose-400/30"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${feedback.status === "correct" ? "bg-white/20 border-white/30" : "bg-white/10 border-white/20"}`}>
                {feedback.status === "correct" ? (
                  <Check className="w-6 h-6 text-white" strokeWidth={3} />
                ) : (
                  <X className="w-6 h-6 text-white" strokeWidth={3} />
                )}
              </div>
              <div>
                <div className="font-black text-white text-lg">
                  {feedback.status === "correct" ? "Benar!" : "Salah!"}
                </div>
                <div className="text-white/70 text-xs">
                  {feedback.status === "correct" ? `+${feedback.points} poin` : "Coba soal berikutnya"}
                </div>
              </div>
            </div>
            {feedback.status === "correct" && correctStreak >= 2 && (
              <div className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 border border-white/20">
                <Flame className="w-4 h-4 text-orange-300 fill-orange-400" />
                <span className="text-white font-black text-sm">{correctStreak}x</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BOTTOM BAR (shrink-0, part of flex column, no overlap) ── */}
      <div
        className={`shrink-0 relative z-30 px-4 pb-3 pt-1 flex items-center justify-end transition-opacity duration-300 ${
          feedback.status !== "none" ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        {/* Action button for complex/essay */}
        {(() => {
          const qType = (currentQ.type || "").toLowerCase();
          const isComplexOrEssay = qType === "multiple_choice_complex" || qType === "complex" || qType === "short_answer" || qType === "essay" || qType === "short_essay";
          if (!isComplexOrEssay) return null;
          return (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleValidateManual}
              disabled={isSubmitting}
              className="px-6 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black flex items-center gap-2 transition-all shadow-[0_4px_0_rgba(5,100,60,0.8)] hover:shadow-[0_2px_0_rgba(5,100,60,0.8)] active:shadow-none active:translate-y-1 border border-emerald-400/50 text-sm uppercase tracking-wider"
            >
              {isSubmitting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {currentIdx < questions.length - 1 ? "Cek Jawaban & Lanjut" : "Kirim Kuis"}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          );
        })()}
      </div>
    </div>
  );
}
