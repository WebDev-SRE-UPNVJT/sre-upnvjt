"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Volume2, VolumeX, Maximize2, Minimize2,
  Sun, Moon, RotateCcw, ArrowLeft, Keyboard as KeyboardIcon,
  Trophy, Award, Zap, Delete, Sparkles, Flame, Lightbulb,
  Star, Target, Timer, Crown, ShieldAlert, Sparkle, CheckCircle2
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { generateCrosswordLayout } from "@/lib/crosswordGenerator";

// ==========================================
// PURE WEB AUDIO SYNTHESIZER (PITCH SHIFT & SFX)
// ==========================================
const playSound = (type, isMuted = false, noteIndex = 0) => {
  if (isMuted || typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "type") {
      // Musical pentatonic scale stepping as you type
      const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const baseFreq = scale[noteIndex % scale.length] || 620;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.25, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "correct") {
      // Grand celebratory ascending arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.05;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.55);
      });
    } else if (type === "hint") {
      // Magic shimmer harp
      const harp = [880, 1174.66, 1396.91, 1760];
      harp.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.04;
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.45);
      });
    } else if (type === "wrong") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(190, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "win") {
      const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98, 2093.0];
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq;
        const startTime = ctx.currentTime + idx * 0.07;
        gain.gain.setValueAtTime(0.24, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.95);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.0);
      });
    }
  } catch (e) {}
};

// Particle Explosion Component
function ParticleExplosion({ count = 28 }) {
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 450 - 50,
      scale: Math.random() * 1.4 + 0.6,
      rotate: Math.random() * 720 - 360,
      color: ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#38bdf8", "#ec4899", "#a855f7"][
        Math.floor(Math.random() * 7)
      ],
      shape: Math.random() > 0.4 ? "circle" : "star"
    }));
  }, [count]);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: [0, p.scale, 0.2],
            x: p.x,
            y: p.y,
            rotate: p.rotate
          }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          style={{ backgroundColor: p.shape === "circle" ? p.color : "transparent" }}
          className={p.shape === "circle" ? "w-3 h-3 rounded-full shadow-lg" : "text-lg"}
        >
          {p.shape === "star" && <span style={{ color: p.color }}>✦</span>}
        </motion.div>
      ))}
    </div>
  );
}

