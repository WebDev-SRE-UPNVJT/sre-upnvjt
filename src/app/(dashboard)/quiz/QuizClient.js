"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, Target, FileText, ChevronLeft, Award, HelpCircle,
  Clock, CheckSquare, Settings, Check, UserCheck, Eye, EyeOff,
  FileSpreadsheet, Download, Filter, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  createQuiz, updateQuiz, deleteQuiz,
  createQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
  gradeQuizSubmission,
} from "@/app/actions/quizActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";

const EMPTY_QUIZ = {
  title: "", description: "", timeLimitMinutes: "",
  passingScore: "70", rewardXp: "20", isPublished: false,
};

const EMPTY_QUESTION = {
  type: "MULTIPLE_CHOICE", question: "", points: "10",
  options: [{ id: "A", text: "" }, { id: "B", text: "" }],
  correctOptionId: "A",
};

function CustomSelect({ value, onChange, options, icon: Icon, placeholder = "Pilih..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 px-3.5 bg-white dark:bg-[#0d1c16] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm"
      >
        {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        <span className="truncate max-w-[170px]">{selectedOption?.label || placeholder}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full mt-1.5 z-40 w-60 py-1.5 bg-white dark:bg-[#0b1712] border border-gray-200 dark:border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
            >
              {options.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    value === opt.value
                      ? "bg-primary/15 text-primary dark:text-primary-light font-bold"
                      : "text-gray-700 dark:text-white/80 hover:bg-gray-100 dark:hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function QuizClient({ initialQuizzes, initialSubmissions, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  // View state: "list" | "questions"
  const [activeTab, setActiveTab] = useState("quizzes"); // "quizzes" | "submissions"
  const [view, setView] = useState("list"); // "list" | "questions"
  const [activeQuiz, setActiveQuiz] = useState(null); // quiz with questions

  // Data state
  const [quizzes, setQuizzes] = useState(initialQuizzes || []);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState(initialSubmissions || []);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals state
  const [quizModal, setQuizModal] = useState(false);
  const [quizForm, setQuizForm] = useState(EMPTY_QUIZ);
  const [targetQuiz, setTargetQuiz] = useState(null);
  const [quizDelModal, setQuizDelModal] = useState(false);

  const [questionModal, setQuestionModal] = useState(false);
  const [questionForm, setQuestionForm] = useState(EMPTY_QUESTION);
  const [targetQuestion, setTargetQuestion] = useState(null);
  const [questionDelModal, setQuestionDelModal] = useState(false);

  const [gradeModal, setGradeModal] = useState(false);
  const [targetSubmission, setTargetSubmission] = useState(null);
  const [essayScoreInput, setEssayScoreInput] = useState("");

  const canCreate = hasAccess(user, "quiz", "create");
  const canUpdate = hasAccess(user, "quiz", "update");
  const canDelete = hasAccess(user, "quiz", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenQuizModal = (qz = null) => {
    setQuizForm(qz ? {
      title: qz.title,
      description: qz.description || "",
      timeLimitMinutes: qz.timeLimitMinutes?.toString() || "",
      passingScore: qz.passingScore?.toString() || "70",
      rewardXp: qz.rewardXp?.toString() || "20",
      isPublished: qz.isPublished,
    } : { ...EMPTY_QUIZ });
    setTargetQuiz(qz);
    setQuizModal(true);
  };

  const handleCloseQuizModal = () => {
    setQuizModal(false);
    setTimeout(() => { setQuizForm(EMPTY_QUIZ); setTargetQuiz(null); }, 300);
  };

  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetQuiz?.id);
    const payload = {
      ...quizForm,
      timeLimitMinutes: quizForm.timeLimitMinutes ? parseInt(quizForm.timeLimitMinutes) : null,
      passingScore: parseInt(quizForm.passingScore),
      rewardXp: parseInt(quizForm.rewardXp),
      isPublished: quizForm.isPublished,
      createdById: user.id,
    };

    const res = isEditing
      ? await updateQuiz(targetQuiz.id, payload)
      : await createQuiz(payload);

    if (res.success) {
      if (isEditing) {
        setQuizzes(quizzes.map(q => q.id === targetQuiz.id ? { ...res.quiz, questionCount: q.questionCount } : q));
        if (activeQuiz?.id === targetQuiz.id) {
          setActiveQuiz(prev => ({ ...prev, ...res.quiz }));
        }
      } else {
        setQuizzes([res.quiz, ...quizzes]);
      }
      notify("success", isEditing ? "Kuis berhasil diperbarui!" : "Kuis baru dibuat!");
      handleCloseQuizModal();
    } else {
      notify("error", res.error || "Gagal menyimpan kuis");
    }
    setIsLoading(false);
  };

  const handleDeleteQuiz = async () => {
    if (!targetQuiz?.id) return;
    setIsLoading(true);
    const res = await deleteQuiz(targetQuiz.id);
    if (res.success) {
      setQuizzes(quizzes.filter(q => q.id !== targetQuiz.id));
      notify("success", "Kuis berhasil dihapus");
      setQuizDelModal(false);
      if (view === "questions") setView("list");
    } else {
      notify("error", res.error || "Gagal menghapus kuis");
    }
    setIsLoading(false);
  };

  const handleOpenQuestionManager = async (qz) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/quiz/${qz.id}`);
      const data = await res.json();
      setActiveQuiz(data);
      setQuestions(data.questions || []);
      setView("questions");
    } catch {
      setActiveQuiz({ ...qz, questions: [] });
      setQuestions([]);
      setView("questions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenQuestionModal = (q = null) => {
    if (q) {
      setQuestionForm({
        type: q.type,
        question: q.question,
        points: q.points?.toString() || "10",
        options: Array.isArray(q.options) ? q.options : [],
        correctOptionId: q.correctOptionId || "",
      });
    } else {
      setQuestionForm({ ...EMPTY_QUESTION });
    }
    setTargetQuestion(q);
    setQuestionModal(true);
  };

  const handleCloseQuestionModal = () => {
    setQuestionModal(false);
    setTimeout(() => { setQuestionForm(EMPTY_QUESTION); setTargetQuestion(null); }, 300);
  };

  const handleAddOption = () => {
    const nextChar = String.fromCharCode(65 + questionForm.options.length); // 'A', 'B', 'C', 'D'
    setQuestionForm(prev => ({
      ...prev,
      options: [...prev.options, { id: nextChar, text: "" }],
    }));
  };

  const handleRemoveOption = (id) => {
    setQuestionForm(prev => {
      const remaining = prev.options.filter(o => o.id !== id);
      // Re-index option IDs to A, B, C, D...
      const reindexed = remaining.map((o, idx) => ({ ...o, id: String.fromCharCode(65 + idx) }));
      return {
        ...prev,
        options: reindexed,
        correctOptionId: prev.correctOptionId === id && reindexed.length > 0 ? reindexed[0].id : prev.correctOptionId,
      };
    });
  };

  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!activeQuiz) return;
    setIsLoading(true);
    const isEditing = Boolean(targetQuestion?.id);

    const isChoiceType = ["MULTIPLE_CHOICE", "MULTIPLE_CHOICE_COMPLEX", "TRUE_FALSE"].includes(questionForm.type);

    const payload = {
      type: questionForm.type,
      question: questionForm.question,
      points: parseInt(questionForm.points) || 10,
      options: isChoiceType ? questionForm.options : [],
      correctOptionId: isChoiceType || questionForm.type === "SHORT_ANSWER" ? questionForm.correctOptionId : null,
    };

    const res = isEditing
      ? await updateQuizQuestion(targetQuestion.id, payload)
      : await createQuizQuestion(activeQuiz.id, payload);

    if (res.success) {
      if (isEditing) {
        setQuestions(questions.map(q => q.id === targetQuestion.id ? res.question : q));
      } else {
        setQuestions([...questions, res.question]);
        setQuizzes(quizzes.map(q => q.id === activeQuiz.id ? { ...q, questionCount: q.questionCount + 1 } : q));
      }
      notify("success", isEditing ? "Soal diperbarui!" : "Soal ditambahkan!");
      handleCloseQuestionModal();
    } else {
      notify("error", res.error || "Gagal menyimpan soal");
    }
    setIsLoading(false);
  };

  const handleDeleteQuestion = async () => {
    if (!targetQuestion?.id || !activeQuiz) return;
    setIsLoading(true);
    const res = await deleteQuizQuestion(targetQuestion.id, activeQuiz.id);
    if (res.success) {
      const remaining = questions
        .filter(q => q.id !== targetQuestion.id)
        .map((q, i) => ({ ...q, order: i + 1 }));
      setQuestions(remaining);
      setQuizzes(quizzes.map(q => q.id === activeQuiz.id ? { ...q, questionCount: Math.max(0, q.questionCount - 1) } : q));
      notify("success", "Soal dihapus");
      setQuestionDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus soal");
    }
    setIsLoading(false);
  };

  const handleOpenGradeModal = async (sub) => {
    setTargetSubmission(sub);
    setEssayScoreInput(sub.essayScore?.toString() || "");
    setGradeModal(true);

    // Ensure full questions data with questions array is loaded
    if (sub.quizId) {
      try {
        const res = await fetch(`/api/quiz/${sub.quizId}`);
        const fullQuiz = await res.json();
        if (fullQuiz && fullQuiz.questions) {
          setTargetSubmission(prev => prev ? {
            ...prev,
            quiz: { ...prev.quiz, ...fullQuiz, questions: fullQuiz.questions }
          } : prev);
        }
      } catch (err) {
        console.error("Error fetching quiz questions for modal:", err);
      }
    }
  };

  const handleGradeSubmission = async (e) => {
    e.preventDefault();
    if (!targetSubmission) return;
    setIsLoading(true);

    const res = await gradeQuizSubmission(targetSubmission.id, {
      essayScore: parseInt(essayScoreInput),
      gradedById: user.id,
    });

    if (res.success) {
      setSubmissions(submissions.map(s => s.id === targetSubmission.id ? {
        ...s,
        ...res.submission,
        gradedBy: { id: user.id, name: user.name },
      } : s));
      notify("success", "Nilai essay berhasil disimpan!");
      setGradeModal(false);
    } else {
      notify("error", res.error || "Gagal menilai essay");
    }
    setIsLoading(false);
  };

  const filteredQuizzes = quizzes.filter(q =>
    (q.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Quiz Submission Filter & Collapse state
  const [selectedQuizFilter, setSelectedQuizFilter] = useState("ALL");
  const [selectedQuizStatusFilter, setSelectedQuizStatusFilter] = useState("ALL");
  const [collapsedQuizzes, setCollapsedQuizzes] = useState({});

  const toggleQuizCollapse = (quizId) => {
    setCollapsedQuizzes(prev => ({ ...prev, [quizId]: !prev[quizId] }));
  };

  const exportQuizToExcel = async (qz, groupSubs) => {
    if (!groupSubs || groupSubs.length === 0) {
      notify("error", "Belum ada submisi untuk diexport");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPNVJT Portal";
      workbook.lastModifiedBy = "SRE Admin";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Hasil Kuis");

      // Title Banner (Row 1)
      sheet.mergeCells("A1:J1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `SRE UPNVJT - HASIL EVALUASI KUIS: ${(qz.title || "KUIS").toUpperCase()}`;
      titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 30;

      // Subtitle Info (Row 2)
      sheet.mergeCells("A2:J2");
      const subCell = sheet.getCell("A2");
      subCell.value = `Passing Score: ${qz.passingScore || 70} | Reward XP: +${qz.rewardXp || 20} XP | Total Submisi: ${groupSubs.length}`;
      subCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      subCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(2).height = 24;

      sheet.getRow(3).height = 10;

      // Table Headers (Row 4)
      const headers = [
        "No", "ID Submisi", "ID User", "Nama Anggota", "Waktu Submisi",
        "MCQ Score", "Essay Score", "Total Score", "Batas Lulus", "Status"
      ];

      const headerRow = sheet.getRow(4);
      headerRow.height = 26;

      headers.forEach((h, colIdx) => {
        const cell = headerRow.getCell(colIdx + 1);
        cell.value = h;
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "thin", color: { argb: "FFFFFFFF" } },
          bottom: { style: "medium", color: { argb: "FFFFFFFF" } },
          left: { style: "thin", color: { argb: "FFFFFFFF" } },
          right: { style: "thin", color: { argb: "FFFFFFFF" } },
        };
      });

      // Data Rows (Row 5+)
      groupSubs.forEach((s, idx) => {
        const rowNum = idx + 5;
        const row = sheet.getRow(rowNum);
        row.height = 22;

        const isPassed = s.isPassed;
        const statusText = isPassed === true ? "LULUS" : isPassed === false ? "GAGAL" : "BELUM DINILAI";

        const rowValues = [
          idx + 1,
          s.id,
          s.memberId,
          s.member?.name || `User ${s.memberId}`,
          s.submittedAt ? new Date(s.submittedAt).toLocaleString("id-ID") : "-",
          s.mcqScore !== null && s.mcqScore !== undefined ? s.mcqScore : "-",
          s.essayScore !== null && s.essayScore !== undefined ? s.essayScore : "Ungraded",
          s.totalScore !== null && s.totalScore !== undefined ? s.totalScore : "-",
          qz.passingScore || 70,
          statusText,
        ];

        rowValues.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = { vertical: "middle" };

          if (colIdx === 0 || colIdx === 1 || colIdx === 2 || colIdx === 4 || colIdx === 5 || colIdx === 6 || colIdx === 7 || colIdx === 8) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }

          if (colIdx === 9) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = { name: "Arial", size: 10, bold: true };
            if (isPassed === true) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
            } else if (isPassed === false) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB91C1C" } };
            } else {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB45309" } };
            }
          }

          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheet.columns = [
        { width: 6 },
        { width: 12 },
        { width: 10 },
        { width: 28 },
        { width: 22 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 14 },
        { width: 18 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (qz.title || "Kuis").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `Submisi_Kuis_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify("success", `File Excel (.xlsx) untuk kuis "${qz.title}" berhasil di-download!`);
    } catch (err) {
      notify("error", "Gagal meng-export Excel: " + err.message);
    }
  };

  const quizMap = React.useMemo(() => new Map(quizzes.map(q => [q.id, q])), [quizzes]);

  // Group submissions per quiz
  const quizGroups = React.useMemo(() => {
    const map = new Map();

    quizzes.forEach(q => {
      map.set(q.id, { quiz: q, submissions: [] });
    });

    submissions.forEach(sub => {
      const qId = sub.quizId;
      const qObj = sub.quiz || quizMap.get(qId);
      if (!map.has(qId)) {
        map.set(qId, { quiz: qObj || { id: qId, title: `Kuis #${qId}` }, submissions: [] });
      }
      map.get(qId).submissions.push(sub);
    });

    return Array.from(map.values()).filter(group => {
      if (selectedQuizFilter !== "ALL" && group.quiz.id.toString() !== selectedQuizFilter) {
        return false;
      }
      return true;
    });
  }, [quizzes, submissions, selectedQuizFilter, quizMap]);

  const filteredSubmissions = submissions.filter(s =>
    (s.member?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.quiz?.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Question manager view
  if (view === "questions" && activeQuiz) {
    return (
      <div className="w-full relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setView("list");
                setActiveQuiz(null);
                setQuestions([]);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 shadow-sm border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white transition-all text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="w-7 h-7 text-primary" />
                {activeQuiz.title}
              </h1>
              <p className="text-sm text-gray-500 dark:text-white/40 mt-1">
                Kelola daftar pertanyaan kuis.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canCreate && (
              <button
                onClick={() => handleOpenQuestionModal()}
                className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-2.5 rounded-xl font-bold hover:bg-primary-focus transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Soal
              </button>
            )}
          </div>
        </div>

        {/* Quiz Info Bar */}
        <div className="flex flex-wrap gap-4 mb-8 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-md">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
            <Clock className="w-4 h-4 text-primary" />
            <span>
              Waktu:{" "}
              <strong>
                {activeQuiz.timeLimitMinutes
                  ? `${activeQuiz.timeLimitMinutes} Menit`
                  : "Tanpa Batas"}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
            <CheckSquare className="w-4 h-4 text-primary" />
            <span>
              Kriteria Kelulusan: <strong>{activeQuiz.passingScore}%</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/70">
            <Award className="w-4 h-4 text-primary" />
            <span>
              XP Reward: <strong>{activeQuiz.rewardXp} XP</strong>
            </span>
          </div>
        </div>

        {/* Questions list */}
        {questions.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
            <HelpCircle className="w-12 h-12 text-gray-400 dark:text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              Belum ada pertanyaan
            </h3>
            <p className="text-gray-500 dark:text-white/40 text-sm">
              Tambahkan pertanyaan baru untuk memulai.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-6 backdrop-blur-md shadow-sm flex flex-col md:flex-row justify-between items-start gap-6 group hover:border-primary/20 transition-all duration-300"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5 mb-3">
                    <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                      SOAL {idx + 1}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        q.type === "MULTIPLE_CHOICE"
                          ? "bg-blue-500/15 text-blue-400 border-blue-500/25"
                          : q.type === "MULTIPLE_CHOICE_COMPLEX"
                            ? "bg-teal-500/15 text-teal-400 border-teal-500/25"
                            : q.type === "SHORT_ANSWER"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
                              : q.type === "TRUE_FALSE"
                                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
                                : "bg-purple-500/15 text-purple-400 border-purple-500/25"
                      }`}
                    >
                      {q.type === "MULTIPLE_CHOICE"
                        ? "Pilihan Ganda"
                        : q.type === "MULTIPLE_CHOICE_COMPLEX"
                          ? "Pilihan Ganda Kompleks"
                          : q.type === "SHORT_ANSWER"
                            ? "Jawaban Singkat"
                            : q.type === "TRUE_FALSE"
                              ? "Benar / Salah"
                              : "Essay"}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-white/30 font-medium">
                      {q.points} Poin
                    </span>
                  </div>
                  <p className="text-gray-900 dark:text-white font-medium text-sm leading-relaxed whitespace-pre-wrap">
                    {q.question}
                  </p>

                  {/* SHORT_ANSWER preview */}
                  {q.type === "SHORT_ANSWER" && q.correctOptionId && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500">
                      Kunci Jawaban Singkat:{" "}
                      <span className="font-bold text-amber-400">
                        {q.correctOptionId}
                      </span>
                    </div>
                  )}

                  {/* Options Preview */}
                  {(() => {
                    const normalizedType = (q.type || "").toUpperCase();
                    const isOptionType = [
                      "MULTIPLE_CHOICE",
                      "MULTIPLE_CHOICE_COMPLEX",
                      "TRUE_FALSE",
                    ].includes(normalizedType);
                    if (
                      !isOptionType ||
                      !Array.isArray(q.options) ||
                      q.options.length === 0
                    )
                      return null;

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        {q.options.map((opt) => {
                          const correctArray = (q.correctOptionId || "")
                            .split(",")
                            .map((s) => s.trim());
                          const isCorrect =
                            normalizedType === "MULTIPLE_CHOICE_COMPLEX"
                              ? correctArray.includes(opt.id)
                              : opt.id === q.correctOptionId;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-xs font-medium transition-all ${
                                isCorrect
                                  ? "bg-green-500/10 border-green-500/30 text-green-400 font-bold"
                                  : "bg-gray-50/50 dark:bg-white/[0.01] border-gray-200 dark:border-white/5 text-gray-500 dark:text-white/50"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] uppercase font-bold shrink-0 ${
                                  isCorrect
                                    ? "bg-green-500 text-gray-900"
                                    : "bg-gray-200 dark:bg-white/10"
                                }`}
                              >
                                {isCorrect ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  opt.id
                                )}
                              </span>
                              <span className="truncate">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex gap-2 shrink-0 self-end md:self-start">
                  {canUpdate && (
                    <button
                      onClick={() => handleOpenQuestionModal(q)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 flex items-center justify-center border border-transparent hover:border-gray-200 dark:border-white/10 transition-all"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        setTargetQuestion(q);
                        setQuestionDelModal(true);
                      }}
                      className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 flex items-center justify-center border border-transparent hover:border-red-500/20 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Question Add/Edit Modal */}
        <AnimatePresence>
          {questionModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleCloseQuestionModal}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    {targetQuestion ? "Edit Pertanyaan" : "Pertanyaan Baru"}
                  </h2>
                  <button
                    onClick={handleCloseQuestionModal}
                    className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                  <form
                    id="questionForm"
                    onSubmit={handleSaveQuestion}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                          Tipe Soal
                        </label>
                        <div className="relative">
                          <select
                            value={questionForm.type}
                            onChange={(e) => {
                              const newType = e.target.value;
                              let newOptions = questionForm.options;
                              if (newType === "TRUE_FALSE") {
                                newOptions = [
                                  { id: "A", text: "Benar" },
                                  { id: "B", text: "Salah" },
                                ];
                              } else if (
                                (newType === "MULTIPLE_CHOICE" ||
                                  newType === "MULTIPLE_CHOICE_COMPLEX") &&
                                newOptions.length === 0
                              ) {
                                newOptions = [
                                  { id: "A", text: "" },
                                  { id: "B", text: "" },
                                ];
                              }
                              setQuestionForm((p) => ({
                                ...p,
                                type: newType,
                                options: newOptions,
                              }));
                            }}
                            className="w-full h-12 px-4 bg-white dark:bg-[#07130e] border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 text-sm font-semibold cursor-pointer appearance-none pr-10"
                          >
                            <option
                              value="MULTIPLE_CHOICE"
                              className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white"
                            >
                              Pilihan Ganda (Single Choice)
                            </option>
                            <option
                              value="MULTIPLE_CHOICE_COMPLEX"
                              className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white"
                            >
                              Pilihan Ganda Kompleks (Multi Select)
                            </option>
                            <option
                              value="SHORT_ANSWER"
                              className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white"
                            >
                              Jawaban Singkat (Short Answer)
                            </option>
                            <option
                              value="TRUE_FALSE"
                              className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white"
                            >
                              Benar / Salah (True or False)
                            </option>
                            <option
                              value="ESSAY"
                              className="bg-white dark:bg-[#0a1612] text-gray-900 dark:text-white"
                            >
                              Essay / Uraian
                            </option>
                          </select>
                          <ChevronDown className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                          Poin
                        </label>
                        <input
                          type="number"
                          required
                          min="1"
                          value={questionForm.points}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              points: e.target.value,
                            }))
                          }
                          className="w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none text-sm font-semibold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                        Pertanyaan
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={questionForm.question}
                        onChange={(e) =>
                          setQuestionForm((p) => ({
                            ...p,
                            question: e.target.value,
                          }))
                        }
                        className="w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none resize-none h-24 text-sm font-medium placeholder:text-gray-400 dark:placeholder:text-white/20"
                        placeholder="Tuliskan isi pertanyaan..."
                      />
                    </div>

                    {/* SHORT_ANSWER KUNCI JAWABAN */}
                    {questionForm.type === "SHORT_ANSWER" && (
                      <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                        <label className="block text-[11px] font-bold tracking-wider text-primary uppercase">
                          Kunci Jawaban Singkat (Auto-Graded)
                        </label>
                        <input
                          type="text"
                          required
                          value={questionForm.correctOptionId || ""}
                          onChange={(e) =>
                            setQuestionForm((p) => ({
                              ...p,
                              correctOptionId: e.target.value,
                            }))
                          }
                          className="w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none text-sm font-semibold"
                          placeholder="Masukkan kata kunci jawaban persis (misal: Fotosintesis)"
                        />
                        <p className="text-[11px] text-gray-500 dark:text-white/40">
                          Jawaban anggota yang cocok tanpa membedakan huruf
                          besar/kecil akan dinilai benar secara otomatis.
                        </p>
                      </div>
                    )}

                    {/* MULTIPLE CHOICE / MULTIPLE CHOICE COMPLEX / TRUE FALSE OPTIONS */}
                    {(questionForm.type === "MULTIPLE_CHOICE" ||
                      questionForm.type === "MULTIPLE_CHOICE_COMPLEX" ||
                      questionForm.type === "TRUE_FALSE") && (
                      <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                          <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase">
                            Pilihan Jawaban{" "}
                            {questionForm.type === "MULTIPLE_CHOICE_COMPLEX"
                              ? "(Centang semua jawaban benar)"
                              : "(Pilih 1 jawaban benar)"}
                          </label>
                          {questionForm.type !== "TRUE_FALSE" && (
                            <button
                              type="button"
                              onClick={handleAddOption}
                              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Tambah Pilihan
                            </button>
                          )}
                        </div>

                        <div className="space-y-3">
                          {questionForm.options.map((opt, oIdx) => {
                            const isComplex =
                              questionForm.type === "MULTIPLE_CHOICE_COMPLEX";
                            const selectedArray = (
                              questionForm.correctOptionId || ""
                            )
                              .split(",")
                              .map((s) => s.trim());
                            const isChecked = isComplex
                              ? selectedArray.includes(opt.id)
                              : questionForm.correctOptionId === opt.id;

                            const toggleComplexOption = (id) => {
                              let arr = (questionForm.correctOptionId || "")
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              if (arr.includes(id)) {
                                arr = arr.filter((x) => x !== id);
                              } else {
                                arr.push(id);
                              }
                              setQuestionForm((p) => ({
                                ...p,
                                correctOptionId: arr.join(","),
                              }));
                            };

                            return (
                              <div
                                key={opt.id}
                                className="flex gap-3 items-center"
                              >
                                <input
                                  type={isComplex ? "checkbox" : "radio"}
                                  name="correctOption"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isComplex) {
                                      toggleComplexOption(opt.id);
                                    } else {
                                      setQuestionForm((p) => ({
                                        ...p,
                                        correctOptionId: opt.id,
                                      }));
                                    }
                                  }}
                                  className="w-4 h-4 text-primary focus:ring-primary focus:ring-offset-0 accent-primary cursor-pointer shrink-0"
                                />
                                <input
                                  type="text"
                                  required
                                  readOnly={questionForm.type === "TRUE_FALSE"}
                                  value={opt.text}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setQuestionForm((p) => ({
                                      ...p,
                                      options: p.options.map((o) =>
                                        o.id === opt.id
                                          ? { ...o, text: val }
                                          : o,
                                      ),
                                    }));
                                  }}
                                  placeholder={`Pilihan ${String.fromCharCode(65 + oIdx)}...`}
                                  className="flex-1 h-11 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white focus:outline-none text-sm font-medium"
                                />
                                {questionForm.options.length > 2 &&
                                  questionForm.type !== "TRUE_FALSE" && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveOption(opt.id)}
                                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </form>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={handleCloseQuestionModal}
                    className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    form="questionForm"
                    disabled={isLoading}
                    className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      "Simpan"
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Question Delete Modal */}
        <AnimatePresence>
          {questionDelModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setQuestionDelModal(false)}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center"
              >
                <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Hapus Pertanyaan?
                </h3>
                <p className="text-xs text-gray-500 dark:text-white/40 mb-6">
                  Pertanyaan ini akan dihapus permanen dari kuis.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setQuestionDelModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleDeleteQuestion}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600"
                  >
                    Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Global Toast */}
        <Toast
          notification={notification}
          onClose={() => setNotification(null)}
        />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Target className="w-8 h-8 text-primary" />
            Quiz System
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola kuis berkala, pertanyaan pilihan ganda & essay, dan nilai submisi anggota.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={activeTab === "quizzes" ? "Cari kuis..." : "Cari nama / judul kuis..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          {activeTab === "quizzes" && canCreate && (
            <button
              onClick={() => handleOpenQuizModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Quiz</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-white/[0.03] p-1 rounded-2xl w-fit border border-gray-200 dark:border-white/10">
        {[
          { key: "quizzes", label: "Daftar Kuis", icon: Target },
          { key: "submissions", label: "Hasil Submisi", icon: UserCheck },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setSearchQuery(""); }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/40 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab: Quizzes */}
      {activeTab === "quizzes" && (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <tr>
                  {["Judul Kuis", "Jumlah Soal", "Durasi", "Kelulusan", "Reward XP", "Status", "Aksi"].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredQuizzes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                          <Target className="w-10 h-10" />
                          <p className="font-medium">Belum ada data kuis</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredQuizzes.map(qz => (
                    <tr key={qz.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all group">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => handleOpenQuestionManager(qz)}
                          className="font-bold text-gray-900 dark:text-white text-sm hover:text-primary transition-colors text-left block"
                        >
                          {qz.title}
                        </button>
                        {qz.description && (
                          <span className="text-xs text-gray-400 dark:text-white/30 line-clamp-1 mt-0.5 max-w-[280px]">
                            {qz.description}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/70">
                        {qz.questionCount || 0} Soal
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/60">
                        {qz.timeLimitMinutes ? `${qz.timeLimitMinutes} Menit` : "Tanpa Batas"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/60">
                        {qz.passingScore}%
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                          <Award className="w-3.5 h-3.5" /> +{qz.rewardXp} XP
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold border ${
                          qz.isPublished
                            ? "bg-green-500/15 text-green-400 border-green-500/25"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }`}>
                          {qz.isPublished ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          {qz.isPublished ? "Published" : "Draft"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenQuestionManager(qz)}
                            className="h-8 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all"
                          >
                            Kelola Soal
                          </button>
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenQuizModal(qz)}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-transparent hover:border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/70 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setTargetQuiz(qz); setQuizDelModal(true); }}
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-transparent hover:border-red-500/20 text-red-400 flex items-center justify-center transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Submissions */}
      {activeTab === "submissions" && (
        <div className="space-y-6">
          {/* Top Filters Bar */}
          <div className="p-4 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-white/50 uppercase">
                <Filter className="w-4 h-4 text-primary" />
                <span>Filter Kuis:</span>
              </div>
              <CustomSelect
                value={selectedQuizFilter}
                onChange={setSelectedQuizFilter}
                options={[
                  { value: "ALL", label: `Semua Kuis (${quizzes.length})` },
                  ...quizzes.map(q => ({ value: q.id.toString(), label: q.title })),
                ]}
                icon={Target}
              />

              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-white/50 uppercase ml-2">
                <span>Status Kelulusan:</span>
              </div>

              <CustomSelect
                value={selectedQuizStatusFilter}
                onChange={setSelectedQuizStatusFilter}
                options={[
                  { value: "ALL", label: "Semua Status" },
                  { value: "PASSED", label: "Lulus" },
                  { value: "FAILED", label: "Gagal" },
                  { value: "UNGRADED", label: "Perlu Penilaian Essay" },
                ]}
                icon={Filter}
              />
            </div>

            <div className="text-xs text-gray-500 dark:text-white/40 font-medium">
              Menampilkan {quizGroups.length} Kuis
            </div>
          </div>

          {/* Quiz Cards Grouped List */}
          {quizGroups.length === 0 ? (
            <div className="p-12 text-center bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl">
              <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Tidak ada data kuis ditemukan</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mt-1">Coba ganti filter kuis di atas.</p>
            </div>
          ) : (
            quizGroups.map(({ quiz: qz, submissions: groupSubs }) => {
              const isCollapsed = Boolean(collapsedQuizzes[qz.id]);

              // Filter groupSubs by status & searchQuery
              const filteredGroupSubs = groupSubs.filter(s => {
                const memberName = s.member?.name || `User ${s.memberId}`;
                const matchSearch = memberName.toLowerCase().includes(searchQuery.toLowerCase());
                if (!matchSearch) return false;

                if (selectedQuizStatusFilter === "PASSED") return s.isPassed === true;
                if (selectedQuizStatusFilter === "FAILED") return s.isPassed === false;
                if (selectedQuizStatusFilter === "UNGRADED") return s.essayScore === null;
                return true;
              });

              const totalCount = groupSubs.length;
              const passedCount = groupSubs.filter(s => s.isPassed === true).length;
              const failedCount = groupSubs.filter(s => s.isPassed === false).length;
              const ungradedCount = groupSubs.filter(s => s.essayScore === null).length;

              return (
                <div
                  key={qz.id}
                  className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg transition-all"
                >
                  {/* Quiz Group Header */}
                  <div className="p-5 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-200/50 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => toggleQuizCollapse(qz.id)}>
                      <button
                        type="button"
                        className="w-8 h-8 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>

                      <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                          <Target className="w-4 h-4 text-primary shrink-0" />
                          {qz.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-white/40 mt-0.5">
                          <span>Passing Score: <strong className="text-emerald-500">{qz.passingScore || 70}</strong></span>
                          <span>•</span>
                          <span>Reward XP: <strong className="text-amber-500">+{qz.rewardXp || 20} XP</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Stats & Actions */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/10">
                          Total: {totalCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                          Lulus: {passedCount}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          Gagal: {failedCount}
                        </span>
                        {ungradedCount > 0 && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            Need Grade: {ungradedCount}
                          </span>
                        )}
                      </div>

                      {/* Export Excel Button */}
                      <button
                        type="button"
                        onClick={() => exportQuizToExcel(qz, groupSubs)}
                        disabled={totalCount === 0}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm"
                      >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Export Excel</span>
                      </button>
                    </div>
                  </div>

                  {/* Submissions Table Inside Quiz Card */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto w-full">
                      <table className="w-full min-w-[900px] text-left">
                        <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
                          <tr>
                            {["No", "Nama Anggota", "Waktu Submisi", "MCQ Score", "Essay Score", "Total Score", "Status", "Aksi"].map(h => (
                              <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                          {filteredGroupSubs.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-xs text-gray-400 dark:text-white/30 font-medium">
                                Belum ada hasil submisi anggota untuk kuis ini.
                              </td>
                            </tr>
                          ) : (
                            filteredGroupSubs.map((sub, idx) => (
                              <tr key={sub.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                                <td className="px-6 py-4 text-xs font-bold text-gray-400">
                                  {idx + 1}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                  {sub.member?.name || `ID User: ${sub.memberId}`}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50">
                                  {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("id-ID") : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70 font-semibold">
                                  {sub.mcqScore !== null ? `${sub.mcqScore}` : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {sub.essayScore !== null ? (
                                    <span className="text-gray-900 dark:text-white font-semibold">{sub.essayScore}</span>
                                  ) : (
                                    <span className="text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-[10px] uppercase font-bold border border-amber-500/20">Ungraded</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-primary">
                                  {sub.totalScore !== null ? `${sub.totalScore}` : "—"}
                                </td>
                                <td className="px-6 py-4">
                                  {sub.isPassed !== null ? (
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                      sub.isPassed
                                        ? "bg-green-500/10 text-green-400 border-green-500/25"
                                        : "bg-red-500/10 text-red-400 border-red-500/25"
                                    }`}>
                                      {sub.isPassed ? "LULUS" : "GAGAL"}
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 text-xs font-semibold">Menunggu Penilaian</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {canUpdate ? (
                                    <button
                                      onClick={() => handleOpenGradeModal(sub)}
                                      className={`h-8 px-3 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        sub.essayScore === null
                                          ? "bg-primary text-[#050e0a] hover:bg-primary-focus shadow-md shadow-primary/20"
                                          : "bg-white/10 hover:bg-white/20 text-gray-700 dark:text-white border border-gray-200 dark:border-white/10"
                                      }`}
                                    >
                                      <UserCheck className="w-3.5 h-3.5" />
                                      {sub.essayScore === null ? "Tinjau & Beri Nilai" : "Edit Nilai Essay"}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-gray-400 dark:text-white/30">
                                      {sub.gradedBy ? `Dinilai oleh ${sub.gradedBy.name}` : "Selesai"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Quiz Add/Edit Modal */}
      <AnimatePresence>
        {quizModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseQuizModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  {targetQuiz ? "Edit Kuis" : "Kuis Baru"}
                </h2>
                <button onClick={handleCloseQuizModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="quizForm" onSubmit={handleSaveQuiz} className="space-y-5">
                  <InputField label="Judul Kuis *">
                    <input type="text" required value={quizForm.title}
                      onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))}
                      className={inputCls} placeholder="e.g. Kuis Kimia Dasar Modul 1" />
                  </InputField>

                  <InputField label="Deskripsi">
                    <textarea rows={3} value={quizForm.description}
                      onChange={e => setQuizForm(p => ({ ...p, description: e.target.value }))}
                      className={`${textareaCls} h-24`} placeholder="Penjelasan singkat mengenai kuis..." />
                  </InputField>

                  <div className="grid grid-cols-3 gap-4">
                    <InputField label="Waktu (Menit)">
                      <input type="number" min="0" value={quizForm.timeLimitMinutes}
                        onChange={e => setQuizForm(p => ({ ...p, timeLimitMinutes: e.target.value }))}
                        className={inputCls} placeholder="e.g. 30" />
                    </InputField>
                    <InputField label="Lulus">
                      <input type="number" required min="0" max="100" value={quizForm.passingScore}
                        onChange={e => setQuizForm(p => ({ ...p, passingScore: e.target.value }))}
                        className={inputCls} placeholder="e.g. 70" />
                    </InputField>
                    <InputField label="XP Reward">
                      <input type="number" required min="0" value={quizForm.rewardXp}
                        onChange={e => setQuizForm(p => ({ ...p, rewardXp: e.target.value }))}
                        className={inputCls} placeholder="e.g. 20" />
                    </InputField>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl">
                    <div>
                      <div className="text-gray-900 dark:text-white font-medium text-[14px]">Status Publikasi</div>
                      <div className="text-gray-500 dark:text-white/40 text-[12px]">Dapat langsung dikerjakan oleh anggota</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={quizForm.isPublished}
                        onChange={e => setQuizForm(p => ({ ...p, isPublished: e.target.checked }))} />
                      <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                    </label>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseQuizModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="quizForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quiz Delete Modal */}
      <AnimatePresence>
        {quizDelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setQuizDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Kuis?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Seluruh data pertanyaan dan hasil pengerjaan kuis ini akan ikut terhapus.</p>
              <div className="flex gap-3">
                <button onClick={() => setQuizDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDeleteQuiz} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grade Essay Modal */}
      <AnimatePresence>
        {gradeModal && targetSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setGradeModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Beri Nilai Jawaban Essay
                </h2>
                <button onClick={() => setGradeModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 dark:text-white/30 uppercase tracking-widest mb-2">Jawaban Anggota:</h3>
                  <div className="space-y-4">
                    {(() => {
                      const matchingQuizObj = quizzes.find((q) => q.id === targetSubmission.quizId) || targetSubmission.quiz || activeQuiz;
                      const allQuestions = matchingQuizObj?.questions || [];
                      const subAnswers = targetSubmission.answers || [];

                      // Identify essay items: either q.type is ESSAY/SHORT_ANSWER OR an answer in subAnswers has non-empty essayText
                      const essayItems = subAnswers.map(ans => {
                        const qObj = allQuestions.find(q => Number(q.id) === Number(ans.questionId));
                        const qType = (qObj?.type || "").toLowerCase();
                        const isEssayType = qType.includes("essay") || qType.includes("short");
                        const hasEssayText = Boolean((ans.essayText && String(ans.essayText).trim()) || (ans.answer && typeof ans.answer === "string" && String(ans.answer).trim() && !ans.selectedOptionId && !ans.selectedOptionIds));
                        
                        if (isEssayType || hasEssayText) {
                          return { ans, qObj };
                        }
                        return null;
                      }).filter(Boolean);

                      if (essayItems.length === 0) {
                        return (
                          <div className="p-6 text-center bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl">
                            <p className="text-xs text-gray-500 dark:text-white/40">Tidak ada jawaban tipe Essay yang terdeteksi pada submisi kuis ini.</p>
                          </div>
                        );
                      }

                      return essayItems.map(({ ans, qObj }, aIdx) => {
                        let rawVal = ans.essayText ?? ans.answer;
                        let answerDisplay = "";
                        if (Array.isArray(rawVal)) answerDisplay = rawVal.join(", ");
                        else if (rawVal !== undefined && rawVal !== null) answerDisplay = String(rawVal);

                        return (
                          <div key={ans.questionId || aIdx} className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest">SOAL ESSAY #{aIdx + 1}</span>
                              <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                                {qObj?.type || "ESSAY"}
                              </span>
                            </div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">{qObj?.question || `Pertanyaan ID #${ans.questionId}`}</p>
                            <div className="pt-2 border-t border-gray-200/50 dark:border-white/5">
                              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Jawaban Member:</div>
                              {answerDisplay.trim() ? (
                                <p className="text-sm font-semibold text-gray-900 dark:text-white bg-white dark:bg-black/30 p-3.5 rounded-xl border border-gray-200 dark:border-white/10 italic leading-relaxed">
                                  "{answerDisplay}"
                                </p>
                              ) : (
                                <p className="text-xs text-gray-400 italic bg-white/5 p-3 rounded-xl border border-white/5">
                                  Member tidak mengisi jawaban untuk soal ini.
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>

                <form id="gradeForm" onSubmit={handleGradeSubmission} className="space-y-5">
                  <InputField label="Input Nilai Tambahan / Essay (0-100)">
                    <input
                      type="number"
                      required
                      min="0"
                      max="100"
                      value={essayScoreInput}
                      onChange={e => setEssayScoreInput(e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 85"
                    />
                  </InputField>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={() => setGradeModal(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="gradeForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan Nilai"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

// Extracted toast component
function Toast({ notification, onClose }) {
  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-6 right-6 z-[70] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border backdrop-blur-md ${
            notification.type === "success"
              ? "bg-green-500/10 border-green-500/20 text-green-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {notification.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
          <span className="font-medium text-xs">{notification.message}</span>
          <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const inputCls =
  "w-full h-12 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all";

const textareaCls =
  "w-full p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none";

const InputField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);
