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

export default function TTSParticipantPlayer({ puzzleData, onBackUrl = "/member/tugas", currentUser, taskId }) {
  const [mounted, setMounted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hiddenInputRef = useRef(null);

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

  // Word segments breakdown for multi-word answers with spaces/hyphens
  const activeWordSegments = useMemo(() => {
    if (!activeWord) return [];

    let rawAnswer = String(activeWord.originalAnswer || "").trim();

    const matchedQ = puzzleData?.questions?.find(
      (q) =>
        String(q.id) === String(activeWord.id) ||
        String(q.clue || "").trim().toLowerCase() === String(activeWord.clue || "").trim().toLowerCase()
    );

    if (matchedQ?.answer && (/[\s_-]/.test(matchedQ.answer))) {
      rawAnswer = String(matchedQ.answer).trim();
    } else if (!rawAnswer || !/[\s_-]/.test(rawAnswer)) {
      if (matchedQ?.answer) {
        rawAnswer = String(matchedQ.answer).trim();
      }
    }

    if (!rawAnswer) {
      rawAnswer = String(activeWord.answer || "").trim();
    }

    const parts = rawAnswer.split(/[\s_-]+/).filter(Boolean);
    const totalPartsLen = parts.reduce((acc, p) => acc + p.replace(/[^A-Za-z0-9]/g, "").length, 0);

    if (parts.length > 1 && totalPartsLen === activeWord.length) {
      let currentGlobalIdx = 0;
      return parts.map((part) => {
        const cleanPart = part.replace(/[^A-Za-z0-9]/g, "");
        const startIdx = currentGlobalIdx;
        currentGlobalIdx += cleanPart.length;
        return {
          text: cleanPart,
          startIdx,
          length: cleanPart.length,
        };
      });
    }

    return [{ text: activeWord.answer, startIdx: 0, length: activeWord.length }];
  }, [activeWord, puzzleData]);

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

  // Dynamic Accuracy Score (0 - 100%)
  const computedAccuracyScore = useMemo(() => {
    if (submissionResult?.score !== undefined) return submissionResult.score;
    if (totalWords > 0) {
      return Math.max(0, Math.min(100, Math.round((correctWordsCount / totalWords) * 100)));
    }
    return 0;
  }, [submissionResult, correctWordsCount, totalWords]);

  // Star Rating on completion based on accuracy percentage
  const starsEarned = useMemo(() => {
    if (computedAccuracyScore >= 80) return 3;
    if (computedAccuracyScore >= 50) return 2;
    if (computedAccuracyScore >= 20) return 1;
    return 0;
  }, [computedAccuracyScore]);

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
  // Navigate between words directly from answering modal
  const handlePrevWord = () => {
    if (!activeWord || !crosswordData?.placedWords?.length) return;
    const currentIndex = crosswordData.placedWords.findIndex(
      (w) => w.direction === activeWord.direction && w.number === activeWord.number
    );
    const prevIndex = (currentIndex - 1 + crosswordData.placedWords.length) % crosswordData.placedWords.length;
    handleSelectWord(crosswordData.placedWords[prevIndex]);
  };

  const handleNextWord = () => {
    if (!activeWord || !crosswordData?.placedWords?.length) return;
    const currentIndex = crosswordData.placedWords.findIndex(
      (w) => w.direction === activeWord.direction && w.number === activeWord.number
    );
    const nextIndex = (currentIndex + 1) % crosswordData.placedWords.length;
    handleSelectWord(crosswordData.placedWords[nextIndex]);
  };

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

  return (
    <div className="fixed inset-0 w-full h-[100dvh] max-h-[100dvh] overflow-hidden select-none font-sans flex flex-col justify-between bg-gradient-to-b from-[#d8f3e5] via-[#f7fdf9] to-[#dcf5e7] text-slate-900 transition-colors duration-500 relative px-2 sm:px-4 md:px-6 py-1.5 sm:py-2.5">
      {/* ========================================================================= */}
      {/* ULTRA-RICH AMBIENT BOTANICAL FOLIAGE & SUNLIGHT RAYS (PURE CSS & SVG) */}
      {/* ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 select-none">
        {/* Ambient Top Sunlight & Radial Glows matching reference */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[450px] bg-gradient-to-b from-[#bef264]/40 via-[#34d399]/25 to-transparent rounded-full blur-[100px] pointer-events-none" />
        
        {/* Top-Left Vibrant Lime-Yellow Glow */}
        <div className="absolute -top-24 -left-24 w-80 sm:w-[450px] h-80 sm:h-[450px] rounded-full bg-gradient-to-br from-[#eab308]/30 via-[#84cc16]/40 to-transparent blur-[75px]" />
        
        {/* Top-Right Emerald Canopy Glow */}
        <div className="absolute -top-24 -right-24 w-80 sm:w-[450px] h-80 sm:h-[450px] rounded-full bg-gradient-to-bl from-[#10b981]/50 via-[#047857]/40 to-transparent blur-[75px]" />
        
        {/* Center Bright White Radiance for Crossword Grid Focus */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-4xl h-[65%] bg-white/70 rounded-full blur-[85px] pointer-events-none" />

        {/* Bottom-Left Botanical Atmosphere */}
        <div className="absolute -bottom-24 -left-20 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full bg-gradient-to-tr from-[#10b981]/40 via-[#34d399]/30 to-transparent blur-3xl" />

        {/* Bottom-Right Golden Lime Atmosphere */}
        <div className="absolute -bottom-24 -right-20 w-80 sm:w-[400px] h-80 sm:h-[400px] rounded-full bg-gradient-to-tl from-[#84cc16]/45 via-[#22c55e]/35 to-transparent blur-3xl" />

        {/* Top-Left Organic Leaves */}
        <div className="absolute -top-12 -left-12 sm:-top-8 sm:-left-8 w-48 sm:w-72 h-48 sm:h-72 pointer-events-none filter blur-[3px] opacity-75 animate-[pulse_6s_ease-in-out_infinite]">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-emerald-800/60 transform -rotate-12">
            <path d="M0,0 C120,20 180,110 170,160 C120,190 40,140 0,0 Z" />
            <path d="M30,0 C140,50 190,140 180,180 C130,200 50,150 30,0 Z" fill="#65a30d" opacity="0.7" />
          </svg>
        </div>

        {/* Top-Right Organic Leaves */}
        <div className="absolute -top-12 -right-12 sm:-top-8 sm:-right-8 w-48 sm:w-72 h-48 sm:h-72 pointer-events-none filter blur-[3px] opacity-75 animate-[pulse_7s_ease-in-out_infinite]">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-emerald-900/60 transform rotate-12 scale-x-[-1]">
            <path d="M0,0 C120,20 180,110 170,160 C120,190 40,140 0,0 Z" />
            <path d="M30,0 C140,50 190,140 180,180 C130,200 50,150 30,0 Z" fill="#4d7c0f" opacity="0.7" />
          </svg>
        </div>

        {/* Bottom-Left Organic Leaves */}
        <div className="absolute -bottom-14 -left-14 sm:-bottom-10 sm:-left-10 w-52 sm:w-80 h-52 sm:h-80 pointer-events-none filter blur-[4px] opacity-70">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-emerald-800/70 -rotate-45">
            <path d="M0,200 C80,120 160,110 200,50 C180,10 90,60 0,200 Z" />
            <path d="M0,170 C90,90 170,80 200,20 C180,-10 90,40 0,170 Z" fill="#84cc16" opacity="0.6" />
          </svg>
        </div>

        {/* Bottom-Right Organic Leaves */}
        <div className="absolute -bottom-14 -right-14 sm:-bottom-10 sm:-right-10 w-52 sm:w-80 h-52 sm:h-80 pointer-events-none filter blur-[4px] opacity-75">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-lime-800/70 rotate-45 scale-x-[-1]">
            <path d="M0,200 C80,120 160,110 200,50 C180,10 90,60 0,200 Z" />
            <path d="M0,170 C90,90 170,80 200,20 C180,-10 90,40 0,170 Z" fill="#15803d" opacity="0.6" />
          </svg>
        </div>
      </div>

      {/* CELEBRATION EXPLOSION */}
      {showCelebrationParticles && <ParticleExplosion count={40} />}

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
      {/* 1. TOP BRANDING & CONTROLS (COMPACT HEADER BAR) */}
      {/* ========================================================================= */}
      <div className="relative z-20 w-full max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-3 shrink-0 py-0.5 px-0.5">
        {/* LEFT: BACK BUTTON + SRE LOGO */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href={onBackUrl}
            className="p-1.5 sm:p-2 rounded-xl border border-emerald-600/30 bg-white/95 hover:bg-white text-[#064e3b] backdrop-blur-md transition-all cursor-pointer shrink-0 shadow-sm active:scale-95"
            title="Kembali"
          >
            <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </Link>

          <div
            className="h-7 w-20 min-[380px]:h-8 min-[380px]:w-24 sm:h-9 sm:w-32 md:h-10 md:w-36 shrink-0 bg-[#064e3b] filter drop-shadow-[0_1px_3px_rgba(6,78,59,0.2)]"
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
        </div>

        {/* CENTER: DAFTAR SOAL & SOUND (NO TIMER) */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* TOP DAFTAR SOAL BUTTON */}
          <button
            type="button"
            onClick={() => setShowClueDrawer(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-600/30 bg-white/95 hover:bg-white text-[#064e3b] font-black text-[11px] sm:text-xs backdrop-blur-md shadow-sm active:scale-95 cursor-pointer transition-all"
            title="Buka Daftar Soal"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
            <span>Soal</span>
            <span className="px-1.5 py-0.5 rounded-md text-[9.5px] font-mono font-black leading-none bg-emerald-100 text-emerald-900 border border-emerald-300/60">
              {correctWordsCount}/{totalWords}
            </span>
          </button>

          {/* XP REWARD */}
          {(puzzleData?.rewardXp !== undefined && puzzleData?.rewardXp !== null ? puzzleData.rewardXp : 0) > 0 && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-100/95 border border-amber-400 text-amber-900 font-mono font-black text-xs backdrop-blur-md shadow-sm">
              <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
              <span>+{puzzleData.rewardXp} XP</span>
            </div>
          )}

          {/* SOUND TOGGLE */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 sm:p-2 rounded-xl border border-emerald-600/30 bg-white/95 hover:bg-white text-[#064e3b] backdrop-blur-md transition-all cursor-pointer shadow-sm active:scale-95"
            title={isMuted ? "Suara Aktif" : "Bisukan Suara"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
        </div>

        {/* RIGHT: LWM (LEARNING WORKING MEANING) LOGO */}
        <div className="flex items-center shrink-0" title="Learning Working Meaning">
          <div
            className="h-7 w-20 min-[380px]:h-8 min-[380px]:w-24 sm:h-9 sm:w-32 md:h-10 md:w-36 shrink-0 bg-[#064e3b] hover:bg-emerald-700 filter drop-shadow-[0_1px_3px_rgba(6,78,59,0.2)] hover:scale-105 transition-all"
            style={{
              WebkitMaskImage: "url(/images/LWM.webp)",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "right center",
              maskImage: "url(/images/LWM.webp)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "right center",
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN BOARD VIEW (STRICT AUTO FIT, ZERO SCROLL) */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 min-h-0 w-full max-w-5xl mx-auto flex flex-col items-center justify-between overflow-hidden py-0.5">
        {/* ===================================================================== */}
        {/* SRE CATALYST ACADEMY 3D TYPOGRAPHY BANNER */}
        {/* ===================================================================== */}
        <div className="flex flex-col items-center text-center my-0 relative select-none shrink-0 w-full px-1">
          {/* QUOTE */}
          <p className="text-[9px] sm:text-[11px] font-black italic uppercase tracking-widest text-[#064e3b] font-sans drop-shadow-sm leading-none mb-0.5">
            &ldquo;Fill the Boxes, Power the Future&rdquo;
          </p>

          {/* MAIN 3D VECTOR SVG TITLE */}
          <div className="relative inline-flex flex-col items-center group cursor-default max-w-full">
            {/* 4-Point Golden Star Sparkle Glint on top-left of 'S' */}
            <div className="absolute -top-2 -left-1.5 sm:-top-3 sm:-left-2.5 pointer-events-none z-20">
              <svg viewBox="0 0 40 40" className="w-5 h-5 sm:w-7 sm:h-7 text-amber-300 fill-amber-300 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.95)] animate-pulse">
                <path d="M20,0 L23,17 L40,20 L23,23 L20,40 L17,23 L0,20 L17,17 Z" />
              </svg>
            </div>

            {/* Vector SVG Text Container for 100% Crisp Vector Rendering */}
            <svg
              viewBox="0 0 520 140"
              className="w-[200px] min-[380px]:w-[230px] sm:w-[320px] md:w-[380px] max-h-[7.5vh] sm:max-h-[9vh] h-auto overflow-visible select-none"
              style={{
                filter: "drop-shadow(0 4px 12px rgba(4,120,87,0.3))",
              }}
            >
              <defs>
                <linearGradient id="catalystTextGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" />
                  <stop offset="45%" stopColor="#22c55e" />
                  <stop offset="85%" stopColor="#15803d" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
              </defs>

              {/* SRE CATALYST */}
              <text
                x="260"
                y="56"
                textAnchor="middle"
                fontSize="52"
                fontWeight="900"
                fontStyle="italic"
                fontFamily="var(--font-montserrat), 'Montserrat', 'Plus Jakarta Sans', sans-serif"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#catalystTextGrad)"
                paintOrder="stroke fill"
                letterSpacing="-1.5"
              >
                SRE CATALYST
              </text>

              {/* ACADEMY */}
              <text
                x="260"
                y="120"
                textAnchor="middle"
                fontSize="62"
                fontWeight="900"
                fontStyle="italic"
                fontFamily="var(--font-montserrat), 'Montserrat', 'Plus Jakarta Sans', sans-serif"
                stroke="#ffffff"
                strokeWidth="14"
                strokeLinejoin="round"
                strokeLinecap="round"
                fill="url(#catalystTextGrad)"
                paintOrder="stroke fill"
                letterSpacing="-2"
              >
                ACADEMY
              </text>
            </svg>

            {/* TILTED DYNAMIC MODULE BADGE (COMPACT 3D RIBBON) */}
            <div className="mt-0.5 inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-0.5 bg-gradient-to-r from-[#032e1a] via-[#064e3b] to-[#047857] text-[#bef264] rounded-md sm:rounded-lg text-[9px] sm:text-[11px] font-black uppercase tracking-wider shadow-[0_2px_8px_rgba(6,78,59,0.3)] border-2 border-white -rotate-1 transform hover:rotate-0 transition-transform duration-300 max-w-[92vw]">
              <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-[#bef264] shrink-0 animate-spin" />
              <span className="truncate drop-shadow max-w-[200px] sm:max-w-xs">{title}</span>
            </div>
          </div>
        </div>

        {/* SUBTITLE INSTRUCTION */}
        <div className="my-0.5 px-2.5 py-0.5 rounded-full border border-emerald-500/30 bg-white/90 text-emerald-950 text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-wider flex items-center gap-1 shadow-xs text-center shrink-0">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
          <span>Klik kotak untuk mengisi jawaban</span>
        </div>

        {/* SQUARE CROSSWORD GRID (NATIVE SVG VECTOR BOARD - PERFECT FIT & CRISP BORDERS) */}
        {crosswordData.grid && crosswordData.grid.length > 0 ? (
          <div className="w-full flex-1 min-h-0 flex items-center justify-center p-1 sm:p-2 overflow-hidden">
            <svg
              viewBox={`-8 -8 ${crosswordData.cols * 36 + 16} ${crosswordData.rows * 36 + 16}`}
              className="max-h-full max-w-full w-auto h-auto select-none filter drop-shadow-[0_10px_25px_rgba(6,78,59,0.18)]"
              preserveAspectRatio="xMidYMid meet"
            >
              {/* Outer Card Background & Border (Always tightly hugging the puzzle) */}
              <rect
                x="-6"
                y="-6"
                width={crosswordData.cols * 36 + 12}
                height={crosswordData.rows * 36 + 12}
                rx="14"
                fill="#ffffff"
                stroke="#10b981"
                strokeWidth="2"
                strokeOpacity="0.8"
              />

              {/* Crossword Letter Cells */}
              {crosswordData.grid.map((row, rIdx) =>
                row.map((cell, cIdx) => {
                  const cellKey = `${rIdx},${cIdx}`;
                  const isLetterCell = Boolean(cell && cell.char);
                  const userLetter = userInputs[cellKey] || "";
                  const isWordHovered = hoveredWordCells.has(cellKey);

                  if (!isLetterCell) {
                    return null;
                  }

                  return (
                    <g
                      key={cellKey}
                      transform={`translate(${cIdx * 36}, ${rIdx * 36})`}
                      onClick={() => handleCellClick(cell, rIdx, cIdx)}
                      onMouseEnter={() => setHoveredCell({ row: rIdx, col: cIdx })}
                      onMouseLeave={() => setHoveredCell(null)}
                      className="cursor-pointer group"
                    >
                      {/* Crisp High-Contrast Cell Box */}
                      <rect
                        x="1.5"
                        y="1.5"
                        width="33"
                        height="33"
                        rx="4"
                        fill={userLetter ? "#dcfce7" : isWordHovered ? "#ecfdf5" : "#ffffff"}
                        stroke={userLetter ? "#047857" : isWordHovered ? "#10b981" : "#64748b"}
                        strokeWidth={userLetter ? "2" : isWordHovered ? "2" : "1.5"}
                      />

                      {/* 3D Push Bevel Highlight */}
                      <line
                        x1="3"
                        y1="3"
                        x2="33"
                        y2="3"
                        stroke={userLetter ? "#86efac" : "#f1f5f9"}
                        strokeWidth="1"
                        strokeLinecap="round"
                      />

                      {/* Starting Clue Number */}
                      {cell.number && (
                        <text
                          x="3.5"
                          y="9.5"
                          fontSize="8"
                          fontWeight="900"
                          fontFamily="var(--font-montserrat), sans-serif"
                          fill="#064e3b"
                          className="select-none pointer-events-none"
                        >
                          {cell.number}
                        </text>
                      )}

                      {/* Typed Answer Letter */}
                      {userLetter && (
                        <text
                          x="18"
                          y="24.5"
                          textAnchor="middle"
                          fontSize="17"
                          fontWeight="900"
                          fontFamily="var(--font-montserrat), monospace"
                          fill="#022c22"
                          className="select-none pointer-events-none"
                        >
                          {userLetter}
                        </text>
                      )}
                    </g>
                  );
                })
              )}
            </svg>
          </div>
        ) : (
          <div className="text-center py-4 opacity-60 text-xs font-bold text-slate-700">
            Papan TTS belum memiliki soal.
          </div>
        )}

        {/* BOTTOM BRANDING PILL & SOCIAL FOOTNOTE */}
        <div className="flex flex-col items-center gap-1 w-full select-none shrink-0 pt-0.5">
          {/* Glossy Pill with Right Star Sparkle */}
          <div className="relative inline-flex items-center">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-800 text-white font-black text-[8.5px] sm:text-[10.5px] tracking-wider uppercase shadow-[0_3px_10px_rgba(6,78,59,0.3)] border-2 border-white">
              <span>SRE SC UPNVJT 2026</span>
            </div>
            {/* Sparkle on right corner */}
            <div className="absolute -top-1 -right-1.5 pointer-events-none">
              <svg viewBox="0 0 30 30" className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 fill-amber-300 filter drop-shadow-[0_0_6px_rgba(251,191,36,0.9)] animate-pulse">
                <path d="M15,0 L17,13 L30,15 L17,17 L15,30 L13,17 L0,15 L13,13 Z" />
              </svg>
            </div>
          </div>

          {/* TWO-COLUMN SOCIAL HANDLES (LEFT) AND HASHTAGS (RIGHT) */}
          <div className="w-full max-w-4xl px-2 sm:px-4 flex items-end justify-between gap-2">
            {/* Left: Stacked Social Accounts */}
            <div className="flex flex-col items-start gap-0.5 text-[8px] sm:text-[9.5px] font-black text-[#064e3b]">
              <a
                href="https://instagram.com/sre.upnjatim"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 fill-none stroke-[#064e3b] stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
                <span>sre.upnjatim</span>
              </a>
              <a
                href="mailto:upnvjatim@sre.co.id"
                className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 fill-none stroke-[#064e3b] stroke-[2.2] stroke-linecap-round stroke-linejoin-round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>upnvjatim@sre.co.id</span>
              </a>
              <div className="flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 fill-[#064e3b]">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
                </svg>
                <span>SRE SC UPN Veteran Jawa Timur</span>
              </div>
            </div>

            {/* Right: Bold Hashtag */}
            <div className="text-right shrink-0">
              <span className="text-[8.5px] sm:text-xs font-black tracking-wide text-[#064e3b] uppercase block">
                #SREUPNVJT #Energizens
              </span>
            </div>
          </div>
        </div>
      </main>

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
            className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-6 bg-black/70 backdrop-blur-lg overflow-y-auto sm:overflow-hidden select-none text-white"
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

            {/* TOP BAR / NAVIGATION */}
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2 shrink-0 pt-1 sm:pt-0"
            >
              {/* Back button */}
              <button
                type="button"
                onClick={handleCloseModal}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>
                  Kembali <span className="hidden sm:inline">ke Papan</span>
                </span>
              </button>

              {/* Center: Clue Badge & Attempts */}
              <div className="flex items-center gap-1 sm:gap-1.5 overflow-hidden shrink">
                {wrongAnswerBehavior === "RETRY" && maxRetryAttempts && maxRetryAttempts > 0 && (
                  <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-amber-400/40 bg-amber-500/15 text-amber-300 text-[10px] sm:text-xs font-mono font-bold backdrop-blur-md shadow-sm shrink-0">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    <span>
                      {Math.max(0, maxRetryAttempts - (wordAttempts[`${activeWord.direction}-${activeWord.number}`] || 0))}x <span className="hidden min-[400px]:inline">Kesempatan</span>
                    </span>
                  </div>
                )}

                <div className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg border border-emerald-400/40 bg-emerald-500/15 text-emerald-300 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-sm truncate">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">#{activeWord.number} • {activeWord.direction === "ACROSS" ? "Mendatar" : "Menurun"}</span>
                </div>
              </div>

              {/* Right: Quick Nav & Close Button Group */}
              <div className="flex items-center bg-zinc-900/90 border border-white/15 rounded-xl p-0.5 shadow-md backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={handlePrevWord}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
                  title="Soal Sebelumnya"
                >
                  <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextWord}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-90 cursor-pointer"
                  title="Soal Selanjutnya"
                >
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <div className="w-px h-3.5 bg-white/15 mx-0.5" />
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="p-1.5 sm:p-2 rounded-lg hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 transition-all active:scale-90 cursor-pointer"
                  title="Tutup Modal"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                hiddenInputRef.current?.focus();
              }}
              className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center my-auto py-4 space-y-5 text-center"
            >
              {/* QUESTION TEXT */}
              <div className="space-y-1.5 px-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400 block drop-shadow">
                  Pertanyaan ({activeWord.length} Huruf{activeWordSegments.length > 1 ? ` • ${activeWordSegments.map((s) => s.length).join(" + ")}` : ""})
                </span>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black leading-snug tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] max-w-xl mx-auto">
                  {activeWord.clue}
                </h2>
              </div>

              {/* LETTER SLOTS */}
              <div className="w-full max-w-2xl mx-auto py-3 px-2 flex flex-wrap items-center justify-center gap-y-3 gap-x-2 sm:gap-x-4">
                {activeWordSegments.map((segment, segIdx) => {
                  const effectiveSegmentLen = segment.length > 8 ? Math.ceil(segment.length / 2) : segment.length;
                  let slotSizeClass = "w-10 h-13 text-xl sm:w-13 sm:h-16 sm:text-2xl md:w-15 md:h-18 md:text-3xl";
                  if (effectiveSegmentLen >= 8) {
                    slotSizeClass = "w-8.5 h-11 text-base min-[380px]:w-9 min-[380px]:h-12 min-[380px]:text-lg sm:w-11 sm:h-14 sm:text-xl md:w-13 md:h-16 md:text-2xl";
                  } else {
                    slotSizeClass = "w-9 h-12 text-lg min-[380px]:w-10 min-[380px]:h-13 min-[380px]:text-xl sm:w-12 sm:h-15 sm:text-2xl md:w-14 md:h-17 md:text-3xl";
                  }

                  return (
                    <div key={segIdx} className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full">
                      {/* Hyphen/Separator between word clusters */}
                      {segIdx > 0 && activeWordSegments.length > 1 && (
                        <div className="flex items-center justify-center px-0.5 text-emerald-400 font-mono font-black text-xl sm:text-2xl md:text-3xl select-none shrink-0 drop-shadow animate-pulse">
                          -
                        </div>
                      )}

                      {/* Word cluster */}
                      <div className="flex flex-wrap items-center justify-center gap-1 min-[380px]:gap-1.5 sm:gap-2 max-w-full">
                        {Array.from({ length: segment.length }).map((_, letterOffset) => {
                          const idx = segment.startIdx + letterOffset;
                          const letter = typedLetters[idx] || "";
                          const isActive = activeSlotIdx === idx;
                          const isFilled = Boolean(letter);

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
                              className={`${slotSizeClass} rounded-xl sm:rounded-2xl flex items-center justify-center font-black font-mono uppercase transition-all relative cursor-pointer select-none shrink-0 ${
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
                                  <span className="w-2.5 sm:w-4 h-1 rounded-full bg-emerald-500 opacity-90 animate-pulse" />
                                )
                              )}

                              <span className="absolute -bottom-1 text-[7px] sm:text-[9px] font-bold opacity-60 text-white select-none">
                                {idx + 1}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QUICK ACTION BUTTONS */}
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 pt-1 shrink-0 flex-wrap">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevWord();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBackspace();
                    hiddenInputRef.current?.focus();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/40 bg-rose-950/80 hover:bg-rose-900 text-xs font-bold text-rose-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-zinc-800/80 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Kosongkan</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextWord();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/15 bg-zinc-900/90 hover:bg-zinc-800 text-xs font-bold text-zinc-200 hover:text-white transition-all active:scale-95 cursor-pointer shadow-md backdrop-blur-md"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-[11px] sm:text-xs tracking-wide font-medium text-center opacity-70 text-zinc-300 drop-shadow">
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
              className="border-2 rounded-3xl sm:rounded-[36px] p-5 sm:p-7 max-w-2xl w-full max-h-[88vh] flex flex-col relative overflow-hidden backdrop-blur-3xl shadow-2xl bg-white border-emerald-600/40 text-slate-900"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-300 flex items-center justify-center font-black">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm sm:text-base text-slate-900">Daftar Pertanyaan TTS</h3>
                    <p className="text-[11px] text-slate-500">
                      Klik salah satu pertanyaan untuk langsung mengisi jawabannya.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowClueDrawer(false)}
                  className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* LIST BODY */}
              <div className="flex-1 overflow-y-auto py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* MENDATAR */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-black text-xs uppercase tracking-wider">
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
                              ? "bg-emerald-50 border-emerald-300 opacity-90"
                              : "bg-slate-50 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300 text-slate-900"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSolved
                                ? "bg-emerald-600 text-white"
                                : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            }`}
                          >
                            {isSolved ? "✓" : item.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug line-clamp-2 text-slate-900">{item.clue}</p>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
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
                  <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-black text-xs uppercase tracking-wider">
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
                              ? "bg-teal-50 border-teal-300 opacity-90"
                              : "bg-slate-50 hover:bg-teal-50 border-slate-200 hover:border-teal-300 text-slate-900"
                          }`}
                        >
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                              isSolved
                                ? "bg-teal-600 text-white"
                                : "bg-teal-100 text-teal-800 border border-teal-300"
                            }`}
                          >
                            {isSolved ? "✓" : item.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-snug line-clamp-2 text-slate-900">{item.clue}</p>
                            <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-2xl overflow-hidden select-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.12 }}
              className="border border-white/10 border-t-emerald-400/90 rounded-2xl p-6 sm:p-8 max-w-md w-full text-center relative overflow-hidden backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_40px_rgba(16,185,129,0.12)] bg-gradient-to-b from-[#0e1a14] via-[#09120e] to-[#040806] text-white"
            >
              {/* Refined Ambient Glow & Cyber Accents */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 h-36 bg-gradient-to-b from-emerald-500/20 to-transparent blur-3xl pointer-events-none" />
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-teal-500/10 blur-2xl rounded-full pointer-events-none" />
              <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full pointer-events-none" />

              {/* Minimal Corner Crosshairs */}
              <div className="absolute top-3 left-3 w-2.5 h-2.5 border-t border-l border-emerald-400/70 pointer-events-none" />
              <div className="absolute top-3 right-3 w-2.5 h-2.5 border-t border-r border-emerald-400/70 pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-2.5 h-2.5 border-b border-l border-emerald-400/70 pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-2.5 h-2.5 border-b border-r border-emerald-400/70 pointer-events-none" />

              {/* SRE Logo Header */}
              <div className="flex items-center justify-center relative z-10 mb-2">
                <div
                  className="h-5 w-24 shrink-0 bg-white/90 drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
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
              </div>

              {/* HERO MEDALLION CELEBRATION */}
              <div className="relative z-10 pt-1 pb-2">
                <div className="relative inline-flex items-center justify-center mb-3">
                  {/* Outer Ring Glow */}
                  <div className={`absolute -inset-2 rounded-2xl blur-lg transition-all duration-500 opacity-60 ${
                    computedAccuracyScore >= 80
                      ? "bg-amber-500/40"
                      : computedAccuracyScore >= 50
                      ? "bg-emerald-500/40"
                      : "bg-teal-500/30"
                  }`} />

                  {/* Medallion Base */}
                  <div
                    className={`w-16 h-16 sm:w-18 sm:h-18 rounded-2xl flex items-center justify-center border transition-all duration-300 shadow-2xl relative ${
                      computedAccuracyScore >= 80
                        ? "bg-gradient-to-br from-amber-500/30 via-zinc-900 to-amber-950/60 border-amber-400/70 shadow-[0_0_30px_rgba(251,191,36,0.3)]"
                        : computedAccuracyScore >= 50
                        ? "bg-gradient-to-br from-emerald-500/30 via-zinc-900 to-teal-950/60 border-emerald-400/70 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                        : "bg-gradient-to-br from-cyan-500/20 via-zinc-900 to-zinc-950 border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.25)]"
                    }`}
                  >
                    <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent rounded-t-2xl pointer-events-none" />
                    {computedAccuracyScore >= 80 ? (
                      <Trophy className="w-8 h-8 sm:w-9 sm:h-9 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse" />
                    ) : computedAccuracyScore >= 50 ? (
                      <Sparkles className="w-8 h-8 sm:w-9 sm:h-9 text-emerald-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.9)]" />
                    ) : (
                      <Target className="w-8 h-8 sm:w-9 sm:h-9 text-cyan-300 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]" />
                    )}
                  </div>
                </div>

                {/* LUMINOUS STARS TIER */}
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3].map((starNum) => {
                    const isEarned = starNum <= starsEarned;
                    return (
                      <div key={starNum} className="relative flex items-center justify-center">
                        {isEarned && (
                          <div className="absolute inset-0 bg-amber-400/30 blur-md rounded-full" />
                        )}
                        <Star
                          className={`w-6 h-6 sm:w-7 sm:h-7 transition-all duration-300 relative z-10 ${
                            isEarned
                              ? "fill-amber-400 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.9)] scale-110"
                              : "fill-zinc-800/40 text-zinc-700/80 stroke-[1.5]"
                          } ${starNum === 2 && isEarned ? "scale-125" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* TITLE & DESCRIPTION */}
              <div className="space-y-1.5 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-mono font-bold uppercase tracking-[0.2em] bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
                  <Crown className="w-3 h-3 text-emerald-400" />
                  <span>MISI SELESAI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-sm">
                  {computedAccuracyScore >= 80
                    ? "Kemenangan Gemilang! 🌟"
                    : computedAccuracyScore >= 50
                    ? "Kerja Bagus! ✨"
                    : "Teka-Teki Selesai! 🧩"}
                </h2>
                <p className="text-xs text-zinc-300/80 leading-relaxed max-w-xs mx-auto">
                  {computedAccuracyScore >= 80
                    ? `Akurasi sempurna ${computedAccuracyScore}%! ${correctWordsCount} dari ${totalWords} pertanyaan berhasil diselesaikan.`
                    : `Menyelesaikan ${correctWordsCount} dari ${totalWords} soal dengan akurasi ${computedAccuracyScore}%.`}
                </p>
              </div>

              {/* STATS TELEMETRY HUD */}
              <div className="grid grid-cols-3 gap-2.5 my-4 relative z-10">
                <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center backdrop-blur-md shadow-inner group hover:border-amber-400/40 transition-colors">
                  <span className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider block font-semibold">XP REWARD</span>
                  <span className="text-sm sm:text-base font-black text-amber-400 flex items-center justify-center gap-1 mt-1">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    +{(submissionResult?.xpEarned !== undefined ? submissionResult.xpEarned : (puzzleData?.rewardXp ?? 0))}
                  </span>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center backdrop-blur-md shadow-inner group hover:border-cyan-400/40 transition-colors">
                  <span className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider block font-semibold">WAKTU</span>
                  <span className="text-sm sm:text-base font-black text-cyan-300 flex items-center justify-center gap-1 mt-1">
                    <Timer className="w-3.5 h-3.5" />
                    {formatSeconds(elapsedTime)}
                  </span>
                </div>
                <div className="bg-zinc-900/60 border border-white/10 rounded-xl p-3 text-center backdrop-blur-md shadow-inner group hover:border-emerald-400/40 transition-colors">
                  <span className="text-[9px] text-zinc-400 uppercase font-mono tracking-wider block font-semibold">AKURASI</span>
                  <span className={`text-sm sm:text-base font-black flex items-center justify-center gap-1 mt-1 ${computedAccuracyScore >= 80 ? "text-emerald-400" : computedAccuracyScore >= 50 ? "text-teal-400" : "text-cyan-400"}`}>
                    <Target className="w-3.5 h-3.5" />
                    {computedAccuracyScore}%
                  </span>
                </div>
              </div>

              {/* STREAMLINED ACTION BUTTONS (NO MAIN LAGI) */}
              <div className="flex flex-col gap-2.5 pt-1 relative z-10">
                {/* PRIMARY STORY SHARE BUTTON */}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 hover:from-emerald-400 hover:to-cyan-300 text-zinc-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] transition-all cursor-pointer active:scale-[0.98] border border-emerald-200/60 tracking-wide"
                >
                  <Share2 className="w-4 h-4 stroke-[2.5]" />
                  <span>Bagikan ke Media Sosial (Story 9:16)</span>
                  <Sparkles className="w-4 h-4 fill-current" />
                </button>

                {/* ELEGANT EXIT / BACK BUTTON */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    window.location.href = onBackUrl;
                  }}
                  className="w-full py-3 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/70 hover:border-zinc-500 text-zinc-200 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 tracking-wide shadow-sm"
                >
                  <Check className="w-4 h-4 stroke-[2.5] text-emerald-400" />
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
          score: computedAccuracyScore,
          starsEarned,
        }}
        currentUser={currentUser}
      />
    </div>
  );
}