export default function TTSParticipantPlayer({ puzzleData, onBackUrl = "/games/tts", currentUser, taskId }) {
  const { theme: globalTheme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hiddenInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeThemeKey = mounted ? (globalTheme === "system" ? resolvedTheme : globalTheme) : "dark";
  const isDark = activeThemeKey === "dark";

  // Audio State
  const [isMuted, setIsMuted] = useState(false);

  // ==========================================
  // GAMEPLAY STATE & NOTIFICATION
  // ==========================================
  const [mistakeCount, setMistakeCount] = useState(0);
  const [floatingXP, setFloatingXP] = useState(null);
  const [showCelebrationParticles, setShowCelebrationParticles] = useState(false);
  const [hoveredCell, setHoveredCell] = useState(null);

  // Server Submission State
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Extract puzzle configuration
  const title = puzzleData?.title || "Teka-Teki Silang";
  const timeLimitMinutes = puzzleData?.timeLimitMinutes ? parseInt(puzzleData.timeLimitMinutes) : null;
  const wrongAnswerBehavior = puzzleData?.wrongAnswerBehavior || "RETRY";

  // Questions to items
  const items = useMemo(() => {
    if (puzzleData?.questions && puzzleData.questions.length > 0) {
      return puzzleData.questions.map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        clue: q.clue,
        answer: q.answer,
      }));
    }
    return [];
  }, [puzzleData]);

  // Generate crossword layout
  const crosswordData = useMemo(() => {
    return generateCrosswordLayout(items, { maxIterations: 80, seed: 42 });
  }, [items]);

  // User Answers State: { "row,col": "A" }
  const [userInputs, setUserInputs] = useState({});
  const [wordStatuses, setWordStatuses] = useState({}); // { "ACROSS-1": "CORRECT" | "WRONG" | "REVEALED" }

  // Game UI Mode: "PICK_WORD" vs "ANSWERING"
  const [activeWord, setActiveWord] = useState(null);
  const [typedLetters, setTypedLetters] = useState([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  const [answerState, setAnswerState] = useState("typing"); // "typing" | "correct" | "wrong"
  const [shakeWord, setShakeWord] = useState(false);

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Completion
  const [showWinModal, setShowWinModal] = useState(false);

  const allClueWords = useMemo(() => {
    return [...crosswordData.clues.across, ...crosswordData.clues.down];
  }, [crosswordData]);

  const totalWords = allClueWords.length;

  const correctWordsCount = useMemo(() => {
    return Object.values(wordStatuses).filter((st) => st === "CORRECT").length;
  }, [wordStatuses]);

  // Player Rank Calculation based on user profile
  const playerRank = useMemo(() => {
    const userLvl = currentUser?.memberProfile?.level || 1;
    if (userLvl >= 5) return { title: "Grandmaster", level: userLvl, icon: Crown, color: "text-amber-400" };
    if (userLvl >= 3) return { title: "Prodigy", level: userLvl, icon: Zap, color: "text-teal-400" };
    return { title: "Explorer", level: userLvl, icon: Sparkles, color: "text-emerald-400" };
  }, [currentUser]);

  // Star Rating on completion
  const starsEarned = useMemo(() => {
    const effectiveCorrect = submissionResult?.correctCount !== undefined ? submissionResult.correctCount : correctWordsCount;
    const effectiveMistakes = submissionResult?.wrongCount !== undefined ? submissionResult.wrongCount : mistakeCount;
    const isPerfect = effectiveCorrect === totalWords && effectiveMistakes === 0;

    if (isPerfect && elapsedTime <= 180) return 3;
    if (effectiveCorrect >= Math.ceil(totalWords * 0.5) && effectiveMistakes <= 2) return 2;
    return 1;
  }, [submissionResult, correctWordsCount, mistakeCount, totalWords, elapsedTime]);

  // Hovered word cells set for active word lighting
  const hoveredWordCells = useMemo(() => {
    if (!hoveredCell) return new Set();
    const cells = new Set();
    const match = crosswordData.placedWords.find(
      (w) =>
        (w.direction === "ACROSS" && w.row === hoveredCell.row && hoveredCell.col >= w.col && hoveredCell.col < w.col + w.length) ||
        (w.direction === "DOWN" && w.col === hoveredCell.col && hoveredCell.row >= w.row && hoveredCell.row < w.row + w.length)
    );
    if (match) {
      for (let i = 0; i < match.length; i++) {
        const r = match.direction === "ACROSS" ? match.row : match.row + i;
        const c = match.direction === "ACROSS" ? match.col + i : match.col;
        cells.add(`${r},${c}`);
      }
    }
    return cells;
  }, [hoveredCell, crosswordData]);

  // Fullscreen support
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Lock body scroll when activeWord or showWinModal is open
  useEffect(() => {
    if (activeWord || showWinModal) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [activeWord, showWinModal]);

  // Timer interval
  useEffect(() => {
    if (!isTimerRunning || showWinModal) return;

    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);

      if (timeLimitMinutes) {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            setShowWinModal(true);
            playSound("win", isMuted);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, showWinModal, timeLimitMinutes, isMuted]);

  const formatSeconds = (sec) => {
    if (sec == null) return "0:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Open answering focus mode when a word or box is clicked
  const handleSelectWord = (word) => {
    if (!word) return;
    playSound("type", isMuted, 0);
    setActiveWord(word);
    setAnswerState("typing");

    const isAcross = word.direction === "ACROSS";
    const currentLetters = [];
    for (let i = 0; i < word.length; i++) {
      const r = isAcross ? word.row : word.row + i;
      const c = isAcross ? word.col + i : word.col;
      currentLetters.push(userInputs[`${r},${c}`] || "");
    }
    setTypedLetters(currentLetters);

    // Focus first empty slot
    const firstEmpty = currentLetters.findIndex((l) => !l);
    setActiveSlotIdx(firstEmpty !== -1 ? firstEmpty : 0);

    setTimeout(() => {
      hiddenInputRef.current?.focus();
    }, 120);
  };

  // Click on a cell on the board
  const handleCellClick = (cell, row, col) => {
    if (!cell || !cell.char) return;

    // Find word for this cell
    let chosen = null;
    if (cell.acrossWordId) {
      chosen = crosswordData.placedWords.find((w) => w.id === cell.acrossWordId && w.direction === "ACROSS");
    }
    if (!chosen && cell.downWordId) {
      chosen = crosswordData.placedWords.find((w) => w.id === cell.downWordId && w.direction === "DOWN");
    }
    if (!chosen) {
      chosen = crosswordData.placedWords.find(
        (w) =>
          (w.direction === "ACROSS" && w.row === row && col >= w.col && col < w.col + w.length) ||
          (w.direction === "DOWN" && w.col === col && row >= w.row && row < w.row + w.length)
      );
    }

    if (chosen) {
      handleSelectWord(chosen);
    }
  };

  // Submit answers to server to score and record in taskSubmission & user profile
  const handleSubmitAnswers = useCallback(
    async (finalStatuses = wordStatuses, finalInputs = userInputs, currentMistakes = mistakeCount) => {
      if (hasSubmitted || isSubmitting) return;
      setIsSubmitting(true);

      try {
        const answersMap = {};
        const questionsList = puzzleData?.questions || [];

        questionsList.forEach((q) => {
          const cleanAns = String(q.answer || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
          const match = crosswordData.placedWords.find((pw) => {
            const pwAns = String(pw.answer || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
            return pwAns === cleanAns || pw.clue === q.clue;
          });

          if (match) {
            const wordKey = `${match.direction}-${match.number}`;
            // If participant solved it correctly themselves:
            if (finalStatuses[wordKey] === "CORRECT") {
              answersMap[q.id] = cleanAns;
            } else {
              // If it was auto-revealed due to wrong answer, do not submit correct answer!
              answersMap[q.id] = "REVEALED_AFTER_WRONG";
            }
          } else {
            answersMap[q.id] = "";
          }
        });

        const res = await fetch(`/api/games/tts/${puzzleData.id}/submit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userAnswers: answersMap,
            wordStatuses: finalStatuses,
            mistakeCount: currentMistakes,
            elapsedTime,
            taskId: taskId || null,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setSubmissionResult(data);
          setHasSubmitted(true);
        }
      } catch (err) {
        console.error("Error submitting TTS answers:", err);
      } finally {
        setIsSubmitting(false);
      }
    },
    [hasSubmitted, isSubmitting, puzzleData, crosswordData, wordStatuses, userInputs, mistakeCount, elapsedTime, taskId]
  );

  // Direct letter typing & auto validation
  const triggerValidation = useCallback((letters) => {
    if (!activeWord) return;
    const enteredAnswer = letters.join("").toUpperCase();
    const correctAnswer = activeWord.answer.toUpperCase();
    const isCorrect = enteredAnswer === correctAnswer;
    const wordKey = `${activeWord.direction}-${activeWord.number}`;

    if (isCorrect) {
      setAnswerState("correct");
      playSound("correct", isMuted);

      // Trigger Confetti & Success Notification (Clean feedback without fake XP/Streak)
      setShowCelebrationParticles(true);
      setTimeout(() => setShowCelebrationParticles(false), 1200);

      setFloatingXP({
        text: "Jawaban Benar!",
        sub: `Soal #${activeWord.number} Terpecahkan`,
        key: Date.now(),
        type: "correct"
      });
      setTimeout(() => setFloatingXP(null), 1400);

      // Update board cells
      const isAcross = activeWord.direction === "ACROSS";
      const newInputs = { ...userInputs };
      for (let i = 0; i < activeWord.length; i++) {
        const r = isAcross ? activeWord.row : activeWord.row + i;
        const c = isAcross ? activeWord.col + i : activeWord.col;
        newInputs[`${r},${c}`] = activeWord.answer[i];
      }
      setUserInputs(newInputs);

      const nextStatuses = { ...wordStatuses, [wordKey]: "CORRECT" };
      setWordStatuses(nextStatuses);

      const totalCompleted = Object.values(nextStatuses).filter(
        (st) => st === "CORRECT" || st === "REVEALED"
      ).length;

      // Smooth transition back to overview board
      setTimeout(() => {
        setActiveWord(null);
        setAnswerState("typing");
        if (totalCompleted >= totalWords) {
          setShowWinModal(true);
          setIsTimerRunning(false);
          playSound("win", isMuted);
          handleSubmitAnswers(nextStatuses, newInputs, mistakeCount);
        }
      }, 850);
    } else {
      setAnswerState("wrong");
      playSound("wrong", isMuted);
      setShakeWord(true);
      const nextMistakes = mistakeCount + 1;
      setMistakeCount(nextMistakes);
      setTimeout(() => setShakeWord(false), 450);

      setFloatingXP({
        text: "Jawaban Kurang Tepat",
        sub: wrongAnswerBehavior === "RETRY" ? "Coba periksa kembali hurufnya" : "Lanjut ke soal berikutnya",
        key: Date.now(),
        type: "wrong"
      });
      setTimeout(() => setFloatingXP(null), 1200);

      if (wrongAnswerBehavior === "REVEAL") {
        const isAcross = activeWord.direction === "ACROSS";
        const newInputs = { ...userInputs };
        for (let i = 0; i < activeWord.length; i++) {
          const r = isAcross ? activeWord.row : activeWord.row + i;
          const c = isAcross ? activeWord.col + i : activeWord.col;
          newInputs[`${r},${c}`] = activeWord.answer[i];
        }
        setUserInputs(newInputs);
        const nextStatuses = { ...wordStatuses, [wordKey]: "REVEALED" };
        setWordStatuses(nextStatuses);

        const totalCompleted = Object.values(nextStatuses).filter(
          (st) => st === "CORRECT" || st === "REVEALED"
        ).length;

        setTimeout(() => {
          setActiveWord(null);
          setAnswerState("typing");
          if (totalCompleted >= totalWords) {
            setShowWinModal(true);
            setIsTimerRunning(false);
            playSound("win", isMuted);
            handleSubmitAnswers(nextStatuses, newInputs, nextMistakes);
          }
        }, 1200);
      } else {
        // Retry behavior: clear letters so participant can retry immediately
        setTimeout(() => {
          setTypedLetters(new Array(activeWord.length).fill(""));
          setActiveSlotIdx(0);
          setAnswerState("typing");
        }, 650);
      }
    }
  }, [activeWord, userInputs, wordStatuses, totalWords, wrongAnswerBehavior, isMuted, mistakeCount, handleSubmitAnswers]);

  const handleInputLetter = useCallback((char) => {
    if (!activeWord || answerState !== "typing") return;
    const upper = char.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!upper) return;

    playSound("type", isMuted, activeSlotIdx);

    const nextLetters = [...typedLetters];
    nextLetters[activeSlotIdx] = upper;
    setTypedLetters(nextLetters);

    const nextSlot = activeSlotIdx + 1;
    if (nextSlot < activeWord.length) {
      setActiveSlotIdx(nextSlot);
    }

    // AUTO VALIDATE WHEN FULL
    const isFull = nextLetters.length === activeWord.length && nextLetters.every((l) => Boolean(l));
    if (isFull) {
      triggerValidation(nextLetters);
    }
  }, [activeWord, activeSlotIdx, typedLetters, answerState, isMuted, triggerValidation]);

  // Backspace handler
  const handleBackspace = useCallback(() => {
    if (!activeWord || answerState !== "typing") return;

    const nextLetters = [...typedLetters];
    if (nextLetters[activeSlotIdx]) {
      nextLetters[activeSlotIdx] = "";
    } else if (activeSlotIdx > 0) {
      nextLetters[activeSlotIdx - 1] = "";
      setActiveSlotIdx((curr) => curr - 1);
    }
    setTypedLetters(nextLetters);
    playSound("type", isMuted, Math.max(0, activeSlotIdx - 1));
  }, [activeWord, activeSlotIdx, typedLetters, answerState, isMuted]);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showWinModal) return;

      if (e.key === "Escape") {
        if (activeWord) {
          setActiveWord(null);
          setAnswerState("typing");
        }
        return;
      }

      if (activeWord) {
        if (e.key === "Backspace") {
          e.preventDefault();
          handleBackspace();
          return;
        }
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          setActiveSlotIdx((prev) => Math.max(0, prev - 1));
          return;
        }
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setActiveSlotIdx((prev) => Math.min(activeWord.length - 1, prev + 1));
          return;
        }
        if (/^[a-zA-Z0-9]$/.test(e.key)) {
          e.preventDefault();
          handleInputLetter(e.key);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeWord, showWinModal, handleInputLetter, handleBackspace]);

  // Reset puzzle
  const handleResetPuzzle = () => {
    setUserInputs({});
    setWordStatuses({});
    setActiveWord(null);
    setTypedLetters([]);
    setAnswerState("typing");
    setShowWinModal(false);
    setMistakeCount(0);
    setHintsRemaining(3);
    setElapsedTime(0);
    if (timeLimitMinutes) {
      setTimeRemaining(timeLimitMinutes * 60);
    }
    setIsTimerRunning(true);
  };

  // Background Theme Styles matching SRE aesthetic
  const bgGradient = isDark
    ? "bg-gradient-to-b from-[#06140f] via-[#040e0b] to-[#020705] text-white"
    : "bg-gradient-to-b from-[#f2f8f5] via-[#eaf4ef] to-[#dfede7] text-slate-900";

  return (
    <div className={`fixed inset-0 w-screen h-screen overflow-hidden select-none font-sans flex flex-col justify-between transition-colors duration-700 ${bgGradient}`}>
      {/* ========================================================================= */}
      {/* CELEBRATION PARTICLE EXPLOSION */}
      {/* ========================================================================= */}
      {showCelebrationParticles && <ParticleExplosion count={36} />}

      {/* ========================================================================= */}
      {/* GLOWING CELESTIAL ORBS & SPACE AMBIENCE (MATCHING REFERENCE AESTHETICS) */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Glowing Planet 1 - Top Right (Warm Solar Orb) */}
        <div
          className={`absolute -top-12 -right-12 w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-[1px] opacity-75 transition-all duration-1000 ${
            isDark
              ? "bg-gradient-to-br from-amber-400 via-rose-500 to-purple-800 shadow-[0_0_80px_rgba(251,146,60,0.45)]"
              : "bg-gradient-to-br from-amber-200 via-emerald-300 to-teal-400 shadow-[0_0_60px_rgba(52,211,153,0.3)] opacity-40"
          }`}
        />

        {/* Glowing Planet 2 - Bottom Right (Cosmic Emerald Planet) */}
        <div
          className={`absolute bottom-8 right-16 sm:right-24 w-52 h-52 sm:w-72 sm:h-72 rounded-full blur-[1px] opacity-65 transition-all duration-1000 ${
            isDark
              ? "bg-gradient-to-tr from-emerald-900 via-teal-600 to-cyan-400 shadow-[0_0_90px_rgba(20,184,166,0.4)]"
              : "bg-gradient-to-tr from-teal-200 via-emerald-200 to-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.25)] opacity-35"
          }`}
        />

        {/* Glowing Planet 3 - Mid Left (Violet Sphere) */}
        <div
          className={`absolute top-1/3 -left-16 w-44 h-44 sm:w-60 sm:h-60 rounded-full blur-[1px] opacity-55 transition-all duration-1000 ${
            isDark
              ? "bg-gradient-to-br from-indigo-900 via-purple-700 to-pink-500 shadow-[0_0_70px_rgba(168,85,247,0.35)]"
              : "bg-gradient-to-br from-indigo-200 via-purple-200 to-emerald-200 shadow-[0_0_40px_rgba(147,51,234,0.15)] opacity-30"
          }`}
        />

        {/* Twinkling Star Clusters */}
        <div className="absolute top-[18%] left-[22%] w-1.5 h-1.5 rounded-full bg-white animate-ping opacity-70" />
        <div className="absolute top-[65%] left-[14%] w-2 h-2 rounded-full bg-emerald-300 animate-pulse opacity-80" />
        <div className="absolute top-[28%] right-[32%] w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse opacity-75" />
        <div className="absolute bottom-[22%] left-[45%] w-2 h-2 rounded-full bg-amber-200 animate-ping opacity-60" />
        <div className="absolute top-[12%] right-[15%] text-amber-300 text-xs animate-spin opacity-70">✦</div>
        <div className="absolute bottom-[35%] right-[12%] text-cyan-200 text-sm animate-pulse opacity-80">✦</div>
        <div className="absolute top-[48%] left-[8%] text-emerald-300 text-base animate-pulse opacity-70">★</div>
      </div>

      {/* FLOATING GAMIFICATION XP & NOTIFICATION BANNER */}
      <AnimatePresence>
        {floatingXP && (
          <motion.div
            key={floatingXP.key}
            initial={{ opacity: 0, y: -25, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.15 }}
            exit={{ opacity: 0, y: -35, scale: 0.9 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 shadow-2xl pointer-events-none ${
              floatingXP.type === "wrong"
                ? "bg-rose-600 text-white border-rose-300 shadow-rose-900/60"
                : floatingXP.type === "hint"
                ? "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 border-white shadow-amber-500/80"
                : "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 text-slate-950 border-white shadow-[0_0_40px_rgba(52,211,153,0.95)]"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-base sm:text-lg">
              {floatingXP.type === "correct" && <Sparkles className="w-5 h-5 fill-current animate-spin" />}
              {floatingXP.type === "hint" && <Lightbulb className="w-5 h-5 fill-current animate-bounce" />}
              <span>{floatingXP.text}</span>
            </div>
            {floatingXP.sub && (
              <span className="text-[11px] font-black uppercase tracking-wider opacity-90">
                {floatingXP.sub}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. TOP BAR HUD (TIMER, LEVEL/RANK, STREAK, XP, SINGLE THEME TOGGLE) */}
      {/* ========================================================================= */}
      <header className="relative z-20 w-full px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between backdrop-blur-md border-b border-white/5 shrink-0">
        {/* LEFT: TIMER & LEVEL RANK BADGE */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* DIGITAL TIMER */}
          <div className="flex items-center gap-1.5 sm:gap-2 font-mono font-black text-sm sm:text-lg tracking-tight">
            <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]" />
            <span className="drop-shadow-md">
              {timeLimitMinutes ? formatSeconds(timeRemaining) : formatSeconds(elapsedTime)}
            </span>
          </div>

          {/* LEVEL / RANK BADGE */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/20 dark:bg-white/10 border border-current/10 text-xs font-black">
            <playerRank.icon className={`w-3.5 h-3.5 ${playerRank.color}`} />
            <span className="opacity-75">LVL {playerRank.level}</span>
            <span className="opacity-40">•</span>
            <span className={playerRank.color}>{playerRank.title}</span>
          </div>
        </div>

        {/* CENTER: SUBTITLE (PICK A WORD / TYPE THE LETTERS) */}
        <div className="font-bold text-xs sm:text-base tracking-wider text-center drop-shadow hidden xs:block">
          <AnimatePresence mode="wait">
            {activeWord ? (
              <motion.span
                key="typing"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="text-emerald-400 font-extrabold flex items-center justify-center gap-1.5"
              >
                <span>Type the letters</span>
              </motion.span>
            ) : (
              <motion.span
                key="pick"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="opacity-85 font-medium"
              >
                Pick a word
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: REAL REWARD XP & SOLVED COUNTER */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* REAL REWARD XP BADGE */}
          <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-mono font-black text-[11px] sm:text-xs shadow-sm">
            <Zap className="w-3.5 h-3.5 fill-amber-400 shrink-0" />
            <span>+{puzzleData?.rewardXp || 10} XP<span className="hidden sm:inline"> Reward</span></span>
          </div>

          {/* SOLVED CHECK COUNTER (✓ 0 or ✓ 3/10) */}
          <div className="flex items-center gap-1 sm:gap-1.5 font-black text-xs sm:text-base px-2 sm:px-3 py-1 rounded-xl bg-black/20 dark:bg-white/10 border border-current/10 backdrop-blur-md">
            <Check className="w-3.5 sm:w-4 h-3.5 sm:h-4 stroke-[3.5] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)] shrink-0" />
            <span>{correctWordsCount}</span>
            <span className="opacity-40 text-[10px] sm:text-xs">/{totalWords}</span>
          </div>

          {/* SINGLE INTEGRATED THEME TOGGLE */}
          {mounted && (
            <motion.button
              whileHover={{ scale: 1.12, rotate: isDark ? 15 : -15 }}
              whileTap={{ scale: 0.88, rotate: isDark ? -25 : 25 }}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center border-2 shadow-lg transition-all cursor-pointer shrink-0 ${
                isDark
                  ? "bg-[#07130e]/90 border-emerald-400 text-emerald-400 shadow-emerald-950/50 hover:shadow-emerald-500/40"
                  : "bg-[#0cc48a]/90 border-yellow-300 text-yellow-300 shadow-emerald-900/20 hover:shadow-yellow-300/50"
              }`}
              title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  >
                    <Sun className="w-3.5 sm:w-4 h-3.5 sm:h-4 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  >
                    <Moon className="w-3.5 sm:w-4 h-3.5 sm:h-4 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] fill-current" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN INTERACTIVE VIEW (CRISP SQUARE GRID vs FULL-SCREEN FOCUS QUESTION) */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 w-full max-w-[1500px] mx-auto flex items-center justify-center p-2 sm:p-6 overflow-auto">
        {/* ------------------------------------------------------------- */}
        {/* A. BOARD VIEW ("Pick a word") */}
        {/* ------------------------------------------------------------- */}
        <div
          className={`relative transition-all duration-500 w-full flex items-center justify-center ${
            activeWord ? "filter blur-[8px] opacity-20 pointer-events-none scale-95" : "opacity-100 scale-100"
          }`}
        >
          {crosswordData.grid && crosswordData.grid.length > 0 ? (
            <div className="w-full overflow-auto flex justify-center items-center py-2 px-1 max-h-full">
              <div
                className="grid gap-[4px] sm:gap-[7px] select-none p-2 sm:p-5 md:p-6 bg-black/10 dark:bg-white/5 rounded-2xl sm:rounded-3xl border border-current/10 shadow-inner"
                style={{
                  gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(0, 1fr))`,
                  width: `${Math.min(crosswordData.cols * (typeof window !== "undefined" && window.innerWidth < 640 ? 38 : 50), 960)}px`,
                  maxWidth: "100%",
                }}
              >
                {crosswordData.grid.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const cellKey = `${rIdx},${cIdx}`;
                    const isLetterCell = Boolean(cell && cell.char);
                    const userLetter = userInputs[cellKey] || "";
                    const isWordHovered = hoveredWordCells.has(cellKey);

                    if (!isLetterCell) {
                      return <div key={cellKey} className="aspect-square w-full opacity-0 pointer-events-none" />;
                    }

                    return (
                      <motion.div
                        key={cellKey}
                        whileHover={{ scale: 1.08, y: -2 }}
                        whileTap={{ scale: 0.92 }}
                        onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        onClick={() => handleCellClick(cell, rIdx, cIdx)}
                        className={`relative aspect-square w-full rounded-lg sm:rounded-2xl flex items-center justify-center font-black text-xs sm:text-2xl transition-all cursor-pointer ${
                          isDark
                            ? userLetter
                              ? "border-2 border-emerald-400 bg-gradient-to-b from-[#123e2d] to-[#0a271c] text-emerald-300 shadow-[0_3px_0_#051811] sm:shadow-[0_4px_0_#051811] shadow-emerald-950/80"
                              : isWordHovered
                              ? "border-2 border-emerald-400 bg-[#0f2e21] text-white shadow-[0_3px_0_#061a12] sm:shadow-[0_4px_0_#061a12] shadow-emerald-500/20"
                              : "border-2 border-white/40 bg-[#091a13]/85 text-white hover:border-emerald-400 hover:bg-[#113324] shadow-[0_3px_0_#040d09] sm:shadow-[0_4px_0_#040d09]"
                            : userLetter
                            ? "border-2 border-emerald-600 bg-emerald-100 text-emerald-950 shadow-[0_3px_0_#047857] sm:shadow-[0_4px_0_#047857]"
                            : isWordHovered
                            ? "border-2 border-emerald-600 bg-emerald-50 text-slate-900 shadow-[0_3px_0_#94a3b8] sm:shadow-[0_4px_0_#94a3b8]"
                            : "border-2 border-slate-400/80 bg-white/95 text-slate-900 hover:border-emerald-600 hover:bg-emerald-50 shadow-[0_3px_0_#cbd5e1] sm:shadow-[0_4px_0_#cbd5e1]"
                        }`}
                      >
                        {/* CRISP NUMBER IN TOP-LEFT */}
                        {cell.number && (
                          <span
                            className={`absolute top-0.5 left-0.5 sm:left-1 text-[7px] sm:text-[11px] font-black leading-none drop-shadow ${
                              isDark ? "text-white" : "text-slate-800"
                            }`}
                          >
                            {cell.number}
                          </span>
                        )}

                        {/* USER SOLVED LETTER */}
                        <span className="mt-0.5 font-mono font-black tracking-wider drop-shadow">
                          {userLetter}
                        </span>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 opacity-60 text-sm">
              Papan TTS belum memiliki pertanyaan yang valid.
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------- */}
        {/* B. FOCUS QUESTION VIEW - PERFECTLY CENTERED & NON-SCROLLABLE */}
        {/* ------------------------------------------------------------- */}
        <AnimatePresence>
          {activeWord && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: 1,
                x: shakeWord ? [-16, 16, -12, 12, -6, 6, 0] : 0,
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              onClick={() => {
                // Clicking anywhere refocuses the native phone keyboard
                hiddenInputRef.current?.focus();
              }}
              className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden backdrop-blur-3xl select-none ${
                isDark ? "bg-[#06140e]/95 text-white" : "bg-slate-50/98 text-slate-900"
              }`}
            >
              {/* REAL HIDDEN INPUT TO TRIGGER NATIVE PHONE KEYBOARD */}
              <input
                ref={hiddenInputRef}
                type="text"
                inputMode="text"
                autoFocus
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
                value=""
                onChange={(e) => {
                  const val = e.target.value;
                  if (val) {
                    const char = val.slice(-1);
                    handleInputLetter(char);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Backspace") {
                    e.preventDefault();
                    handleBackspace();
                  }
                }}
                className="opacity-0 absolute -top-10 left-0 w-1 h-1 pointer-events-none"
                aria-label="Ketik jawaban Anda"
              />

              {/* CENTERED COMPACT CONTENT WRAPPER */}
              <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center my-auto space-y-3 sm:space-y-4 px-1">
                {/* TOP HEADER: BACK BUTTON & CLUE INFO */}
                <div className="w-full flex items-center justify-between gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWord(null);
                      setAnswerState("typing");
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md ${
                      isDark
                        ? "bg-white/10 hover:bg-white/20 border-white/20 text-white"
                        : "bg-white hover:bg-slate-100 border-slate-300 text-slate-800"
                    }`}
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Kembali ke Papan</span>
                  </button>

                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border text-xs font-black uppercase tracking-wider shadow-md ${
                      isDark
                        ? "bg-emerald-500/25 border-emerald-400/50 text-emerald-300"
                        : "bg-emerald-100 border-emerald-400 text-emerald-800"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Soal #{activeWord.number}</span>
                    <span>•</span>
                    <span>{activeWord.direction === "ACROSS" ? "Mendatar" : "Menurun"}</span>
                  </div>
                </div>

                {/* QUESTION CARD */}
                <div
                  className={`w-full p-4 sm:p-5 md:p-6 rounded-2xl sm:rounded-3xl border shadow-xl backdrop-blur-md text-center shrink-0 ${
                    isDark
                      ? "bg-[#081f16] border-emerald-500/30 text-white"
                      : "bg-white border-emerald-500/30 text-slate-900 shadow-slate-200/80"
                  }`}
                >
                  <span
                    className={`text-[10px] sm:text-[11px] font-black uppercase tracking-widest block mb-1.5 opacity-90 ${
                      isDark ? "text-emerald-400" : "text-emerald-600"
                    }`}
                  >
                    Pertanyaan ({activeWord.length} Huruf)
                  </span>
                  <h2
                    className={`text-base sm:text-2xl md:text-3xl font-black leading-snug tracking-tight drop-shadow-sm ${
                      isDark ? "text-white" : "text-slate-900"
                    }`}
                  >
                    {activeWord.clue}
                  </h2>
                </div>

                {/* LETTER BOXES / SLOTS (RESPONSIVE FOR ALL SCREEN SIZES) */}
                <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 md:gap-3 flex-wrap py-1 max-w-full">
                  {typedLetters.map((letter, idx) => {
                    const isActive = activeSlotIdx === idx;
                    const isFilled = Boolean(letter);
                    const isLongWord = typedLetters.length > 7;

                    return (
                      <motion.button
                        key={idx}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveSlotIdx(idx);
                          hiddenInputRef.current?.focus();
                        }}
                        className={`${
                          isLongWord
                            ? "w-9 h-11 text-lg sm:w-12 sm:h-14 sm:text-2xl md:w-15 md:h-18 md:text-3xl"
                            : "w-11 h-13 text-xl sm:w-14 sm:h-16 sm:text-2xl md:w-16 md:h-20 md:text-3xl"
                        } rounded-xl sm:rounded-2xl flex items-center justify-center font-black font-mono uppercase transition-all relative cursor-pointer select-none ${
                          answerState === "correct"
                            ? "bg-emerald-400 border-2 border-emerald-200 text-slate-950 shadow-[0_4px_0_#047857] scale-105"
                            : answerState === "wrong"
                            ? "bg-rose-600 border-2 border-rose-300 text-white shadow-[0_4px_0_#9f1239]"
                            : isFilled
                            ? isDark
                              ? "bg-gradient-to-b from-[#144230] to-[#092419] border-2 border-emerald-400 text-emerald-300 shadow-[0_4px_0_#051710]"
                              : "bg-emerald-100 border-2 border-emerald-600 text-emerald-950 shadow-[0_4px_0_#047857]"
                            : isActive
                            ? isDark
                              ? "bg-[#0b261b] border-2 border-emerald-400 text-white shadow-[0_4px_0_#05150f] ring-2 sm:ring-4 ring-emerald-500/40 scale-105"
                              : "bg-white border-2 border-emerald-600 text-slate-900 shadow-[0_4px_0_#047857] ring-2 sm:ring-4 ring-emerald-500/30 scale-105"
                            : isDark
                            ? "bg-[#081811]/90 border-2 border-white/30 text-white/40 shadow-[0_3px_0_#030b07]"
                            : "bg-white border-2 border-slate-300 text-slate-400 shadow-[0_3px_0_#cbd5e1]"
                        }`}
                      >
                        {letter ? (
                          <motion.span
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 20 }}
                            className="drop-shadow-md"
                          >
                            {letter}
                          </motion.span>
                        ) : (
                          isActive && (
                            <span className="w-3 sm:w-5 h-1 rounded-full bg-emerald-500 opacity-90 animate-pulse" />
                          )
                        )}

                        {/* Slot Index Number */}
                        <span
                          className={`absolute -bottom-1 text-[7px] sm:text-[8px] font-bold select-none ${
                            isDark ? "opacity-60 text-white" : "opacity-60 text-slate-600"
                          }`}
                        >
                          {idx + 1}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* HELPER QUICK ACTION BUTTONS */}
                <div className="flex items-center justify-center gap-2.5 pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBackspace();
                      hiddenInputRef.current?.focus();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md ${
                      isDark
                        ? "bg-rose-950/70 hover:bg-rose-900 border-rose-500/40 text-rose-300 hover:text-white shadow-[0_3px_0_#4c0519]"
                        : "bg-rose-100 hover:bg-rose-200 border-rose-300 text-rose-800 shadow-[0_3px_0_#fca5a5]"
                    }`}
                  >
                    <Delete className="w-3.5 h-3.5" />
                    <span>Hapus (⌫)</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTypedLetters(new Array(activeWord.length).fill(""));
                      setActiveSlotIdx(0);
                      hiddenInputRef.current?.focus();
                    }}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md ${
                      isDark
                        ? "bg-slate-800/80 hover:bg-slate-700 border-white/15 text-slate-300 hover:text-white shadow-[0_3px_0_#0f172a]"
                        : "bg-slate-200 hover:bg-slate-300 border-slate-300 text-slate-800 shadow-[0_3px_0_#cbd5e1]"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kosongkan</span>
                  </button>
                </div>

                <p className={`text-[11px] sm:text-xs tracking-wide font-medium text-center shrink-0 ${isDark ? "opacity-50 text-white" : "opacity-60 text-slate-600"}`}>
                  Ketik jawaban langsung menggunakan keyboard HP Anda
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ========================================================================= */}
      {/* 4. BOTTOM ACTION BAR (BACK/PAUSE, SOUND, FULLSCREEN) */}
      {/* ========================================================================= */}
      <footer className="relative z-20 w-full px-4 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between backdrop-blur-md border-t border-white/5 shrink-0">
        {/* LEFT: BACK */}
        <Link
          href={onBackUrl}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-current/15 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer text-xs font-bold opacity-80 hover:opacity-100"
          title="Kembali ke Daftar TTS"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        {/* RIGHT: SOUND & FULLSCREEN */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 sm:p-2.5 rounded-full border border-current/15 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title={isMuted ? "Aktifkan Suara" : "Matikan Suara"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 opacity-50" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 sm:p-2.5 rounded-full border border-current/15 bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all cursor-pointer opacity-80 hover:opacity-100"
            title={isFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-emerald-400" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 5. GAMIFIED VICTORY SCORECARD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-3xl overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className={`border-2 rounded-3xl sm:rounded-[40px] p-5 sm:p-8 max-w-lg w-full text-center space-y-4 sm:space-y-6 relative overflow-hidden backdrop-blur-3xl shadow-2xl ${
                isDark ? "bg-[#081812] border-emerald-400/50 text-white" : "bg-white border-emerald-500/40 text-slate-900"
              }`}
            >
              {/* TROPHY & 3-STAR RATING CELEBRATION */}
              <div className="relative pt-2">
                {/* SVG GRADIENT DEFINITIONS FOR 3D GOLD STARS */}
                <svg className="absolute w-0 h-0 overflow-hidden" aria-hidden="true" focusable="false">
                  <defs>
                    <linearGradient id="ttsGoldHeroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFBEB" />
                      <stop offset="25%" stopColor="#FDE047" />
                      <stop offset="60%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="ttsGoldBevelGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#B45309" />
                      <stop offset="40%" stopColor="#D97706" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                    <linearGradient id="ttsEmptyStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(148, 163, 184, 0.3)" />
                      <stop offset="100%" stopColor="rgba(71, 85, 105, 0.15)" />
                    </linearGradient>
                    <filter id="starGlow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                </svg>

                {/* AMBIENT RADIAL GLOW & LIGHT RAYS */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 bg-[radial-gradient(circle,_rgba(245,158,11,0.22)_0%,_rgba(16,185,129,0.15)_40%,_transparent_70%)] pointer-events-none blur-xl -z-10 animate-pulse" />

                {/* TROPHY BADGE PEDESTAL */}
                <div className="relative inline-flex mb-2">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)] border-2 border-emerald-200/50 animate-bounce">
                    <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-slate-950 drop-shadow-md" />
                  </div>
                  {/* FLOATING CORNER SPARKLES */}
                  <motion.div
                    animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5 }}
                    className="absolute -top-2 -right-2 bg-amber-400 text-slate-950 p-1 rounded-full shadow-lg border border-amber-200"
                  >
                    <Sparkles className="w-4 h-4 fill-amber-950 text-amber-950" />
                  </motion.div>
                </div>

                {/* 3D ARCADE STAR RATING ARC */}
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-1 mb-2">
                  {[1, 2, 3].map((starNum) => {
                    const isEarned = starNum <= starsEarned;
                    const isCenter = starNum === 2;
                    const rotationClass = starNum === 1 ? "-rotate-12 translate-y-2.5" : starNum === 3 ? "rotate-12 translate-y-2.5" : "-translate-y-2";
                    const sizeClass = isCenter ? "w-14 h-14 sm:w-16 sm:h-16" : "w-10 h-10 sm:w-12 sm:h-12";

                    return (
                      <motion.div
                        key={starNum}
                        initial={{ scale: 0, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        transition={{
                          delay: 0.15 + starNum * 0.18,
                          type: "spring",
                          stiffness: 320,
                          damping: 14,
                        }}
                        className={`relative flex items-center justify-center ${rotationClass} transition-transform`}
                      >
                        {/* Glow halo behind earned stars */}
                        {isEarned && (
                          <div
                            className={`absolute inset-0 rounded-full blur-md -z-10 ${
                              isCenter ? "bg-amber-400/60 scale-125 animate-pulse" : "bg-amber-400/40 scale-110"
                            }`}
                          />
                        )}

                        <svg
                          viewBox="0 0 24 24"
                          className={`${sizeClass} ${
                            isEarned
                              ? "drop-shadow-[0_4px_12px_rgba(245,158,11,0.65)] hover:scale-110 transition-transform duration-300"
                              : "opacity-40"
                          }`}
                        >
                          {isEarned ? (
                            <>
                              {/* 3D Gold Faceted Star Body */}
                              <polygon
                                points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                                fill="url(#ttsGoldHeroGrad)"
                                stroke="url(#ttsGoldBevelGrad)"
                                strokeWidth="1.2"
                                strokeLinejoin="round"
                              />
                              {/* Specular 3D Highlight facet */}
                              <polygon
                                points="12,2 15.09,8.26 12,17.77"
                                fill="rgba(255, 255, 255, 0.45)"
                              />
                              <polygon
                                points="12,2 8.91,8.26 12,17.77"
                                fill="rgba(0, 0, 0, 0.12)"
                              />
                            </>
                          ) : (
                            /* Unearned Sleek Crystal Star */
                            <polygon
                              points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
                              fill="url(#ttsEmptyStarGrad)"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              className="text-slate-400/50"
                              strokeLinejoin="round"
                            />
                          )}
                        </svg>

                        {/* Top sparkle badge on center hero star if earned */}
                        {isEarned && isCenter && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.25, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute -top-1 -right-1 text-amber-300 text-xs select-none pointer-events-none"
                          >
                            ✦
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>

                {/* STAR TIER PERFORMANCE TITLE */}
                <div className="flex justify-center mt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                      starsEarned === 3
                        ? "bg-amber-400/15 text-amber-500 dark:text-amber-400 border border-amber-400/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]"
                        : starsEarned === 2
                        ? "bg-teal-400/15 text-teal-600 dark:text-teal-300 border border-teal-400/30"
                        : "bg-blue-400/15 text-blue-600 dark:text-blue-300 border border-blue-400/30"
                    }`}
                  >
                    {starsEarned === 3 && <Sparkles className="w-3.5 h-3.5" />}
                    {starsEarned === 3
                      ? "Bintang Sempurna (Mastery)"
                      : starsEarned === 2
                      ? "Pencapaian Hebat (Great Job)"
                      : "Misi Tuntas (Completed)"}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  {submissionResult?.taskTitle ? "MISI QUEST SELESAI" : "PENUGASAN SELESAI"}
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Kemenangan Gemilang!
                </h2>
                <p className="text-xs sm:text-sm opacity-80">
                  {submissionResult?.taskTitle
                    ? `Hasil pengerjaan quest "${submissionResult.taskTitle}" berhasil disimpan ke sistem!`
                    : `Selamat! Anda berhasil menuntaskan teka-teki silang "${title}".`}
                </p>
              </div>

              {/* GAMIFIED STATS GRID */}
              <div className="grid grid-cols-3 gap-2.5 bg-black/15 dark:bg-white/5 border border-current/10 rounded-2xl p-4 text-center">
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-black block">XP Diperoleh</span>
                  <span className="text-lg sm:text-xl font-black text-amber-400 flex items-center justify-center gap-1">
                    <Zap className="w-4 h-4 fill-amber-400" />
                    +{submissionResult ? submissionResult.xpEarned : (puzzleData?.rewardXp || 10)} XP
                  </span>
                  {submissionResult?.speedBonusXp > 0 && (
                    <span className="text-[9px] text-blue-400 font-bold block mt-0.5">
                      (+{submissionResult.speedBonusXp} XP Speed)
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-black block">Waktu Selesai</span>
                  <span className="text-lg sm:text-xl font-black text-cyan-400 flex items-center justify-center gap-1">
                    <Timer className="w-4 h-4" />
                    {formatSeconds(elapsedTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] opacity-60 uppercase font-black block">Akurasi / Skor</span>
                  <span className="text-lg sm:text-xl font-black text-emerald-400 flex items-center justify-center gap-1">
                    <Target className="w-4 h-4" />
                    {submissionResult
                      ? `${submissionResult.score}%`
                      : `${totalWords > 0 ? Math.max(0, Math.round((correctWordsCount / totalWords) * 100)) : 100}%`}
                  </span>
                </div>
              </div>

              {/* BREAKDOWN TERPECAHKAN / PERCOBAAN KELIRU */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                      ✓
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-emerald-200">Soal Terpecahkan</span>
                  </div>
                  <span className="text-sm font-black text-emerald-500">
                    {submissionResult ? submissionResult.correctCount : correctWordsCount} / {submissionResult ? submissionResult.totalQuestions : totalWords}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-xs">
                      ✕
                    </div>
                    <span className="text-xs font-bold text-slate-800 dark:text-rose-200">Percobaan Keliru</span>
                  </div>
                  <span className="text-sm font-black text-rose-500">
                    {submissionResult?.wrongCount !== undefined ? submissionResult.wrongCount : mistakeCount}x
                  </span>
                </div>
              </div>

              {/* REALTIME SAVE & SYNC STATUS BANNER */}
              <div className="w-full">
                {isSubmitting ? (
                  <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center gap-2.5 text-blue-500 dark:text-blue-400 text-xs font-bold animate-pulse">
                    <Sparkles className="w-4 h-4 animate-spin shrink-0" />
                    <span>Menyimpan data dan sinkronisasi ke sistem...</span>
                  </div>
                ) : hasSubmitted ? (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Data pengerjaan & sinkronisasi berhasil disimpan ke sistem</span>
                  </div>
                ) : null}
              </div>

              {/* BADGES EARNED */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {(submissionResult?.wrongCount !== undefined ? submissionResult.wrongCount === 0 && submissionResult.correctCount === totalWords : mistakeCount === 0 && correctWordsCount === totalWords) && (
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                    <Target className="w-3 h-3" />
                    <span>🎯 Perfect Accuracy</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-black uppercase tracking-wider">
                  <Award className="w-3 h-3" />
                  <span>Rank: {playerRank.title}</span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                {!taskId && (
                  <button
                    onClick={handleResetPuzzle}
                    disabled={isSubmitting}
                    className="w-full py-3.5 rounded-2xl bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 border border-current/10 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Main Lagi</span>
                  </button>
                )}

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    window.location.href = onBackUrl;
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isSubmitting
                      ? "Menyimpan Data..."
                      : onBackUrl.includes("tugas")
                      ? "Kembali ke Quest Tugas"
                      : "Selesai & Keluar"}
                  </span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
