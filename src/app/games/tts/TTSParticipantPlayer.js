"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, Volume2, VolumeX, Maximize2, Minimize2,
  Sun, Moon, RotateCcw, ArrowLeft, Keyboard as KeyboardIcon,
  Trophy, Award, Zap, Delete, Sparkles, Flame, Lightbulb,
  Star, Target, Timer, Crown, ShieldAlert, Sparkle, CheckCircle2,
  Share2, ListOrdered, HelpCircle, BookOpen, X, ChevronLeft,
  ChevronRight, ArrowRight, Eye, Palette
} from "lucide-react";
import Link from "next/link";
import { generateCrosswordLayout } from "@/lib/crosswordGenerator";
import TTSShareCardModal from "./TTSShareCardModal";

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
function ParticleExplosion({ count = 36 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 600,
        y: (Math.random() - 0.5) * 550 - 50,
        scale: Math.random() * 1.4 + 0.6,
        rotate: Math.random() * 720 - 360,
        color: ["#10b981", "#34d399", "#f59e0b", "#fbbf24", "#38bdf8", "#ec4899", "#a855f7"][
          Math.floor(Math.random() * 7)
        ],
        shape: Math.random() > 0.4 ? "circle" : "star",
      }))
    );
  }, [count]);

  if (particles.length === 0) return null;

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
          transition={{ duration: 1.2, ease: "easeOut" }}
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
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hiddenInputRef = useRef(null);

  // 2 Selectable Themes: "dark" (Cyber Emerald) vs "light" (Modern Pearl)
  const [gameTheme, setGameTheme] = useState("dark");
  const isDark = gameTheme === "dark";

  useEffect(() => {
    setMounted(true);
  }, []);

  // Audio State
  const [isMuted, setIsMuted] = useState(false);

  // Gameplay State
  const [mistakeCount, setMistakeCount] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
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
  const maxRetryAttempts = puzzleData?.maxRetryAttempts ? parseInt(puzzleData.maxRetryAttempts) : null;

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
  const [wordAttempts, setWordAttempts] = useState({}); // { "ACROSS-1": 1 }

  // Focus Modal Answering State
  const [activeWord, setActiveWord] = useState(null);
  const [typedLetters, setTypedLetters] = useState([]);
  const [activeSlotIdx, setActiveSlotIdx] = useState(0);
  const [answerState, setAnswerState] = useState("typing"); // "typing" | "correct" | "wrong"
  const [shakeWord, setShakeWord] = useState(false);

  // Timer State
  const [timeRemaining, setTimeRemaining] = useState(timeLimitMinutes ? timeLimitMinutes * 60 : null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Modals
  const [showWinModal, setShowWinModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showClueDrawer, setShowClueDrawer] = useState(false);

  const allClueWords = useMemo(() => {
    return [...crosswordData.clues.across, ...crosswordData.clues.down];
  }, [crosswordData]);

  const totalWords = allClueWords.length;

  const correctWordsCount = useMemo(() => {
    return Object.values(wordStatuses).filter((st) => st === "CORRECT").length;
  }, [wordStatuses]);

  // Player Rank Calculation
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (activeWord || showWinModal || showShareModal || showClueDrawer) {
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
  }, [activeWord, showWinModal, showShareModal, showClueDrawer]);

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

  // Open answering focus modal when a word or box is clicked
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

  // Submit answers to server
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
            if (finalStatuses[wordKey] === "CORRECT") {
              answersMap[q.id] = cleanAns;
            } else {
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

  // Direct letter typing & auto validation in modal
  const triggerValidation = useCallback((letters) => {
    if (!activeWord) return;
    const enteredAnswer = letters.join("").toUpperCase();
    const correctAnswer = activeWord.answer.toUpperCase();
    const isCorrect = enteredAnswer === correctAnswer;
    const wordKey = `${activeWord.direction}-${activeWord.number}`;

    if (isCorrect) {
      setAnswerState("correct");
      playSound("correct", isMuted);
      setShowCelebrationParticles(true);
      setTimeout(() => setShowCelebrationParticles(false), 1200);

      setFloatingXP({
        text: "Jawaban Benar!",
        sub: `Soal #${activeWord.number} Terpecahkan ✨`,
        key: Date.now(),
        type: "correct"
      });
      setTimeout(() => setFloatingXP(null), 1400);

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

      setTimeout(() => {
        setActiveWord(null);
        setAnswerState("typing");
        if (totalCompleted >= totalWords) {
          setShowWinModal(true);
          setIsTimerRunning(false);
          playSound("win", isMuted);
          handleSubmitAnswers(nextStatuses, newInputs, mistakeCount);
        }
      }, 750);
    } else {
      setAnswerState("wrong");
      playSound("wrong", isMuted);
      setShakeWord(true);
      const nextMistakes = mistakeCount + 1;
      setMistakeCount(nextMistakes);
      setTimeout(() => setShakeWord(false), 450);

      // Track attempts for this specific word
      const currentAttempts = (wordAttempts[wordKey] || 0) + 1;
      const nextWordAttempts = { ...wordAttempts, [wordKey]: currentAttempts };
      setWordAttempts(nextWordAttempts);

      const hasAttemptLimit = wrongAnswerBehavior === "RETRY" && maxRetryAttempts && maxRetryAttempts > 0;
      const isLimitReached = hasAttemptLimit && currentAttempts >= maxRetryAttempts;

      if (wrongAnswerBehavior === "REVEAL" || isLimitReached) {
        setFloatingXP({
          text: isLimitReached ? "Batas Percobaan Habis!" : "Jawaban Kurang Tepat",
          sub: isLimitReached
            ? `Batas ${maxRetryAttempts}x salah tercapai. Kunci jawaban dibuka.`
            : "Lanjut ke soal berikutnya",
          key: Date.now(),
          type: "wrong",
        });
        setTimeout(() => setFloatingXP(null), 1400);

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
        }, 1100);
      } else {
        const remainingAttempts = hasAttemptLimit ? maxRetryAttempts - currentAttempts : null;
        setFloatingXP({
          text: "Jawaban Kurang Tepat",
          sub:
            remainingAttempts !== null
              ? `Tersisa ${remainingAttempts} kesempatan mencoba lagi`
              : "Periksa kembali susunan hurufnya",
          key: Date.now(),
          type: "wrong",
        });
        setTimeout(() => setFloatingXP(null), 1200);

        setTimeout(() => {
          setTypedLetters(new Array(activeWord.length).fill(""));
          setActiveSlotIdx(0);
          setAnswerState("typing");
        }, 600);
      }
    }
  }, [
    activeWord,
    userInputs,
    wordStatuses,
    wordAttempts,
    totalWords,
    wrongAnswerBehavior,
    maxRetryAttempts,
    isMuted,
    mistakeCount,
    handleSubmitAnswers,
  ]);

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

  // Close modal safely on mobile and desktop
  const handleCloseModal = useCallback(() => {
    setActiveWord(null);
    setAnswerState("typing");
    if (typeof document !== "undefined" && document.activeElement) {
      document.activeElement.blur();
    }
  }, []);

  // Keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (showWinModal || showShareModal || showClueDrawer) return;

      if (e.key === "Escape") {
        if (activeWord) {
          handleCloseModal();
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
  }, [activeWord, showWinModal, showShareModal, showClueDrawer, handleInputLetter, handleBackspace]);

  // Reset puzzle
  const handleResetPuzzle = () => {
    setUserInputs({});
    setWordStatuses({});
    setActiveWord(null);
    setTypedLetters([]);
    setAnswerState("typing");
    setShowWinModal(false);
    setMistakeCount(0);
    setHintsUsed(0);
    setElapsedTime(0);
    if (timeLimitMinutes) {
      setTimeRemaining(timeLimitMinutes * 60);
    }
    setIsTimerRunning(true);
  };

  // 2 Distinct Layout Themes:
  const bgThemeClass = isDark
    ? "bg-[#030f09] text-white"
    : "bg-gradient-to-b from-[#f2faf5] via-[#e6f6ed] to-[#d9f0e3] text-slate-900";

  return (
    <div className={`fixed inset-0 w-screen h-screen overflow-hidden select-none font-sans flex flex-col justify-between transition-colors duration-500 ${bgThemeClass}`}>
      {/* CELEBRATION EXPLOSION */}
      {showCelebrationParticles && <ParticleExplosion count={40} />}

      {/* AMBIENT BACKGROUND GLOW */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {isDark ? (
          <>
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl opacity-70" />
            <div className="absolute bottom-10 -right-10 w-96 h-96 rounded-full bg-teal-500/15 blur-3xl opacity-60" />
            <div className="absolute top-1/3 -left-20 w-72 h-72 rounded-full bg-emerald-950/40 blur-3xl opacity-50" />
          </>
        ) : (
          <>
            <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl" />
            <div className="absolute bottom-10 -left-10 w-96 h-96 rounded-full bg-teal-200/40 blur-3xl" />
          </>
        )}
      </div>

      {/* FLOATING XP BANNER */}
      <AnimatePresence>
        {floatingXP && (
          <motion.div
            key={floatingXP.key}
            initial={{ opacity: 0, y: -25, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1.08 }}
            exit={{ opacity: 0, y: -35, scale: 0.9 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-2.5 rounded-2xl border-2 flex flex-col items-center justify-center gap-0.5 shadow-2xl pointer-events-none ${
              floatingXP.type === "wrong"
                ? "bg-rose-600 text-white border-rose-300 shadow-rose-900/60"
                : "bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 text-slate-950 border-white shadow-[0_0_35px_rgba(52,211,153,0.95)]"
            }`}
          >
            <div className="flex items-center gap-2 font-black text-sm sm:text-base">
              {floatingXP.type === "correct" && <Sparkles className="w-4 h-4 fill-current animate-spin" />}
              <span>{floatingXP.text}</span>
            </div>
            {floatingXP.sub && (
              <span className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                {floatingXP.sub}
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER HUD */}
      {/* ========================================================================= */}
      <header
        className={`relative z-20 w-full px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between backdrop-blur-xl border-b transition-colors duration-500 shrink-0 gap-2 ${
          isDark
            ? "border-emerald-500/20 bg-[#020b06]/90 text-white"
            : "border-emerald-600/20 bg-white/90 text-slate-900 shadow-sm"
        }`}
      >
        {/* LEFT: SRE LOGO & TITLE */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Link
            href={onBackUrl}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shrink-0 shadow-sm ${
              isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-gray-300 hover:text-white" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <div className="flex items-center gap-2 min-w-0">
            <div
              className={`h-6 w-20 sm:h-7 sm:w-28 shrink-0 transition-all duration-300 ${
                isDark ? "bg-white" : "bg-[#047857]"
              }`}
              style={{
                WebkitMaskImage: "url(/images/logo.webp)",
                WebkitMaskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                WebkitMaskPosition: "left center",
                maskImage: "url(/images/logo.webp)",
                maskSize: "contain",
                maskRepeat: "no-repeat",
                maskPosition: "left center",
              }}
            />
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm font-black tracking-tight truncate max-w-[85px] xs:max-w-[130px] sm:max-w-xs">
                {title}
              </h1>
              <div className="hidden sm:flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider">
                <span className={isDark ? "text-emerald-400" : "text-emerald-700 font-extrabold"}>SRE UPNVJT</span>
                <span>•</span>
                <span className={isDark ? "text-gray-400" : "text-slate-600"}>Teka-Teki Silang</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: PROGRESS BAR */}
        <div className="hidden md:flex flex-col items-center gap-1 max-w-xs w-full px-4">
          <div className="flex items-center justify-between w-full text-[10px] font-black uppercase tracking-wider">
            <span className={`flex items-center gap-1 ${isDark ? "text-emerald-400" : "text-emerald-700"}`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Progres Pengerjaan</span>
            </span>
            <span className={isDark ? "text-gray-300" : "text-slate-700 font-bold"}>
              {correctWordsCount} / {totalWords} Soal
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isDark ? "bg-black/60 border-emerald-500/30" : "bg-slate-200 border-slate-300"}`}>
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${totalWords > 0 ? (correctWordsCount / totalWords) * 100 : 0}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* RIGHT: THEME SWITCHER, TIMER, XP, SOUND */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* DIGITAL TIMER */}
          <div
            className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl border font-mono font-black text-xs sm:text-sm shadow-sm ${
              isDark
                ? "bg-black/60 border-emerald-500/40 text-emerald-300"
                : "bg-white border-emerald-600/30 text-emerald-800"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            <span>{timeLimitMinutes ? formatSeconds(timeRemaining) : formatSeconds(elapsedTime)}</span>
          </div>

          {/* XP REWARD (Only if rewardXp > 0) */}
          {(puzzleData?.rewardXp !== undefined && puzzleData?.rewardXp !== null ? puzzleData.rewardXp : 0) > 0 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 font-mono font-black text-xs">
              <Zap className="w-3.5 h-3.5 fill-amber-400" />
              <span>+{puzzleData.rewardXp} XP</span>
            </div>
          )}

          {/* 2 THEME SELECTOR BUTTON */}
          <button
            type="button"
            onClick={() => setGameTheme(isDark ? "light" : "dark")}
            className={`p-1.5 sm:px-3 sm:py-1 rounded-xl border font-black text-[11px] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isDark
                ? "bg-emerald-950/80 border-emerald-400 text-emerald-300 hover:bg-emerald-900"
                : "bg-emerald-100 border-emerald-600 text-emerald-900 hover:bg-emerald-200"
            }`}
            title="Ganti Tema Visual"
          >
            {isDark ? <Moon className="w-3.5 h-3.5 text-emerald-400" /> : <Sun className="w-3.5 h-3.5 text-amber-600" />}
            <span className="hidden md:inline">{isDark ? "" : ""}</span>
          </button>

          {/* SOUND TOGGLE */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer shadow-sm ${
              isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-gray-300" : "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
            }`}
            title={isMuted ? "Suara Aktif" : "Bisukan Suara"}
          >
            {isMuted ? <VolumeX className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-rose-400" /> : <Volume2 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-emerald-500" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN BOARD VIEW */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto flex flex-col items-center justify-center p-3 sm:p-6 overflow-auto">
        {/* SUBTITLE BANNER */}
        <div
          className={`mb-2 sm:mb-4 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-xs font-black uppercase tracking-wider flex items-center gap-1.5 sm:gap-2 shadow-sm text-center ${
            isDark
              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
              : "bg-emerald-100 border-emerald-400 text-emerald-900"
          }`}
        >
          <Sparkles className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-emerald-500 shrink-0" />
          <span>Klik kotak untuk mengisi jawaban</span>
        </div>

        {/* SQUARE CROSSWORD GRID */}
        {crosswordData.grid && crosswordData.grid.length > 0 ? (
          <div className="w-full flex items-center justify-center max-h-full overflow-auto py-2">
            <div
              className={`grid gap-[4px] sm:gap-[7px] select-none p-3 sm:p-6 rounded-3xl border shadow-2xl transition-colors duration-500 ${
                isDark
                  ? "bg-black/75 border-emerald-500/30 shadow-[0_0_60px_rgba(0,0,0,0.8)]"
                  : "bg-white/95 border-emerald-600/30 shadow-[0_15px_40px_rgba(4,120,87,0.15)]"
              }`}
              style={{
                gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(0, 1fr))`,
                maxWidth: `min(100%, ${Math.min(crosswordData.cols * 52, 720)}px)`,
                width: "100%",
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
                    <motion.button
                      key={cellKey}
                      type="button"
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.92 }}
                      onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(cell, rIdx, cIdx)}
                      className={`relative aspect-square w-full rounded-xl sm:rounded-2xl flex items-center justify-center font-mono font-black text-xs sm:text-2xl transition-all cursor-pointer shadow-md ${
                        isDark
                          ? userLetter
                            ? "border-2 border-emerald-400 bg-gradient-to-b from-[#123e2d] to-[#0a271c] text-emerald-300 shadow-[0_3px_0_#051811]"
                            : isWordHovered
                            ? "border-2 border-emerald-400 bg-[#0f2e21] text-white shadow-[0_3px_0_#061a12]"
                            : "border-2 border-white/30 bg-[#081c13] text-white hover:border-emerald-400 hover:bg-[#0f2e21] shadow-[0_3px_0_#040d09]"
                          : userLetter
                          ? "border-2 border-emerald-600 bg-emerald-100 text-emerald-950 shadow-[0_3px_0_#047857]"
                          : isWordHovered
                          ? "border-2 border-emerald-600 bg-emerald-50 text-slate-900 shadow-[0_3px_0_#94a3b8]"
                          : "border-2 border-slate-300 bg-white text-slate-900 hover:border-emerald-600 hover:bg-emerald-50 shadow-[0_3px_0_#cbd5e1]"
                      }`}
                    >
                      {/* Starting clue number */}
                      {cell.number && (
                        <span
                          className={`absolute top-0.5 left-0.5 sm:left-1 text-[7px] sm:text-[11px] font-black leading-none ${
                            isDark ? "text-emerald-400" : "text-emerald-700"
                          }`}
                        >
                          {cell.number}
                        </span>
                      )}

                      {/* Letter */}
                      <span className="mt-0.5 font-mono font-black tracking-wider drop-shadow">
                        {userLetter}
                      </span>
                    </motion.button>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 opacity-60 text-sm">
            Papan TTS belum memiliki soal.
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FOOTER BAR */}
      {/* ========================================================================= */}
      <footer
        className={`relative z-20 w-full px-4 sm:px-6 py-2 sm:py-3 flex items-center justify-center sm:justify-between backdrop-blur-md border-t shrink-0 gap-2 transition-colors duration-500 pb-[max(0.65rem,env(safe-area-inset-bottom))] ${
          isDark
            ? "border-white/10 bg-[#020b06]/85 text-white"
            : "border-slate-300 bg-white/90 text-slate-900 shadow-sm"
        }`}
      >
        <Link
          href={onBackUrl}
          className={`hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold transition-all cursor-pointer shrink-0 ${
            isDark ? "border-white/10 bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white" : "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800"
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali</span>
        </Link>

        {/* DAFTAR SOAL BUTTON - CENTERED ON MOBILE */}
        <button
          type="button"
          onClick={() => setShowClueDrawer(true)}
          className={`inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2 sm:py-2.5 rounded-full border font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer ${
            isDark
              ? "border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300"
              : "border-emerald-600 bg-emerald-600 hover:bg-emerald-700 text-white"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Daftar Soal</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black leading-none ${isDark ? "bg-emerald-400/25 text-emerald-300" : "bg-white/25 text-white"}`}>
            {correctWordsCount}/{totalWords}
          </span>
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-[11px] opacity-70 font-bold">
            Mode: {isDark ? "Cyber Emerald" : "Modern Pearl"}
          </span>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 4. FOCUS ANSWERING MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {activeWord && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={handleCloseModal}
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-4 sm:p-6 bg-black/60 backdrop-blur-lg overflow-y-auto select-none text-white"
          >
            {/* INVISIBLE KEYBOARD INPUT */}
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
                  handleInputLetter(val.slice(-1));
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

            {/* TOP BAR / CLOSE BUTTONS */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-auto flex items-center justify-between gap-2 shrink-0 pt-2 sm:pt-0"
            >
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 text-xs font-bold text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Kembali ke Papan</span>
              </button>

              <div className="flex items-center gap-2">
                {wrongAnswerBehavior === "RETRY" && maxRetryAttempts && maxRetryAttempts > 0 && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-300 text-[11px] font-black backdrop-blur-md">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {(wordAttempts[`${activeWord.direction}-${activeWord.number}`] || 0)}/{maxRetryAttempts} Kesempatan
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>#{activeWord.number} • {activeWord.direction === "ACROSS" ? "Mendatar" : "Menurun"}</span>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 sm:p-2 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
                  title="Tutup Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA (NO BOX / CARD BACKGROUND) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                hiddenInputRef.current?.focus();
              }}
              className="w-full max-w-lg mx-auto flex flex-col items-center justify-center my-auto py-4 space-y-5 text-center"
            >
              {/* CLEAN QUESTION TEXT WITHOUT BACKGROUND BOX */}
              <div className="space-y-1.5 px-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block drop-shadow">
                  Pertanyaan ({activeWord.length} Huruf)
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-snug tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                  {activeWord.clue}
                </h2>
              </div>

              {/* LETTER SLOTS */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2.5 flex-wrap py-2 max-w-full">
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
                          ? "w-9 h-11 text-lg sm:w-12 sm:h-14 sm:text-2xl md:w-14 md:h-16 md:text-3xl"
                          : "w-11 h-13 text-xl sm:w-14 sm:h-16 sm:text-2xl md:w-16 md:h-20 md:text-3xl"
                      } rounded-xl sm:rounded-2xl flex items-center justify-center font-black font-mono uppercase transition-all relative cursor-pointer select-none ${
                        answerState === "correct"
                          ? "bg-emerald-400 border-2 border-emerald-200 text-slate-950 shadow-[0_4px_0_#047857] scale-105"
                          : answerState === "wrong"
                          ? "bg-rose-600 border-2 border-rose-300 text-white shadow-[0_4px_0_#9f1239]"
                          : isFilled
                          ? "bg-gradient-to-b from-[#144230] to-[#092419] border-2 border-emerald-400 text-emerald-300 shadow-[0_4px_0_#051710]"
                          : isActive
                          ? "bg-[#0b261b] border-2 border-emerald-400 text-white shadow-[0_4px_0_#05150f] ring-4 ring-emerald-500/40 scale-105"
                          : "bg-[#081811]/90 border-2 border-white/30 text-white/40 shadow-[0_3px_0_#030b07]"
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

                      <span className="absolute -bottom-1 text-[7px] sm:text-[8px] font-bold opacity-60 text-white select-none">
                        {idx + 1}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="flex items-center justify-center gap-2.5 pt-1 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBackspace();
                    hiddenInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-rose-500/40 bg-rose-950/80 hover:bg-rose-900 text-xs font-bold text-rose-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg backdrop-blur-md"
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
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/20 bg-slate-800/80 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-lg backdrop-blur-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>
              </div>

              <p className="text-[11px] sm:text-xs tracking-wide font-medium text-center opacity-70 text-white drop-shadow">
                Ketik jawaban langsung menggunakan keyboard HP / Laptop Anda
              </p>
            </div>

            {/* SPACER */}
            <div className="w-full h-1 shrink-0" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. CLUES EXPLORER DRAWER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showClueDrawer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-md overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`border-2 rounded-3xl sm:rounded-[36px] p-5 sm:p-7 max-w-2xl w-full max-h-[88vh] flex flex-col relative overflow-hidden backdrop-blur-3xl shadow-2xl ${
                isDark ? "bg-[#071711] border-emerald-500/40 text-white" : "bg-white border-emerald-600/40 text-slate-900"
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-current/10 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base">Daftar Pertanyaan TTS</h3>
                    <p className="text-[11px] opacity-70">
                      Klik salah satu pertanyaan untuk langsung mengisi jawabannya.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowClueDrawer(false)}
                  className="p-1.5 rounded-full bg-black/10 dark:bg-white/10 hover:opacity-80 transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* LIST BODY */}
              <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MENDATAR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">
                    <span>Mendatar (Across)</span>
                    <span>{crosswordData.clues.across.length} Soal</span>
                  </div>

                  <div className="space-y-2">
                    {crosswordData.clues.across.map((item) => {
                      const wordKey = `ACROSS-${item.number}`;
                      const isSolved = wordStatuses[wordKey] === "CORRECT";
                      const matchWord = crosswordData.placedWords.find(
                        (w) => w.direction === "ACROSS" && w.number === item.number
                      );

                      return (
                        <button
                          key={wordKey}
                          type="button"
                          onClick={() => {
                            setShowClueDrawer(false);
                            if (matchWord) handleSelectWord(matchWord);
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer active:scale-98 ${
                            isSolved
                              ? "bg-emerald-500/10 border-emerald-500/30 opacity-90"
                              : isDark
                              ? "bg-black/30 hover:bg-emerald-950/40 border-white/10 hover:border-emerald-500/40"
                              : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSolved
                                ? "bg-emerald-500 text-slate-950"
                                : "bg-emerald-500/20 text-emerald-500"
                            }`}
                          >
                            {isSolved ? "✓" : item.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug line-clamp-2">{item.clue}</p>
                            <span className="text-[10px] opacity-60 font-mono mt-0.5 block">
                              {item.length} Huruf {isSolved && "• Terjawab"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MENURUN */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-2 py-1 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 font-black text-xs uppercase tracking-wider">
                    <span>Menurun (Down)</span>
                    <span>{crosswordData.clues.down.length} Soal</span>
                  </div>

                  <div className="space-y-2">
                    {crosswordData.clues.down.map((item) => {
                      const wordKey = `DOWN-${item.number}`;
                      const isSolved = wordStatuses[wordKey] === "CORRECT";
                      const matchWord = crosswordData.placedWords.find(
                        (w) => w.direction === "DOWN" && w.number === item.number
                      );

                      return (
                        <button
                          key={wordKey}
                          type="button"
                          onClick={() => {
                            setShowClueDrawer(false);
                            if (matchWord) handleSelectWord(matchWord);
                          }}
                          className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-2.5 cursor-pointer active:scale-98 ${
                            isSolved
                              ? "bg-teal-500/10 border-teal-500/30 opacity-90"
                              : isDark
                              ? "bg-black/30 hover:bg-teal-950/40 border-white/10 hover:border-teal-500/40"
                              : "bg-slate-50 hover:bg-teal-50 border-slate-200 hover:border-teal-300"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSolved
                                ? "bg-teal-500 text-slate-950"
                                : "bg-teal-500/20 text-teal-500"
                            }`}
                          >
                            {isSolved ? "✓" : item.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug line-clamp-2">{item.clue}</p>
                            <span className="text-[10px] opacity-60 font-mono mt-0.5 block">
                              {item.length} Huruf {isSolved && "• Terjawab"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 6. GAMIFIED VICTORY SCORECARD MODAL */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/55 backdrop-blur-md overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="border-2 rounded-3xl sm:rounded-[40px] p-5 sm:p-8 max-w-lg w-full text-center space-y-4 sm:space-y-6 relative overflow-hidden backdrop-blur-3xl shadow-2xl bg-[#071911] border-emerald-400/50 text-white"
            >
              {/* SRE Logo */}
              <div className="flex items-center justify-center gap-2">
                <div
                  className="h-7 w-24 shrink-0 bg-white"
                  style={{
                    WebkitMaskImage: "url(/images/logo.webp)",
                    WebkitMaskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    WebkitMaskPosition: "center center",
                    maskImage: "url(/images/logo.webp)",
                    maskSize: "contain",
                    maskRepeat: "no-repeat",
                    maskPosition: "center center",
                  }}
                />
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">SRE UPN Veteran Jawa Timur</span>
              </div>

              {/* TROPHY & 3-STAR RATING CELEBRATION */}
              <div className="relative pt-1">
                <div className="relative inline-flex mb-2">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-emerald-300 text-slate-950 flex items-center justify-center shadow-[0_0_35px_rgba(16,185,129,0.5)] border-2 border-emerald-200/50 animate-bounce">
                    <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-slate-950 drop-shadow-md" />
                  </div>
                </div>

                {/* 3D GOLD STARS */}
                <div className="flex items-center justify-center gap-3 mt-1 mb-2">
                  {[1, 2, 3].map((starNum) => (
                    <div key={starNum} className="text-amber-400">
                      <Star className={`w-8 h-8 sm:w-10 sm:h-10 fill-amber-400 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] ${starNum === 2 ? "scale-125" : ""}`} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Crown className="w-3.5 h-3.5" />
                  <span>MISI TTS SELESAI</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Kemenangan Gemilang!
                </h2>
                <p className="text-xs sm:text-sm opacity-80 text-gray-300">
                  Selamat! Anda berhasil menuntaskan seluruh teka-teki silang &quot;{title}&quot;.
                </p>
              </div>

              {/* STATS GRID */}
              <div className="grid grid-cols-3 gap-2 bg-black/40 border border-white/10 rounded-2xl p-3 text-center">
                <div>
                  <span className="text-[9px] opacity-60 uppercase font-black block">XP Reward</span>
                  <span className="text-base sm:text-lg font-black text-amber-400 flex items-center justify-center gap-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    +{(submissionResult?.xpEarned !== undefined ? submissionResult.xpEarned : (puzzleData?.rewardXp ?? 0))} XP
                  </span>
                </div>
                <div>
                  <span className="text-[9px] opacity-60 uppercase font-black block">Waktu Selesai</span>
                  <span className="text-base sm:text-lg font-black text-cyan-400 flex items-center justify-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    {formatSeconds(elapsedTime)}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] opacity-60 uppercase font-black block">Skor / Akurasi</span>
                  <span className="text-base sm:text-lg font-black text-emerald-400 flex items-center justify-center gap-1">
                    <Target className="w-3.5 h-3.5" />
                    {submissionResult ? `${submissionResult.score}%` : "100%"}
                  </span>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col gap-2.5 pt-2">
                {/* SHARE TO SOCIAL MEDIA BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/40 hover:shadow-emerald-500/60 transition-all cursor-pointer active:scale-95 border border-emerald-200/50"
                >
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Bagikan ke Media Sosial (Story 9:16)</span>
                  <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  {!taskId && (
                    <button
                      onClick={handleResetPuzzle}
                      disabled={isSubmitting}
                      className="w-full py-3 rounded-2xl bg-black/40 hover:bg-black/60 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 text-white"
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
                    className="w-full py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
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
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 7. SOCIAL MEDIA PORTRAIT SHARE CARD MODAL */}
      {/* ========================================================================= */}
      <TTSShareCardModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        puzzleData={puzzleData}
        crosswordData={crosswordData}
        userInputs={userInputs}
        wordStatuses={wordStatuses}
        stats={{
          elapsedTime,
          mistakeCount: submissionResult?.wrongCount !== undefined ? submissionResult.wrongCount : mistakeCount,
          xpEarned: submissionResult ? submissionResult.xpEarned : (puzzleData?.rewardXp || 10),
          score: submissionResult
            ? submissionResult.score
            : totalWords > 0
            ? Math.max(0, Math.round((correctWordsCount / totalWords) * 100))
            : 100,
          starsEarned,
        }}
        currentUser={currentUser}
      />
    </div>
  );
}
