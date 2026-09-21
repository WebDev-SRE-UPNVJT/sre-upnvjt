"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Shuffle, Play, Printer, Download, Upload,
  Sparkles, CheckCircle2, XCircle, RotateCcw, Copy, Check,
  Eye, EyeOff, Lightbulb, Trophy, HelpCircle, Layers, Grid3X3,
  BookOpen, Clock, AlertTriangle, ArrowRight, CornerDownLeft,
  Settings2, ChevronRight, Share2, ZoomIn, ZoomOut, Maximize2,
  Save, Award, CheckSquare, Loader2, FileCheck, Sliders, CheckCircle,
  HelpCircleIcon, AlertCircle, ListFilter, Search, Edit3, ExternalLink
} from "lucide-react";
import { generateCrosswordLayout, sanitizeAnswer } from "@/lib/crosswordGenerator";
import { saveTTS, deleteTTS, getTTSList, getTTSById } from "@/app/actions/ttsActions";

export default function TTSBuilderClient({ initialData = null, initialTTSList = [], currentUser = null }) {
  // Saved List from database
  const [savedList, setSavedList] = useState(initialTTSList);
  const [searchQuery, setSearchQuery] = useState("");

  // Active Main View Tab: "list" | "builder" | "play" | "export"
  // Default to "list" if there are existing TTS items, or "builder" if creating new
  const [activeTab, setActiveTab] = useState(initialTTSList && initialTTSList.length > 0 ? "list" : "builder");

  // Form State for Assignment / Penugasan
  const [currentCrosswordId, setCurrentCrosswordId] = useState(initialData?.id || null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [saveErrorMsg, setSaveErrorMsg] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Assignment Metadata & Rules Settings
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [rewardXp, setRewardXp] = useState(initialData?.rewardXp || 15);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(initialData?.timeLimitMinutes || "");

  // Validation Mode Settings
  // validationMode: "MODAL" (Pop-up modal per pertanyaan) | "END" (Harus diisi semua baru cek)
  const [validationMode, setValidationMode] = useState(initialData?.validationMode || "MODAL");
  // wrongAnswerBehavior: "RETRY" (Bisa diulang terus / terbatas) | "REVEAL" (Langsung buka jawaban benar jika salah)
  const [wrongAnswerBehavior, setWrongAnswerBehavior] = useState(initialData?.wrongAnswerBehavior || "RETRY");
  // maxRetryAttempts: null/empty for unlimited, or positive integer (e.g. 3)
  const [maxRetryAttempts, setMaxRetryAttempts] = useState(
    initialData?.maxRetryAttempts != null ? String(initialData.maxRetryAttempts) : ""
  );

  // Questions & Answers
  const [items, setItems] = useState(() => {
    if (initialData?.questions && initialData.questions.length > 0) {
      return initialData.questions.map((q, idx) => ({
        id: q.id || `q_${idx + 1}`,
        clue: q.clue,
        answer: q.answer,
      }));
    }
    return [
      { id: "item_1", clue: "", answer: "" },
      { id: "item_2", clue: "", answer: "" },
      { id: "item_3", clue: "", answer: "" },
    ];
  });

  // Layout generation state & trigger
  const [seedVersion, setSeedVersion] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchText, setBatchText] = useState("");
  const [zoomLevel, setZoomLevel] = useState(1);

  // PLAY / TEST MODE STATES
  const [userInputs, setUserInputs] = useState({});
  const [activeCell, setActiveCell] = useState(null);
  const [activeDirection, setActiveDirection] = useState("ACROSS");
  const [playTime, setPlayTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [endCheckFeedback, setEndCheckFeedback] = useState(null);

  // MODAL ANSWERING STATE
  const [activeModalWord, setActiveModalWord] = useState(null);
  const [modalInputLetters, setModalInputLetters] = useState([]);
  const [modalFeedback, setModalFeedback] = useState(null);
  const [previewWordAttempts, setPreviewWordAttempts] = useState({});
  const modalInputRefs = useRef([]);

  const gridInputRefs = useRef({});

  // Generate crossword layout whenever items change or shuffle is triggered
  const crosswordData = useMemo(() => {
    return generateCrosswordLayout(items, { maxIterations: 70, seed: seedVersion });
  }, [items, seedVersion]);

  // Filter saved TTS list
  const filteredSavedList = useMemo(() => {
    if (!searchQuery.trim()) return savedList;
    const q = searchQuery.toLowerCase();
    return savedList.filter(
      (item) =>
        item.title?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q)
    );
  }, [savedList, searchQuery]);

  // Handle Shuffle / Regenerate Layout
  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setSeedVersion((prev) => prev + 1);
      setIsGenerating(false);
    }, 150);
  };

  // Add Item
  const handleAddItem = () => {
    const newItem = {
      id: `item_${Date.now()}`,
      clue: "",
      answer: "",
    };
    setItems((prev) => [...prev, newItem]);
  };

  // Update Item
  const handleUpdateItem = (index, field, value) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Remove Item
  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Create New Empty TTS
  const handleStartNewTTS = () => {
    setCurrentCrosswordId(null);
    setTitle("");
    setDescription("");
    setRewardXp(15);
    setTimeLimitMinutes("");
    setValidationMode("MODAL");
    setWrongAnswerBehavior("RETRY");
    setMaxRetryAttempts("");
    setItems([
      { id: "item_1", clue: "", answer: "" },
      { id: "item_2", clue: "", answer: "" },
      { id: "item_3", clue: "", answer: "" },
    ]);
    setSeedVersion((prev) => prev + 1);
    handleResetPlay();
    setActiveTab("builder");
  };

  // Load and Edit Saved TTS from DB
  const handleEditSavedTTS = async (id) => {
    setIsSaving(true);
    try {
      const res = await getTTSById(id);
      if (res.success && res.data) {
        const d = res.data;
        setCurrentCrosswordId(d.id);
        setTitle(d.title);
        setDescription(d.description || "");
        setRewardXp(d.rewardXp || 15);
        setTimeLimitMinutes(d.timeLimitMinutes || "");
        setValidationMode(d.validationMode || "MODAL");
        setWrongAnswerBehavior(d.wrongAnswerBehavior || "RETRY");
        setMaxRetryAttempts(d.maxRetryAttempts != null ? String(d.maxRetryAttempts) : "");
        if (d.questions && d.questions.length > 0) {
          setItems(
            d.questions.map((q) => ({
              id: q.id,
              clue: q.clue,
              answer: q.answer,
            }))
          );
        }
        setSeedVersion((prev) => prev + 1);
        handleResetPlay();
        setActiveTab("builder");
      }
    } catch (err) {
      alert("Gagal memuat penugasan TTS");
    } finally {
      setIsSaving(false);
    }
  };

  // Play Saved TTS directly from list
  const handlePlaySavedTTS = async (id) => {
    await handleEditSavedTTS(id);
    setActiveTab("play");
  };

  // Delete Saved TTS
  const handleDeleteSavedTTS = async (id, e) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus penugasan TTS ini dari database?")) return;

    const res = await deleteTTS(id);
    if (res.success) {
      const updatedList = await getTTSList();
      if (updatedList.success) setSavedList(updatedList.data);
      if (currentCrosswordId === id) {
        handleStartNewTTS();
      }
    } else {
      alert(res.error || "Gagal menghapus penugasan TTS.");
    }
  };

  // Save Assignment to Database
  const handleSaveToDatabase = async () => {
    if (!title.trim()) {
      setSaveErrorMsg("Harap masukkan judul penugasan terlebih dahulu.");
      return;
    }

    const validQuestions = items.filter(
      (it) => it.clue.trim() && it.answer.trim()
    );
    if (validQuestions.length < 2) {
      setSaveErrorMsg("Minimal masukkan 2 pertanyaan dan jawaban yang valid.");
      return;
    }

    setIsSaving(true);
    setSaveSuccessMsg("");
    setSaveErrorMsg("");

    try {
      const payload = {
        id: currentCrosswordId,
        title: title.trim(),
        description: description?.trim() || null,
        timeLimitMinutes: timeLimitMinutes ? parseInt(timeLimitMinutes) : null,
        rewardXp: rewardXp ? parseInt(rewardXp) : 15,
        validationMode,
        wrongAnswerBehavior,
        maxRetryAttempts:
          wrongAnswerBehavior === "RETRY" && maxRetryAttempts && parseInt(maxRetryAttempts) > 0
            ? parseInt(maxRetryAttempts)
            : null,
        isPublished: true,
        items,
      };

      const res = await saveTTS(payload);
      if (res.success) {
        setCurrentCrosswordId(res.id);
        setSaveSuccessMsg(res.message || "Penugasan TTS berhasil disimpan ke database!");
        // Refresh saved list
        const updatedList = await getTTSList();
        if (updatedList.success) setSavedList(updatedList.data);
        setTimeout(() => setSaveSuccessMsg(""), 4000);
      } else {
        setSaveErrorMsg(res.error || "Gagal menyimpan penugasan.");
      }
    } catch (err) {
      setSaveErrorMsg(err.message || "Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  // Copy shareable link for a puzzle
  const handleCopyLink = (puzzleId) => {
    const targetId = puzzleId || currentCrosswordId;
    const url = targetId
      ? `${window.location.origin}/games/tts/${targetId}`
      : `${window.location.origin}/games/tts`;
    navigator.clipboard.writeText(url);
    setCopiedId(puzzleId || "current");
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Batch Import
  const handleBatchImport = () => {
    if (!batchText.trim()) return;
    const lines = batchText.split("\n");
    const parsed = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.includes(":") ? line.split(":") : line.includes("=") ? line.split("=") : line.split("-");
      if (parts.length >= 2) {
        const clue = parts[0].trim();
        const answer = parts[1].trim();
        if (clue && answer) {
          parsed.push({
            id: `batch_${Date.now()}_${parsed.length}`,
            clue,
            answer,
          });
        }
      }
    }

    if (parsed.length > 0) {
      setItems(parsed);
      setBatchModalOpen(false);
      setBatchText("");
      setSeedVersion((prev) => prev + 1);
      handleResetPlay();
    }
  };

  // Reset Play Mode
  const handleResetPlay = useCallback(() => {
    setUserInputs({});
    setActiveCell(null);
    setPlayTime(0);
    setIsTimerRunning(false);
    setShowWinModal(false);
    setActiveModalWord(null);
    setModalFeedback(null);
    setEndCheckFeedback(null);
    setPreviewWordAttempts({});
  }, []);

  // Timer Effect in Play Mode
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && activeTab === "play") {
      interval = setInterval(() => {
        setPlayTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, activeTab]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (activeTab === "play") {
      setIsTimerRunning(true);
      if (crosswordData.clues.across.length > 0) {
        const first = crosswordData.clues.across[0];
        setActiveCell({ row: first.row, col: first.col });
        setActiveDirection("ACROSS");
      }
    }
  }, [activeTab, crosswordData]);

  // Open Modal For Word
  const handleOpenWordModal = (word) => {
    if (!word) return;
    setActiveModalWord(word);
    setModalFeedback(null);

    const isAcross = word.direction === "ACROSS";
    const initialLetters = [];
    for (let i = 0; i < word.length; i++) {
      const r = isAcross ? word.row : word.row + i;
      const c = isAcross ? word.col + i : word.col;
      const existing = userInputs[`${r},${c}`] || "";
      initialLetters.push(existing);
    }
    setModalInputLetters(initialLetters);

    setTimeout(() => {
      const firstEmptyIdx = initialLetters.findIndex((l) => !l);
      const targetIdx = firstEmptyIdx !== -1 ? firstEmptyIdx : 0;
      modalInputRefs.current[targetIdx]?.focus();
    }, 100);
  };

  // Play Mode: Select Cell
  const handleSelectCell = (r, c) => {
    const cell = crosswordData.grid?.[r]?.[c];
    if (!cell || !cell.char) return;

    if (!isTimerRunning) setIsTimerRunning(true);

    let nextDir = activeDirection;
    if (activeCell && activeCell.row === r && activeCell.col === c) {
      if (cell.acrossWordId && cell.downWordId) {
        nextDir = activeDirection === "ACROSS" ? "DOWN" : "ACROSS";
        setActiveDirection(nextDir);
      }
    } else {
      if (cell.acrossWordId && !cell.downWordId) nextDir = "ACROSS";
      else if (!cell.acrossWordId && cell.downWordId) nextDir = "DOWN";
      setActiveDirection(nextDir);
      setActiveCell({ row: r, col: c });
    }

    const targetWordId = nextDir === "ACROSS" ? (cell.acrossWordId || cell.downWordId) : (cell.downWordId || cell.acrossWordId);
    const targetWord = crosswordData.placedWords.find((w) => w.id === targetWordId && w.direction === nextDir)
      || crosswordData.placedWords.find((w) => w.id === targetWordId);

    if (validationMode === "MODAL" && targetWord) {
      handleOpenWordModal(targetWord);
    }
  };

  // Play Mode: Select Clue
  const handleSelectClue = (clue) => {
    setActiveCell({ row: clue.row, col: clue.col });
    setActiveDirection(clue.direction);
    if (!isTimerRunning) setIsTimerRunning(true);

    const word = crosswordData.placedWords.find(
      (w) => w.number === clue.number && w.direction === clue.direction
    );

    if (validationMode === "MODAL" && word) {
      handleOpenWordModal(word);
    } else {
      const key = `${clue.row},${clue.col}`;
      gridInputRefs.current[key]?.focus();
    }
  };

  // Modal Letter Input
  const handleModalLetterChange = (idx, value) => {
    const char = value.slice(-1).toUpperCase().replace(/[^A-Z0-9]/g, "");
    setModalInputLetters((prev) => {
      const copy = [...prev];
      copy[idx] = char;
      return copy;
    });

    if (char && idx < activeModalWord.length - 1) {
      modalInputRefs.current[idx + 1]?.focus();
    }
  };

  const handleModalKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (!modalInputLetters[idx] && idx > 0) {
        modalInputRefs.current[idx - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && idx > 0) {
      modalInputRefs.current[idx - 1]?.focus();
    } else if (e.key === "ArrowRight" && idx < activeModalWord.length - 1) {
      modalInputRefs.current[idx + 1]?.focus();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleValidateModalAnswer();
    }
  };

  // SUBMIT & VALIDATE MODAL ANSWER
  const handleValidateModalAnswer = () => {
    if (!activeModalWord) return;

    const enteredWord = modalInputLetters.join("").toUpperCase();
    const correctWord = activeModalWord.answer.toUpperCase();

    if (enteredWord.length < activeModalWord.length) {
      setModalFeedback({
        type: "error",
        message: `Lengkapi semua ${activeModalWord.length} kotak huruf terlebih dahulu.`,
      });
      return;
    }

    const isCorrect = enteredWord === correctWord;

    if (isCorrect) {
      const isAcross = activeModalWord.direction === "ACROSS";
      const newInputs = { ...userInputs };
      for (let i = 0; i < activeModalWord.length; i++) {
        const r = isAcross ? activeModalWord.row : activeModalWord.row + i;
        const c = isAcross ? activeModalWord.col + i : activeModalWord.col;
        newInputs[`${r},${c}`] = correctWord[i];
      }
      setUserInputs(newInputs);

      setModalFeedback({
        type: "success",
        message: "Jawaban Tepat! Kotak huruf berhasil terisi di papan. 🎉",
      });

      checkOverallCompletion(newInputs);

      setTimeout(() => {
        setActiveModalWord(null);
        setModalFeedback(null);
      }, 900);
    } else {
      const wordKey = `${activeModalWord.direction}-${activeModalWord.number}`;
      const currentAttempts = (previewWordAttempts[wordKey] || 0) + 1;
      setPreviewWordAttempts((prev) => ({ ...prev, [wordKey]: currentAttempts }));

      const limitNum = maxRetryAttempts && parseInt(maxRetryAttempts) > 0 ? parseInt(maxRetryAttempts) : null;
      const isLimitReached = wrongAnswerBehavior === "RETRY" && limitNum && currentAttempts >= limitNum;

      if (wrongAnswerBehavior === "REVEAL" || isLimitReached) {
        const isAcross = activeModalWord.direction === "ACROSS";
        const newInputs = { ...userInputs };
        for (let i = 0; i < activeModalWord.length; i++) {
          const r = isAcross ? activeModalWord.row : activeModalWord.row + i;
          const c = isAcross ? activeModalWord.col + i : activeModalWord.col;
          newInputs[`${r},${c}`] = correctWord[i];
        }
        setUserInputs(newInputs);

        setModalFeedback({
          type: "revealed",
          message: isLimitReached
            ? `Batas ${limitNum}x percobaan salah tercapai! Kunci jawaban dibuka: "${correctWord}"`
            : `Jawaban salah! Kunci jawaban yang benar: "${correctWord}"`,
        });

        checkOverallCompletion(newInputs);

        setTimeout(() => {
          setActiveModalWord(null);
          setModalFeedback(null);
        }, 1800);
      } else {
        const remaining = limitNum ? limitNum - currentAttempts : null;
        setModalFeedback({
          type: "error",
          message:
            remaining !== null
              ? `Jawaban belum tepat! Tersisa ${remaining} kesempatan lagi.`
              : "Jawaban belum tepat! Silakan periksa kembali huruf yang Anda masukkan.",
        });
      }
    }
  };

  // CHECK ALL FOR "END" VALIDATION MODE
  const handleCheckAllAtEnd = () => {
    if (!crosswordData.grid) return;

    let cellCorrect = 0;
    let totalCells = 0;
    const wrongCells = [];

    for (let r = 0; r < crosswordData.rows; r++) {
      for (let c = 0; c < crosswordData.cols; c++) {
        const cell = crosswordData.grid[r][c];
        if (cell.char) {
          totalCells++;
          const userVal = (userInputs[`${r},${c}`] || "").toUpperCase();
          if (userVal === cell.char.toUpperCase()) {
            cellCorrect++;
          } else {
            wrongCells.push(`${r},${c}`);
          }
        }
      }
    }

    const isComplete = cellCorrect === totalCells;

    if (isComplete) {
      setIsTimerRunning(false);
      setShowWinModal(true);
      setEndCheckFeedback({ type: "success", message: "Semua jawaban benar sempurna! 🎉" });
    } else {
      if (wrongAnswerBehavior === "REVEAL") {
        const full = {};
        for (let r = 0; r < crosswordData.rows; r++) {
          for (let c = 0; c < crosswordData.cols; c++) {
            const cell = crosswordData.grid[r][c];
            if (cell.char) full[`${r},${c}`] = cell.char;
          }
        }
        setUserInputs(full);
        setEndCheckFeedback({
          type: "revealed",
          message: `Ada ${wrongCells.length} kotak yang salah. Seluruh kunci jawaban telah dibuka.`,
        });
      } else {
        setEndCheckFeedback({
          type: "error",
          message: `Masih ada ${wrongCells.length} kotak yang belum tepat. Silakan perbaiki kotak yang berwarna merah.`,
          wrongCells,
        });
      }
    }
  };

  const checkOverallCompletion = (currentGridInputs) => {
    let allDone = true;
    for (const word of crosswordData.placedWords) {
      const isAcross = word.direction === "ACROSS";
      for (let i = 0; i < word.length; i++) {
        const r = isAcross ? word.row : word.row + i;
        const c = isAcross ? word.col + i : word.col;
        if ((currentGridInputs[`${r},${c}`] || "").toUpperCase() !== word.answer[i]) {
          allDone = false;
          break;
        }
      }
      if (!allDone) break;
    }
    if (allDone) {
      setIsTimerRunning(false);
      setTimeout(() => setShowWinModal(true), 1000);
    }
  };

  // Inline typing handler
  const handleCellKeyDown = (e, r, c) => {
    const cell = crosswordData.grid?.[r]?.[c];
    if (!cell || !cell.char) return;

    const key = e.key;

    if (key === "Backspace") {
      e.preventDefault();
      setUserInputs((prev) => {
        const next = { ...prev };
        delete next[`${r},${c}`];
        return next;
      });
      return;
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      moveFocus(r, c + 1, "ACROSS");
      return;
    }
    if (key === "ArrowLeft") {
      e.preventDefault();
      moveFocus(r, c - 1, "ACROSS");
      return;
    }
    if (key === "ArrowDown") {
      e.preventDefault();
      moveFocus(r + 1, c, "DOWN");
      return;
    }
    if (key === "ArrowUp") {
      e.preventDefault();
      moveFocus(r - 1, c, "DOWN");
      return;
    }
    if (key === " ") {
      e.preventDefault();
      setActiveDirection((prev) => (prev === "ACROSS" ? "DOWN" : "ACROSS"));
      return;
    }

    if (/^[a-zA-Z0-9]$/.test(key)) {
      e.preventDefault();
      const upper = key.toUpperCase();
      setUserInputs((prev) => ({ ...prev, [`${r},${c}`]: upper }));

      const nextR = activeDirection === "DOWN" ? r + 1 : r;
      const nextC = activeDirection === "ACROSS" ? c + 1 : c;
      const nextCell = crosswordData.grid?.[nextR]?.[nextC];

      if (nextCell && nextCell.char) {
        setActiveCell({ row: nextR, col: nextC });
        const nextKey = `${nextR},${nextC}`;
        gridInputRefs.current[nextKey]?.focus();
      }
    }
  };

  const moveFocus = (r, c, direction) => {
    if (r >= 0 && r < crosswordData.rows && c >= 0 && c < crosswordData.cols) {
      if (crosswordData.grid[r][c]?.char) {
        setActiveCell({ row: r, col: c });
        if (direction) setActiveDirection(direction);
        const nextKey = `${r},${c}`;
        gridInputRefs.current[nextKey]?.focus();
      }
    }
  };

  // Evaluation: Correct vs Wrong Words Count
  const { correctCount, wrongCount, totalQuestions } = useMemo(() => {
    if (!crosswordData.placedWords) return { correctCount: 0, wrongCount: 0, totalQuestions: 0 };

    let correct = 0;
    const total = crosswordData.placedWords.length;

    for (const word of crosswordData.placedWords) {
      const isAcross = word.direction === "ACROSS";

      let isWordCorrect = true;
      for (let i = 0; i < word.length; i++) {
        const r = isAcross ? word.row : word.row + i;
        const c = isAcross ? word.col + i : word.col;
        const key = `${r},${c}`;
        const userChar = (userInputs[key] || "").toUpperCase();
        if (userChar !== word.answer[i]) {
          isWordCorrect = false;
          break;
        }
      }

      if (isWordCorrect) {
        correct++;
      }
    }

    return {
      correctCount: correct,
      wrongCount: total - correct,
      totalQuestions: total,
    };
  }, [userInputs, crosswordData]);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header Card with All Navigation Tabs */}
      <div className="bg-white/80 dark:bg-[#0d1c16]/90 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold text-primary">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Penugasan Teka-Teki Silang (TTS)</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black font-display text-gray-900 dark:text-white tracking-tight">
              {activeTab === "list"
                ? "Daftar Penugasan TTS"
                : title
                ? title
                : "TTS Builder"}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-2xl">
              {activeTab === "list"
                ? "Kelola, edit, dan bagikan seluruh penugasan teka-teki silang yang telah dibuat."
                : "Buat penugasan interaktif TTS dengan pengaturan validasi modal atau periksa akhir. Sistem otomatis menata posisi mendatar & menurun."}
            </p>
          </div>

          {/* Action Tabs & Primary Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Switchers */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
              <button
                onClick={() => setActiveTab("list")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "list"
                    ? "bg-white dark:bg-primary text-gray-900 dark:text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Daftar TTS ({savedList.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("builder")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "builder"
                    ? "bg-white dark:bg-primary text-gray-900 dark:text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Settings2 className="w-3.5 h-3.5" />
                <span>Form Soal</span>
              </button>

              <button
                onClick={() => setActiveTab("play")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "play"
                    ? "bg-primary text-white shadow-md shadow-primary/25"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Uji Coba Pengerjaan</span>
              </button>

              <button
                onClick={() => setActiveTab("export")}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === "export"
                    ? "bg-white dark:bg-primary text-gray-900 dark:text-white shadow-md"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Lembar</span>
              </button>
            </div>

            {/* Quick Button: Buat Baru or Simpan */}
            {activeTab === "list" ? (
              <button
                type="button"
                onClick={handleStartNewTTS}
                className="px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Penugasan Baru</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="px-6 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? "Menyimpan..." : "Simpan Penugasan"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Feedback Alert Toasts */}
        {saveSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-emerald-600 dark:text-primary"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </motion.div>
        )}
        {saveErrorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2.5 text-xs font-bold text-red-600 dark:text-red-400"
          >
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{saveErrorMsg}</span>
          </motion.div>
        )}
      </div>

      {/* TAB 0: DAFTAR TTS YANG SUDAH DIBUAT (LIST VIEW) */}
      {activeTab === "list" && (
        <div className="space-y-6">
          {/* Search & Top Action Bar */}
          <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari judul penugasan TTS..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-primary"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleStartNewTTS}
                className="w-full sm:w-auto px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Buat Penugasan Baru</span>
              </button>
            </div>
          </div>

          {/* List Cards Grid */}
          {filteredSavedList.length === 0 ? (
            <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-12 text-center space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-3xl mx-auto flex items-center justify-center">
                <Grid3X3 className="w-8 h-8 opacity-60" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Belum ada penugasan TTS yang dibuat
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                  Mulai buat teka-teki silang interaktif untuk mahasiswa / anggota Anda sekarang.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStartNewTTS}
                className="px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Penugasan Sekarang</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSavedList.map((puzzle) => {
                const isSelected = currentCrosswordId === puzzle.id;

                return (
                  <motion.div
                    key={puzzle.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border rounded-3xl p-6 shadow-sm flex flex-col justify-between transition-all hover:border-primary/50 group ${
                      isSelected
                        ? "border-primary/50 ring-2 ring-primary/20"
                        : "border-gray-200/80 dark:border-white/10"
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-primary/10 text-primary">
                          {puzzle.questionCount || puzzle.questions?.length || 0} Soal
                        </span>

                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(puzzle.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Title & Desc */}
                      <div>
                        <h3 className="font-bold text-base text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary transition-colors">
                          {puzzle.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 min-h-[32px]">
                          {puzzle.description || "Tidak ada deskripsi penugasan."}
                        </p>
                      </div>

                      {/* Settings tags */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
                          {puzzle.validationMode === "END" ? "Cek Di Akhir" : "Modal Per-Soal"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-gray-100 dark:bg-white/10 rounded-lg text-gray-600 dark:text-gray-300 font-medium">
                          {puzzle.wrongAnswerBehavior === "REVEAL"
                            ? "Buka Kunci (1x)"
                            : puzzle.maxRetryAttempts
                            ? `Bisa Diulang (Maks ${puzzle.maxRetryAttempts}x)`
                            : "Bisa Diulang (Bebas)"}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-5 mt-4 border-t border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleEditSavedTTS(puzzle.id)}
                          className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-primary/20 hover:text-primary rounded-xl text-gray-700 dark:text-gray-300 transition-colors text-xs font-bold flex items-center gap-1"
                          title="Edit Form Soal"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handlePlaySavedTTS(puzzle.id)}
                          className="p-2 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl transition-all text-xs font-bold flex items-center gap-1"
                          title="Mainkan Uji Coba"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Uji</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(puzzle.id)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                          title="Salin Tautan Main"
                        >
                          {copiedId === puzzle.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Share2 className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleDeleteSavedTTS(puzzle.id, e)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                          title="Hapus Penugasan"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 1: FORM BUILDER & RULES SETTINGS */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Form Assignment Info & Questions List */}
          <div className="lg:col-span-6 space-y-6">
            {/* Assignment Metadata Card */}
            <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Detail Penugasan
              </h3>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Judul Penugasan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Penugasan Modul 1 - Istilah Energi & Transisi Bersih"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  Petunjuk / Instruksi Pengerjaan
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan petunjuk untuk anggota / mahasiswa dalam menyelesaikan TTS ini..."
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              {/* Total Soal */}
              <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-primary">Jumlah Soal</div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Total pertanyaan dibuat</div>
                  </div>
                  <div className="text-lg font-black font-mono text-primary">{items.length} Soal</div>
                </div>
              </div>
            </div>

            {/* PENGATURAN CARA PENGERJAAN & VALIDASI */}
            <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-primary" />
                Aturan Validasi & Cara Pengerjaan
              </h3>

              {/* Setting 1: Cara Pengerjaan & Validasi */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Metode Pengisian & Validasi Soal:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValidationMode("MODAL")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      validationMode === "MODAL"
                        ? "bg-primary/10 border-primary text-gray-900 dark:text-white shadow-sm ring-2 ring-primary/20"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary">Modal Pop-up Kotak</span>
                      {validationMode === "MODAL" && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Klik kotak memunculkan modal pertanyaan & kotak huruf untuk divalidasi langsung per-soal.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setValidationMode("END")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      validationMode === "END"
                        ? "bg-primary/10 border-primary text-gray-900 dark:text-white shadow-sm ring-2 ring-primary/20"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-primary">Isi Semua Dulu</span>
                      {validationMode === "END" && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Peserta mengisi seluruh papan TTS terlebih dahulu, lalu cek kebenaran sekaligus di akhir.
                    </p>
                  </button>
                </div>
              </div>

              {/* Setting 2: Perilaku Jika Salah */}
              <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-white/10">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  Perilaku Jika Jawaban Salah:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setWrongAnswerBehavior("RETRY")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      wrongAnswerBehavior === "RETRY"
                        ? "bg-emerald-500/10 border-emerald-500 text-gray-900 dark:text-white shadow-sm ring-2 ring-emerald-500/20"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Bisa Diulang</span>
                      {wrongAnswerBehavior === "RETRY" && <Check className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Jika salah, peserta diberitahu belum tepat dan dapat mencoba mengulang kembali.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWrongAnswerBehavior("REVEAL")}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      wrongAnswerBehavior === "REVEAL"
                        ? "bg-amber-500/10 border-amber-500 text-gray-900 dark:text-white shadow-sm ring-2 ring-amber-500/20"
                        : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">Langsung Buka Kunci</span>
                      {wrongAnswerBehavior === "REVEAL" && <Check className="w-4 h-4 text-amber-500" />}
                    </div>
                    <p className="text-[11px] leading-relaxed opacity-90">
                      Jika 1x salah, sistem langsung menampilkan dan mengisi kunci jawaban yang benar.
                    </p>
                  </button>
                </div>

                {/* Sub-setting: Batas Percobaan Salah jika Mode RETRY */}
                {wrongAnswerBehavior === "RETRY" && (
                  <div className="mt-3 p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div>
                        <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                          Batas Maksimal Percobaan per Soal:
                        </span>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Tentukan berapa kali peserta boleh mencoba salah sebelum kunci jawaban terbuka otomatis.
                        </p>
                      </div>
                      <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 shrink-0">
                        {!maxRetryAttempts || parseInt(maxRetryAttempts) <= 0
                          ? "Tak Terbatas (Bebas)"
                          : `Maksimal ${maxRetryAttempts}x Percobaan`}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setMaxRetryAttempts("")}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          !maxRetryAttempts || parseInt(maxRetryAttempts) <= 0
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-white dark:bg-[#0c1914] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-emerald-500"
                        }`}
                      >
                        Bebas (Tanpa Batas)
                      </button>

                      {[2, 3, 5].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setMaxRetryAttempts(String(preset))}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            maxRetryAttempts === String(preset)
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                              : "bg-white dark:bg-[#0c1914] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-emerald-500"
                          }`}
                        >
                          {preset}x Salah
                        </button>
                      ))}

                      {/* Manual input */}
                      <div className="flex items-center gap-1.5 pl-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Atau manual:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={maxRetryAttempts}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (!val) {
                              setMaxRetryAttempts("");
                            } else {
                              const num = parseInt(val);
                              if (!isNaN(num) && num >= 1 && num <= 50) {
                                setMaxRetryAttempts(String(num));
                              }
                            }
                          }}
                          placeholder="Jumlah"
                          className="w-16 px-2.5 py-1.5 text-xs font-bold text-center rounded-xl bg-white dark:bg-[#0c1914] border border-gray-300 dark:border-white/15 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">kali</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Questions List Card */}
            <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Daftar Soal Penugasan ({items.length})
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Masukkan pertanyaan dan kata kunci jawaban.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBatchModalOpen(true)}
                    className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 rounded-xl font-bold transition-all flex items-center gap-1.5"
                  >
                    <CornerDownLeft className="w-3.5 h-3.5 text-primary" />
                    <span>Paste Cepat</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs px-3.5 py-1.5 bg-primary hover:bg-emerald-600 text-white rounded-xl font-bold transition-all shadow-md shadow-primary/20 flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Soal</span>
                  </button>
                </div>
              </div>

              {/* Questions Cards */}
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                <AnimatePresence>
                  {items.map((item, index) => {
                    const cleanAns = sanitizeAnswer(item.answer);
                    const isPlaced = crosswordData.placedWords.some(
                      (w) => w.id === item.id || (w.answer === cleanAns && w.clue === item.clue)
                    );

                    return (
                      <motion.div
                        key={item.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`p-4 rounded-2xl border transition-all ${
                          isPlaced
                            ? "bg-gray-50/70 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 hover:border-primary/40"
                            : "bg-amber-500/5 border-amber-500/30 dark:border-amber-500/20"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary font-mono text-xs font-black flex items-center justify-center">
                              {index + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                              Pertanyaan #{index + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {isPlaced ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Terpasang di Grid</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Belum Intersect</span>
                              </span>
                            )}

                            {items.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="w-7 h-7 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Clue Input */}
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={item.clue}
                            onChange={(e) => handleUpdateItem(index, "clue", e.target.value)}
                            placeholder="Tuliskan pertanyaan / petunjuk soal..."
                            className="w-full px-3.5 py-2.5 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                          />

                          {/* Answer Input */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={item.answer}
                                onChange={(e) => handleUpdateItem(index, "answer", e.target.value)}
                                placeholder="JAWABAN KATA"
                                className="w-full px-3.5 py-2 uppercase tracking-widest font-mono font-bold bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-emerald-600 dark:text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                              />
                            </div>
                            <span className="text-[11px] font-mono font-bold px-2.5 py-2 bg-gray-100 dark:bg-white/10 rounded-xl text-gray-500 dark:text-gray-400 shrink-0">
                              {cleanAns.length} Huruf
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* Add New Button */}
              <button
                type="button"
                onClick={handleAddItem}
                className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-white/15 hover:border-primary text-gray-600 dark:text-gray-300 hover:text-primary rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Pertanyaan Baru</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live Grid Layout Visualizer */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm sticky top-6 space-y-5">
              {/* Header & Controls */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Grid3X3 className="w-4 h-4 text-primary" />
                    Penataan Otomatis (Auto-Layout)
                  </h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    Grid otomatis mendatar & menurun diperbarui real-time.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(0.7, prev - 0.1))}
                    className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-xl text-gray-700 dark:text-gray-300 transition-colors"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(1.4, prev + 0.1))}
                    className="p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 rounded-xl text-gray-700 dark:text-gray-300 transition-colors"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Shuffle className={`w-3.5 h-3.5 ${isGenerating ? "animate-spin" : ""}`} />
                    <span>Tata Ulang (Acak)</span>
                  </button>
                </div>
              </div>

              {/* Grid Statistics */}
              <div className="grid grid-cols-3 gap-2.5 p-3 bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 rounded-2xl text-center">
                <div>
                  <div className="text-base md:text-lg font-black font-mono text-gray-900 dark:text-white">
                    {crosswordData.placedWords.length} / {items.length}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Kata Pasang</div>
                </div>
                <div>
                  <div className="text-base md:text-lg font-black font-mono text-primary">
                    {crosswordData.rows}×{crosswordData.cols}
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Dimensi</div>
                </div>
                <div>
                  <div className="text-base md:text-lg font-black font-mono text-emerald-500">
                    {crosswordData.stats.totalIntersections} Titik
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Perpotongan</div>
                </div>
              </div>

              {/* Unplaced words notice */}
              {crosswordData.unplacedWords.length > 0 && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-xs text-amber-700 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{crosswordData.unplacedWords.length} kata belum berpotongan:</span>{" "}
                    {crosswordData.unplacedWords.map((w) => w.answer).join(", ")}.
                    <p className="mt-1 text-[11px] opacity-80">
                      Tekan tombol <b>Tata Ulang (Acak)</b> atau sesuaikan kata agar saling terhubung.
                    </p>
                  </div>
                </div>
              )}

              {/* Crossword Interactive Canvas Box */}
              <div className="w-full bg-slate-900 rounded-2xl p-6 border border-white/10 overflow-auto flex items-center justify-center min-h-[380px] shadow-inner relative">
                <div
                  className="transition-transform duration-200 origin-center"
                  style={{ transform: `scale(${zoomLevel})` }}
                >
                  {crosswordData.rows === 0 ? (
                    <div className="text-center text-gray-400 space-y-2">
                      <Grid3X3 className="w-10 h-10 mx-auto text-gray-600 animate-pulse" />
                      <p className="text-xs">Isi pertanyaan dan kata jawaban untuk membentuk grid TTS</p>
                    </div>
                  ) : (
                    <div
                      className="grid gap-1 select-none"
                      style={{
                        gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(36px, 38px))`,
                        gridTemplateRows: `repeat(${crosswordData.rows}, minmax(36px, 38px))`,
                      }}
                    >
                      {crosswordData.grid.map((row, r) =>
                        row.map((cell, c) => {
                          const isFilled = Boolean(cell.char);

                          return (
                            <div
                              key={`${r}-${c}`}
                              className={`relative w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                                isFilled
                                  ? "bg-slate-800 text-white border border-emerald-500/40 shadow-sm"
                                  : "opacity-0 pointer-events-none"
                              }`}
                            >
                              {cell.number && (
                                <span className="absolute top-0.5 left-1 text-[9px] font-mono font-black text-emerald-400 leading-none pointer-events-none">
                                  {cell.number}
                                </span>
                              )}

                              {isFilled && (
                                <span className="text-emerald-300 font-mono font-black text-sm">
                                  {cell.char}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Direct Save Button */}
              <button
                type="button"
                onClick={handleSaveToDatabase}
                disabled={isSaving}
                className="w-full py-3.5 bg-gradient-to-r from-primary to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-2xl text-xs font-bold tracking-wide shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isSaving ? "Menyimpan Penugasan..." : "Simpan Penugasan"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PLAY / TEST SOLVER MODE */}
      {activeTab === "play" && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-gray-100 dark:bg-white/10 rounded-2xl text-xs font-mono font-bold text-gray-900 dark:text-white">
                <Clock className="w-4 h-4 text-primary" />
                <span>Waktu: {formatTime(playTime)}</span>
              </div>

              {/* Status Benar vs Salah */}
              <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-xs font-mono font-bold text-emerald-600 dark:text-primary">
                <CheckCircle2 className="w-4 h-4" />
                <span>Benar: {correctCount} / {totalQuestions} Soal</span>
              </div>

              {wrongCount > 0 && (
                <div className="flex items-center gap-2 px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                  <span>Belum Terisi/Tepat: {wrongCount}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetPlay}
                className="px-3.5 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>

              {validationMode === "END" && (
                <button
                  type="button"
                  onClick={handleCheckAllAtEnd}
                  className="px-5 py-2 bg-primary hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Cek Semua Jawaban</span>
                </button>
              )}
            </div>
          </div>

          {endCheckFeedback && (
            <div
              className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                endCheckFeedback.type === "success"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-primary"
                  : endCheckFeedback.type === "revealed"
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                  : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
              }`}
            >
              {endCheckFeedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{endCheckFeedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Playable Grid Canvas */}
            <div className="lg:col-span-7 bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center min-h-[480px]">
              <div className="mb-4 text-center text-xs text-gray-500 dark:text-gray-400">
                {validationMode === "MODAL"
                  ? "👉 Klik pada kotak atau petunjuk di samping untuk membuka modal pertanyaan & mengisi kata."
                  : "Gunakan keyboard untuk mengisi huruf di grid, lalu klik tombol 'Cek Semua Jawaban'."}
              </div>

              <div className="p-4 bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-auto max-w-full">
                <div
                  className="grid gap-1.5 select-none"
                  style={{
                    gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(40px, 44px))`,
                    gridTemplateRows: `repeat(${crosswordData.rows}, minmax(40px, 44px))`,
                  }}
                >
                  {crosswordData.grid.map((row, r) =>
                    row.map((cell, c) => {
                      const isFilled = Boolean(cell.char);
                      const key = `${r},${c}`;
                      const isSelected = activeCell && activeCell.row === r && activeCell.col === c;

                      const userChar = userInputs[key] || "";
                      const isWrong = endCheckFeedback?.wrongCells?.includes(key);

                      if (!isFilled) {
                        return (
                          <div
                            key={key}
                            className="w-10 h-10 md:w-11 md:h-11 opacity-0 pointer-events-none"
                          />
                        );
                      }

                      return (
                        <div
                          key={key}
                          onClick={() => handleSelectCell(r, c)}
                          className={`relative w-10 h-10 md:w-11 md:h-11 rounded-xl flex items-center justify-center font-mono font-black text-base cursor-pointer transition-all ${
                            isSelected
                              ? "bg-primary text-white ring-4 ring-primary/40 z-20 shadow-lg scale-105"
                              : userChar
                              ? "bg-slate-700 text-emerald-300 border border-emerald-500/50"
                              : "bg-slate-800 text-gray-200 border border-white/15 hover:bg-slate-700 hover:border-primary/50"
                          } ${isWrong ? "ring-2 ring-red-500 bg-red-950/50 text-red-200" : ""}`}
                        >
                          {cell.number && (
                            <span
                              className={`absolute top-0.5 left-1 text-[10px] font-mono font-black leading-none pointer-events-none ${
                                isSelected ? "text-white" : "text-emerald-400"
                              }`}
                            >
                              {cell.number}
                            </span>
                          )}

                          {validationMode === "END" && (
                            <input
                              ref={(el) => (gridInputRefs.current[key] = el)}
                              type="text"
                              maxLength={1}
                              value={userChar}
                              onFocus={() => handleSelectCell(r, c)}
                              onKeyDown={(e) => handleCellKeyDown(e, r, c)}
                              onChange={() => {}}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full text-center"
                            />
                          )}

                          <span>{userChar}</span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Clues List */}
            <div className="lg:col-span-5 space-y-6">
              {/* Mendatar (Across) */}
              <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Mendatar ({crosswordData.clues.across.length})
                </h3>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {crosswordData.clues.across.map((clue) => {
                    const word = crosswordData.placedWords.find(
                      (w) => w.number === clue.number && w.direction === "ACROSS"
                    );

                    let isSolved = true;
                    if (word) {
                      for (let i = 0; i < word.length; i++) {
                        const key = `${word.row},${word.col + i}`;
                        if ((userInputs[key] || "").toUpperCase() !== word.answer[i]) {
                          isSolved = false;
                          break;
                        }
                      }
                    }

                    return (
                      <button
                        key={`across_${clue.number}`}
                        type="button"
                        onClick={() => handleSelectClue(clue)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                          isSolved
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            isSolved
                              ? "bg-emerald-500 text-white"
                              : "bg-primary/20 text-primary"
                          }`}
                        >
                          {clue.number}
                        </span>
                        <div className="flex-1">
                          <p>{clue.clue}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({clue.length} huruf)
                            </span>
                            {isSolved && (
                              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Terisi Benar
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Menurun (Down) */}
              <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-emerald-500 flex items-center gap-2">
                  <CornerDownLeft className="w-4 h-4" />
                  Menurun ({crosswordData.clues.down.length})
                </h3>

                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                  {crosswordData.clues.down.map((clue) => {
                    const word = crosswordData.placedWords.find(
                      (w) => w.number === clue.number && w.direction === "DOWN"
                    );

                    let isSolved = true;
                    if (word) {
                      for (let i = 0; i < word.length; i++) {
                        const key = `${word.row + i},${word.col}`;
                        if ((userInputs[key] || "").toUpperCase() !== word.answer[i]) {
                          isSolved = false;
                          break;
                        }
                      }
                    }

                    return (
                      <button
                        key={`down_${clue.number}`}
                        type="button"
                        onClick={() => handleSelectClue(clue)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start gap-2.5 ${
                          isSolved
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                            : "bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        <span
                          className={`w-5 h-5 rounded font-mono font-bold text-[11px] flex items-center justify-center shrink-0 ${
                            isSolved
                              ? "bg-emerald-500 text-white"
                              : "bg-emerald-500/20 text-emerald-500"
                          }`}
                        >
                          {clue.number}
                        </span>
                        <div className="flex-1">
                          <p>{clue.clue}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({clue.length} huruf)
                            </span>
                            {isSolved && (
                              <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Terisi Benar
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRINT & EXPORT SHEET */}
      {activeTab === "export" && (
        <div className="space-y-6">
          <div className="bg-white/80 dark:bg-[#0d1c16]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                Lembar Penugasan Siap Cetak (Print Sheet)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cetak lembar tugas TTS offline untuk dikerjakan mahasiswa/anggota di kelas atau event.
              </p>
            </div>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Lembar Tugas</span>
            </button>
          </div>

          {/* Printable Layout Container */}
          <div className="bg-white text-black p-8 md:p-12 rounded-3xl shadow-xl border border-gray-200 max-w-4xl mx-auto print:p-0 print:shadow-none print:border-none print:max-w-full">
            <div className="border-b-2 border-black pb-4 mb-6 text-center">
              <div className="text-xs uppercase font-bold tracking-widest text-emerald-700">
                LEMBAR PENUGASAN SRE UPN “VETERAN” JAWA TIMUR
              </div>
              <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-1">{title || "Teka-Teki Silang"}</h1>
              {description && <p className="text-xs text-gray-600 mt-1 max-w-xl mx-auto">{description}</p>}
              <div className="mt-2 text-xs font-bold text-gray-700">
                Total Soal: {items.length} Pertanyaan
              </div>
            </div>

            {/* Grid Print View */}
            <div className="flex justify-center my-6 overflow-x-auto max-w-full">
              <div
                className="grid gap-0 border-2 border-black"
                style={{
                  gridTemplateColumns: `repeat(${crosswordData.cols}, 30px)`,
                  gridTemplateRows: `repeat(${crosswordData.rows}, 30px)`,
                }}
              >
                {crosswordData.grid.map((row, r) =>
                  row.map((cell, c) => {
                    const isFilled = Boolean(cell.char);

                    if (!isFilled) {
                      return <div key={`${r}-${c}`} className="w-[30px] h-[30px] bg-black" />;
                    }

                    return (
                      <div
                        key={`${r}-${c}`}
                        className="relative w-[30px] h-[30px] bg-white border border-black flex items-center justify-center font-bold text-xs"
                      >
                        {cell.number && (
                          <span className="absolute top-0.5 left-0.5 text-[8px] font-mono font-bold leading-none">
                            {cell.number}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Clues */}
            <div className="grid grid-cols-2 gap-8 mt-8 border-t border-gray-300 pt-6">
              <div>
                <h3 className="font-black text-sm uppercase tracking-wider mb-3 border-b border-black pb-1">
                  Mendatar (Across)
                </h3>
                <div className="space-y-1.5 text-xs">
                  {crosswordData.clues.across.map((clue) => (
                    <div key={`p_across_${clue.number}`} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-bold min-w-[20px]">{clue.number}.</span>
                      <span>
                        {clue.clue} <span className="font-mono text-gray-500">({clue.length} huruf)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-black text-sm uppercase tracking-wider mb-3 border-b border-black pb-1">
                  Menurun (Down)
                </h3>
                <div className="space-y-1.5 text-xs">
                  {crosswordData.clues.down.map((clue) => (
                    <div key={`p_down_${clue.number}`} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-bold min-w-[20px]">{clue.number}.</span>
                      <span>
                        {clue.clue} <span className="font-mono text-gray-500">({clue.length} huruf)</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POP-UP MODAL INPUT SESUAI JUMLAH KOTAK HURUF & PERTANYAAN */}
      <AnimatePresence>
        {activeModalWord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="bg-white dark:bg-[#0b1712] border-2 border-primary/40 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl space-y-6 relative overflow-hidden"
            >
              {/* Header Modal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full font-mono text-xs font-black">
                    #{activeModalWord.number} {activeModalWord.direction === "ACROSS" ? "MENDATAR" : "MENURUN"}
                  </span>
                  <span className="text-xs font-mono font-bold text-gray-500 dark:text-gray-400">
                    {activeModalWord.length} Kotak Huruf
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveModalWord(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Teks Pertanyaan */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl">
                <div className="text-[10px] uppercase font-bold text-primary mb-1">Pertanyaan / Petunjuk:</div>
                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white leading-relaxed">
                  {activeModalWord.clue}
                </p>
              </div>

              {/* KOTAK-KOTAK HURUF SESUAI JUMLAH KARAKTER */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-gray-600 dark:text-gray-300 text-center">
                  Masukkan {activeModalWord.length} Huruf Jawaban:
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 py-2">
                  {Array.from({ length: activeModalWord.length }).map((_, idx) => {
                    const char = modalInputLetters[idx] || "";

                    return (
                      <div key={`letter_box_${idx}`} className="relative">
                        <input
                          ref={(el) => (modalInputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={char}
                          onChange={(e) => handleModalLetterChange(idx, e.target.value)}
                          onKeyDown={(e) => handleModalKeyDown(e, idx)}
                          className="w-12 h-14 md:w-14 md:h-16 text-center text-xl md:text-2xl font-mono font-black uppercase bg-gray-50 dark:bg-black/40 border-2 border-gray-300 dark:border-white/20 focus:border-primary dark:focus:border-primary rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary/20 transition-all shadow-sm"
                        />
                        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[9px] font-mono text-gray-400">
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Alert di Modal */}
              {modalFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
                    modalFeedback.type === "success"
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-primary"
                      : modalFeedback.type === "revealed"
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400"
                      : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400"
                  }`}
                >
                  {modalFeedback.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{modalFeedback.message}</span>
                </motion.div>
              )}

              {/* Tombol Periksa Jawaban */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalWord(null)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-2xl text-xs font-bold transition-all"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleValidateModalAnswer}
                  className="flex-1 py-3 bg-primary hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/25 flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Validasi Jawaban</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Batch Import Modal */}
      <AnimatePresence>
        {batchModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0d1c16] border border-gray-200 dark:border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <CornerDownLeft className="w-5 h-5 text-primary" />
                  Paste Cepat Banyak Soal
                </h3>
                <button
                  onClick={() => setBatchModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-500"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                Format: <code>Pertanyaan : Jawaban</code> (1 baris per pertanyaan).
              </p>

              <textarea
                rows={8}
                value={batchText}
                onChange={(e) => setBatchText(e.target.value)}
                placeholder={"Energi sinar matahari : SURYA\nPembangkit listrik tenaga air : AIR\nBahan bakar nabati tumbuhan : BIODIESEL"}
                className="w-full p-3.5 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-2xl text-xs font-mono text-gray-800 dark:text-gray-200 focus:outline-none focus:border-primary resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleBatchImport}
                  className="px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary/25"
                >
                  Terapkan Soal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory Celebration Modal */}
      <AnimatePresence>
        {showWinModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: 20 }}
              className="bg-white dark:bg-[#0b1712] border-2 border-primary rounded-3xl p-8 max-w-md w-full text-center shadow-2xl space-y-6 relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-primary/20 text-primary rounded-3xl mx-auto flex items-center justify-center">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-black font-display text-gray-900 dark:text-white">
                  Luar Biasa! 🎉
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Seluruh teka-teki silang penugasan berhasil diselesaikan dengan benar!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-center">
                <div>
                  <div className="text-lg font-black font-mono text-primary">{formatTime(playTime)}</div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Waktu Tempuh</div>
                </div>
                <div>
                  <div className="text-lg font-black font-mono text-emerald-500">
                    {correctCount} / {totalQuestions} Soal
                  </div>
                  <div className="text-[10px] font-bold uppercase text-gray-500">Jawaban Benar</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowWinModal(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white rounded-2xl text-xs font-bold transition-all"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowWinModal(false);
                    handleResetPlay();
                  }}
                  className="flex-1 py-3 bg-primary hover:bg-emerald-600 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-primary/25"
                >
                  Uji Lagi
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
