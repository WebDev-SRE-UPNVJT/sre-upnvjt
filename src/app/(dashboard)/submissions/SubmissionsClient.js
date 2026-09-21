"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckSquare,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Users,
  FolderKanban,
  Download,
  Filter,
  Eye,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Zap,
  ShieldCheck,
  Calendar,
  X,
  Save,
  MessageSquare,
  FileText,
  UserCheck,
  Check,
  Copy,
  Gamepad2,
  ListChecks,
  FileQuestion,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { hasAccess } from "@/lib/permissions";
import { reviewTaskSubmissionAction } from "@/app/actions/submissionActions";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";
import ExcelJS from "exceljs";

function formatTimingDifference(submittedAt, deadline) {
  if (!submittedAt || !deadline) return { isLate: false, text: "Waktu tidak tercatat" };
  const sub = new Date(submittedAt).getTime();
  const dline = new Date(deadline).getTime();
  const diffMs = sub - dline;

  if (diffMs > 0) {
    const mins = Math.floor(diffMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let diffStr = "";
    if (days > 0) diffStr += `${days} hari `;
    if (hours % 24 > 0) diffStr += `${hours % 24} jam `;
    if (mins % 60 > 0 && days === 0) diffStr += `${mins % 60} menit`;
    return {
      isLate: true,
      text: `Terlambat ${diffStr.trim() || "< 1 menit"} setelah deadline`,
    };
  } else {
    const earlyMs = Math.abs(diffMs);
    const mins = Math.floor(earlyMs / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    let diffStr = "";
    if (days > 0) diffStr += `${days} hari `;
    if (hours % 24 > 0) diffStr += `${hours % 24} jam `;
    if (mins % 60 > 0 && days === 0) diffStr += `${mins % 60} menit`;
    return {
      isLate: false,
      text: `Tepat Waktu (${diffStr.trim() ? `${diffStr.trim()} lebih awal` : "pas sebelum deadline"})`,
    };
  }
}

/**
 * Component to render answers for TTS, Forms, Quizzes, or Files
 */
function SubmissionAnswersViewer({ submission }) {
  if (!submission) return null;

  const isTTS =
    submission.task?.submissionType === "TTS" ||
    Boolean(submission.task?.ttsCrosswordId) ||
    (Array.isArray(submission.answers) && submission.answers.length > 0 && submission.answers[0]?.clue !== undefined);

  const isForm =
    submission.task?.submissionType === "FORM" ||
    Boolean(submission.task?.formTemplateId) ||
    (Array.isArray(submission.answers) &&
      submission.answers.length > 0 &&
      (submission.answers[0]?.questionTitle !== undefined || submission.answers[0]?.questionId !== undefined));

  // 1. Render TTS Crossword answers
  if (isTTS) {
    const rawAnswers = Array.isArray(submission.answers) ? submission.answers : [];
    const crosswordQuestions = submission.task?.ttsCrossword?.questions || [];

    let cluesList = [];
    if (rawAnswers.length > 0 && rawAnswers[0]?.clue !== undefined) {
      cluesList = rawAnswers;
    } else {
      const answersMap =
        typeof submission.answers === "object" && submission.answers !== null && !Array.isArray(submission.answers)
          ? submission.answers
          : {};
      cluesList = crosswordQuestions.map((q) => {
        const uAns = String(
          answersMap[q.id] || answersMap[String(q.id)] || answersMap[q.clue] || ""
        )
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        const expected = String(q.answer || "")
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        const isCorrect = expected.length > 0 && expected === uAns;
        return {
          questionId: q.id,
          clue: q.clue,
          userAnswer: uAns || "-",
          correctAnswer: expected,
          isCorrect,
          number: q.number,
          orientation: q.orientation,
        };
      });
    }

    return (
      <div className="space-y-4">
        {/* TTS Score & Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Akurasi Skor</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
              {submission.score != null ? `${submission.score}%` : "-"}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Benar / Total</p>
            <p className="text-lg font-black text-teal-600 dark:text-teal-400">
              {submission.correctCount ?? cluesList.filter((c) => c.isCorrect).length} /{" "}
              {submission.totalQuestions ?? cluesList.length}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Salah / Keliru</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400">
              {submission.wrongCount ?? cluesList.filter((c) => !c.isCorrect).length}x
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Waktu Selesai</p>
            <p className="text-lg font-black text-blue-600 dark:text-blue-400">
              {submission.timeTakenSeconds
                ? `${Math.floor(submission.timeTakenSeconds / 60)}m ${submission.timeTakenSeconds % 60}s`
                : "Tercatat"}
            </p>
          </div>
        </div>

        {/* Crossword Question List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white/90 flex items-center gap-1.5">
              <Gamepad2 className="w-3.5 h-3.5 text-primary" />
              Rincian Jawaban Teka-Teki Silang ({cluesList.length} Petunjuk)
            </h4>
          </div>

          {cluesList.length === 0 ? (
            <p className="text-xs text-gray-400 italic p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
              Tidak ada rincian jawaban tersimpan untuk game ini.
            </p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {cluesList.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border transition-all text-xs ${
                    item.isCorrect
                      ? "bg-emerald-500/[0.03] border-emerald-500/20 dark:border-emerald-500/20"
                      : "bg-rose-500/[0.03] border-rose-500/20 dark:border-rose-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-gray-800 dark:text-white/90">
                      {idx + 1}. {item.clue || `Pertanyaan #${idx + 1}`}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 flex items-center gap-1 ${
                        item.isCorrect
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                          : "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {item.isCorrect ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      {item.isCorrect ? "Benar" : "Salah / Terbuka"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-gray-100 dark:border-white/5">
                    <div>
                      <span className="text-gray-400 text-[10px] uppercase font-bold block">Jawaban Member:</span>
                      <span
                        className={`font-mono font-bold ${
                          item.isCorrect
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {item.userAnswer || "-"}
                      </span>
                    </div>
                    {item.correctAnswer && (
                      <div>
                        <span className="text-gray-400 text-[10px] uppercase font-bold block">Kunci Jawaban:</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                          {item.correctAnswer}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Render Form / Questionnaire / Quiz answers
  if (isForm) {
    const rawAnswers = Array.isArray(submission.answers) ? submission.answers : [];
    const formQuestions = submission.task?.formTemplate?.questions || [];
    const isQuiz = Boolean(submission.task?.formTemplate?.isQuiz) || submission.score != null;

    let questionEntries = [];
    if (formQuestions.length > 0) {
      questionEntries = formQuestions
        .filter((q) => q && q.type !== "page_break")
        .map((q, idx) => {
          const matched = rawAnswers.find(
            (a) => String(a.questionId) === String(q.id) || a.questionTitle === q.question
          );
          return {
            index: idx + 1,
            questionId: q.id,
            questionTitle: q.question || `Pertanyaan #${idx + 1}`,
            type: q.type || "text",
            options: q.options || [],
            points: q.points || 0,
            value: matched ? matched.value : (rawAnswers[idx]?.value ?? "-"),
          };
        });
    } else if (rawAnswers.length > 0) {
      questionEntries = rawAnswers.map((a, idx) => ({
        index: idx + 1,
        questionId: a.questionId || idx,
        questionTitle: a.questionTitle || `Pertanyaan #${idx + 1}`,
        type: "text",
        value: a.value,
      }));
    }

    return (
      <div className="space-y-4">
        {/* Form / Quiz Summary Header */}
        {isQuiz && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skor Kuis</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                {submission.score != null ? `${submission.score}%` : "Tuntas"}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-center">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Soal Terjawab</p>
              <p className="text-lg font-black text-teal-600 dark:text-teal-400">
                {
                  questionEntries.filter(
                    (q) => q.value !== undefined && q.value !== null && q.value !== ""
                  ).length
                }{" "}
                / {questionEntries.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total XP Diperoleh</p>
              <p className="text-lg font-black text-blue-600 dark:text-blue-400">
                +{submission.xpEarned || submission.task?.rewardXp || 0} XP
              </p>
            </div>
          </div>
        )}

        {/* Questions & Answers List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-800 dark:text-white/90 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              Rekap Respon Formulir ({questionEntries.length} Pertanyaan)
            </h4>
          </div>

          {questionEntries.length === 0 ? (
            <p className="text-xs text-gray-400 italic p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
              Tidak ada data respon formulir tersimpan untuk submisi ini.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {questionEntries.map((q) => {
                const val = q.value;
                const isArrayVal = Array.isArray(val);
                const isFileUrl =
                  typeof val === "string" &&
                  (val.startsWith("http://") ||
                    val.startsWith("https://") ||
                    val.includes("drive.google.com") ||
                    val.includes("/uploads/"));

                return (
                  <div
                    key={q.questionId || q.index}
                    className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 space-y-1.5 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-gray-900 dark:text-white leading-snug">
                        {q.index}. {q.questionTitle}
                      </p>
                      {q.points > 0 && (
                        <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold shrink-0">
                          +{q.points} Poin
                        </span>
                      )}
                    </div>

                    {/* Member's Answer */}
                    <div className="pt-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">
                        Jawaban Responden:
                      </span>

                      {isArrayVal ? (
                        <div className="flex flex-wrap gap-1.5">
                          {val.length === 0 ? (
                            <span className="text-gray-400 italic">(Dikosongkan)</span>
                          ) : (
                            val.map((item, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-semibold text-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3 text-emerald-500" />
                                {String(item)}
                              </span>
                            ))
                          )}
                        </div>
                      ) : isFileUrl ? (
                        <div className="flex items-center gap-2">
                          <a
                            href={val}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-[#050e0a] font-bold text-xs hover:bg-primary-focus transition-all shadow-sm"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>Buka Lampiran / Berkas Form</span>
                          </a>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-lg bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5 font-medium text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                          {val !== undefined && val !== null && String(val).trim() !== "" ? (
                            String(val)
                          ) : (
                            <span className="text-gray-400 italic">(Tidak dijawab)</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Fallback for generic file/link submissions
  return (
    <div className="space-y-3">
      {submission.fileUrl ? (
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 dark:text-white/80">Berkas / Tautan Tugas:</label>
          <div className="space-y-2">
            {submission.fileUrl.split(",").map((url, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-2 text-xs"
              >
                <span className="text-gray-700 dark:text-white/70 truncate flex-1 font-mono">
                  {url.trim()}
                </span>
                <a
                  href={url.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-primary text-[#050e0a] text-xs font-bold flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Buka
                </a>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic p-3 bg-gray-50 dark:bg-white/5 rounded-xl text-center">
          Tidak ada berkas terlampir.
        </p>
      )}
    </div>
  );
}

export default function SubmissionsClient({ initialData, currentUser }) {
  const [submissions, setSubmissions] = useState(initialData?.submissions || []);
  const [tasks] = useState(initialData?.tasks || []);
  const [mentorGroups] = useState(initialData?.mentorGroups || []);
  const isRestrictedMentor = initialData?.isRestrictedMentor || false;

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");

  // Collapsed Tasks state for accordion
  const [collapsedTasks, setCollapsedTasks] = useState({});

  // Review Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [targetSubmission, setTargetSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED");
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewBonusXp, setReviewBonusXp] = useState("0");
  const [isSavingReview, setIsSavingReview] = useState(false);

  // Standalone Answers View Modal State
  const [answersModalOpen, setAnswersModalOpen] = useState(false);
  const [answersTargetSub, setAnswersTargetSub] = useState(null);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const canReview =
    hasAccess(currentUser, "submissions", "update") ||
    hasAccess(currentUser, "tasks", "update") ||
    (currentUser?.roleName || "").toUpperCase().includes("MENTOR");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const toggleTaskCollapse = (taskId) => {
    setCollapsedTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        (s.member?.name || "").toLowerCase().includes(q) ||
        (s.member?.npm || "").toLowerCase().includes(q) ||
        (s.task?.title || "").toLowerCase().includes(q) ||
        (s.feedback || "").toLowerCase().includes(q) ||
        (s.group?.groupName || "").toLowerCase().includes(q);

      const matchTask =
        selectedTaskFilter === "ALL" || String(s.taskId) === String(selectedTaskFilter);
      const matchStatus =
        selectedStatusFilter === "ALL" || s.status === selectedStatusFilter;
      const matchGroup =
        selectedGroupFilter === "ALL" ||
        (s.group && String(s.group.groupId) === String(selectedGroupFilter));

      return matchSearch && matchTask && matchStatus && matchGroup;
    });
  }, [submissions, searchQuery, selectedTaskFilter, selectedStatusFilter, selectedGroupFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    let totalXpAwarded = 0;

    filteredSubmissions.forEach((s) => {
      if (s.status === "PENDING") pending++;
      else if (s.status === "APPROVED") {
        approved++;
        totalXpAwarded += s.xpEarned || s.task?.rewardXp || 0;
      } else if (s.status === "REJECTED") rejected++;
    });

    return { total, pending, approved, rejected, totalXpAwarded };
  }, [filteredSubmissions]);

  // Group submissions by task for accordion layout
  const submissionsByTask = useMemo(() => {
    const map = new Map();
    filteredSubmissions.forEach((sub) => {
      const tId = sub.taskId;
      if (!map.has(tId)) {
        map.set(tId, {
          task: sub.task || { id: tId, title: "Tugas", rewardXp: 0 },
          items: [],
        });
      }
      map.get(tId).items.push(sub);
    });
    return Array.from(map.values());
  }, [filteredSubmissions]);

  const handleOpenReview = (submission) => {
    setTargetSubmission(submission);
    setReviewStatus(submission.status || "APPROVED");
    setReviewFeedback(submission.feedback || "");
    setReviewBonusXp(String(submission.bonusXp || 0));
    setReviewModalOpen(true);
  };

  const handleOpenAnswersModal = (submission) => {
    setAnswersTargetSub(submission);
    setAnswersModalOpen(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!targetSubmission) return;

    setIsSavingReview(true);
    try {
      const res = await reviewTaskSubmissionAction(targetSubmission.id, {
        status: reviewStatus,
        feedback: reviewFeedback,
        bonusXp: parseInt(reviewBonusXp) || 0,
      });

      if (res.success) {
        setSubmissions((prev) =>
          prev.map((s) => (s.id === targetSubmission.id ? { ...s, ...res.data } : s))
        );
        notify("success", "Penilaian submisi berhasil disimpan!");
        setReviewModalOpen(false);
      } else {
        notify("error", res.error || "Gagal menyimpan penilaian");
      }
    } catch (err) {
      notify("error", "Terjadi kesalahan jaringan: " + err.message);
    } finally {
      setIsSavingReview(false);
    }
  };

  const estimationDetails = useMemo(() => {
    if (!targetSubmission)
      return { baseXp: 0, speedBonusXp: 0, totalEstimatedXp: 0, isManualOnly: true, timingInfo: {} };

    const baseXp = targetSubmission.task?.rewardXp || 0;
    const isSpeedBonusEnabled = targetSubmission.task?.enableSpeedBonus !== false;
    let speedBonusXp = 0;

    if (isSpeedBonusEnabled && baseXp > 0) {
      speedBonusXp = calculateSpeedBonusXp(
        targetSubmission.task?.createdAt,
        targetSubmission.task?.deadline,
        targetSubmission.submittedAt
      );
    }

    const addedScoreOrBonus = parseInt(reviewBonusXp) || 0;
    const isManualOnly = baseXp === 0 && speedBonusXp === 0;
    const totalEstimatedXp = isManualOnly ? addedScoreOrBonus : baseXp + speedBonusXp + addedScoreOrBonus;
    const timingInfo = formatTimingDifference(
      targetSubmission.submittedAt,
      targetSubmission.task?.deadline
    );

    return { baseXp, speedBonusXp, totalEstimatedXp, isManualOnly, timingInfo };
  }, [targetSubmission, reviewBonusXp]);

  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Submisi Tugas");

      sheet.addRow([
        "ID",
        "Nama Member",
        "NPM",
        "Email",
        "Kelompok Mentoring",
        "Judul Tugas",
        "Tipe Submisi",
        "Status",
        "Skor / Akurasi",
        "Reward XP",
        "Bonus XP",
        "Waktu Submit",
        "Deadline",
        "Keterangan Waktu",
        "Berkas / Link",
        "Catatan Penilai",
        "Penilai",
      ]);

      filteredSubmissions.forEach((s) => {
        const timing = formatTimingDifference(s.submittedAt, s.task?.deadline);
        sheet.addRow([
          s.id,
          s.member?.name || "-",
          s.member?.npm || "-",
          s.member?.email || "-",
          s.group?.groupName || "-",
          s.task?.title || "-",
          s.task?.submissionType || "FILE",
          s.status,
          s.score != null ? `${s.score}%` : "-",
          s.xpEarned || s.task?.rewardXp || 0,
          s.bonusXp || 0,
          s.submittedAt ? new Date(s.submittedAt).toLocaleString("id-ID") : "-",
          s.task?.deadline ? new Date(s.task.deadline).toLocaleString("id-ID") : "-",
          timing.text,
          s.fileUrl || "-",
          s.feedback || "-",
          s.reviewer?.name || "-",
        ]);
      });

      sheet.columns.forEach((col) => {
        col.width = 22;
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `Submisi_Tugas_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      notify("success", "File Excel berhasil di-export!");
    } catch (err) {
      console.error(err);
      notify("error", "Gagal export Excel: " + err.message);
    }
  };

  const quickFeedbackTemplates = [
    "Kerja bagus! Pengerjaan tugas sangat lengkap dan memenuhi semua kriteria.",
    "Tugas disetujui, pertahankan kualitas pengerjaannya!",
    "Link berkas pengerjaan belum dibuka akses publik (Anyone with the link). Mohon perbaiki dan submit ulang.",
    "Format pengerjaan belum sesuai dengan petunjuk tugas. Harap lakukan revisi.",
  ];

  return (
    <div className="w-full relative">
      {/* ── Notification Toast ── */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-[100] px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-xl ${
              notification.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500" />
            )}
            <p className="text-sm font-bold">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Header Matching Dashboard Standard ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-2">
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter flex items-center gap-3 text-gray-900 dark:text-white">
              <CheckSquare className="w-8 h-8 text-primary" />
              Penilaian Submisi
            </h1>
            {isRestrictedMentor ? (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5" />
                Mode Mentor Kelompok
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Semua Kelompok (Admin)
              </span>
            )}
          </div>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            {isRestrictedMentor
              ? "Tinjau pengerjaan tugas, evaluasi jawaban kuis/form/TTS, dan berikan reward XP untuk member kelompok mentoring Anda."
              : "Tinjau pengerjaan tugas operasional, periksa detail jawaban peserta tanpa perlu buka spreadsheet, dan nilai reward XP."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Cari member / tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* ── Mentor Scope Banner ── */}
      {isRestrictedMentor && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3 text-amber-800 dark:text-amber-300 text-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-5 h-5 text-amber-500 shrink-0" />
            <span>
              <strong>Kelompok Mentoring Anda:</strong>{" "}
              {mentorGroups.map((g) => g.name).join(", ") || "Belum ada kelompok yang ditugaskan."}{" "}
              ({initialData?.myMembersCount || 0} Member Terbina)
            </span>
          </div>
        </div>
      )}

      {/* ── Stats Overview Matching Dashboard Standard ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <FolderKanban className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Submisi</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.total}</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold relative">
            <Clock className="w-6 h-6" />
            {stats.pending > 0 && (
              <span className="w-3 h-3 rounded-full bg-amber-500 absolute top-1 right-1 animate-pulse" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Perlu Review</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">{stats.pending}</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Disetujui</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.approved}</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">XP Diberikan</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">+{stats.totalXpAwarded}</h3>
          </div>
        </div>
      </div>

      {/* ── Filter Dropdowns ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Task Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs">
          <FolderKanban className="w-4 h-4 text-gray-400" />
          <select
            value={selectedTaskFilter}
            onChange={(e) => setSelectedTaskFilter(e.target.value)}
            className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="dark:bg-[#0b1712]">Semua Penugasan ({tasks.length})</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id} className="dark:bg-[#0b1712]">
                {t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
          >
            <option value="ALL" className="dark:bg-[#0b1712]">Semua Status Submisi</option>
            <option value="PENDING" className="dark:bg-[#0b1712]">Menunggu Review</option>
            <option value="APPROVED" className="dark:bg-[#0b1712]">Disetujui (Approved)</option>
            <option value="REJECTED" className="dark:bg-[#0b1712]">Perlu Revisi (Rejected)</option>
          </select>
        </div>

        {/* Group Filter */}
        {mentorGroups.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs">
            <Users className="w-4 h-4 text-gray-400" />
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-transparent text-gray-900 dark:text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#0b1712]">Semua Kelompok Mentoring</option>
              {mentorGroups.map((g) => (
                <option key={g.id} value={g.id} className="dark:bg-[#0b1712]">
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* ── Submissions Accordion / List ── */}
      {submissionsByTask.length === 0 ? (
        <div className="p-12 text-center bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl backdrop-blur-xl">
          <CheckSquare className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tidak Ada Submisi Ditemukan</h3>
          <p className="text-sm text-gray-500 dark:text-white/50 max-w-sm mx-auto mt-1">
            Belum ada member yang mengumpulkan tugas atau tidak ada submisi yang sesuai filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {submissionsByTask.map(({ task, items }) => {
            const isCollapsed = collapsedTasks[task.id];
            const pendingCount = items.filter((i) => i.status === "PENDING").length;
            const approvedCount = items.filter((i) => i.status === "APPROVED").length;
            const isTTSTask = task.submissionType === "TTS" || Boolean(task.ttsCrosswordId);
            const isFormTask = task.submissionType === "FORM" || Boolean(task.formTemplateId);

            return (
              <div
                key={task.id}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-sm transition-all"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => toggleTaskCollapse(task.id)}
                  className="p-5 md:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors border-b border-gray-100 dark:border-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      {isTTSTask ? (
                        <Gamepad2 className="w-5 h-5" />
                      ) : isFormTask ? (
                        <FileText className="w-5 h-5" />
                      ) : (
                        <FolderKanban className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {task.title}
                        </h3>
                        {isTTSTask && (
                          <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase">
                            TTS Crossword
                          </span>
                        )}
                        {isFormTask && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                            Formulir / Kuis
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-white/50 flex items-center gap-3 mt-0.5">
                        <span>Reward: +{task.rewardXp || 0} XP</span>
                        <span>•</span>
                        <span>{items.length} Submisi Masuk</span>
                        {task.deadline && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-3 h-3" />
                              Deadline: {new Date(task.deadline).toLocaleDateString("id-ID")}
                            </span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {pendingCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {pendingCount} Perlu Review
                        </span>
                      )}
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> {approvedCount} Selesai
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors rounded-xl"
                    >
                      {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submissions Grid Inside Task Accordion */}
                {!isCollapsed && (
                  <div className="p-5 md:p-6 bg-white/[0.01]">
                    {items.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-4">
                        Tidak ada submisi untuk penugasan ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((sub) => {
                          const isPending = sub.status === "PENDING";
                          const isApproved = sub.status === "APPROVED";
                          const isRejected = sub.status === "REJECTED";
                          const timing = formatTimingDifference(sub.submittedAt, task.deadline);
                          const hasAnswersData =
                            (Array.isArray(sub.answers) && sub.answers.length > 0) ||
                            isTTSTask ||
                            isFormTask;

                          return (
                            <div
                              key={sub.id}
                              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                                isPending
                                  ? "bg-amber-500/[0.03] border-amber-500/30"
                                  : isApproved
                                  ? "bg-emerald-500/[0.02] border-emerald-500/30"
                                  : "bg-rose-500/[0.02] border-rose-500/30"
                              }`}
                            >
                              {/* Member info */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white shrink-0 overflow-hidden">
                                    {sub.member?.profilePictureUrl ? (
                                      <img
                                        src={sub.member.profilePictureUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      sub.member?.name?.charAt(0).toUpperCase() || "?"
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                      {sub.member?.name || `User ${sub.memberId}`}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate">
                                      {sub.member?.npm || sub.member?.email}
                                    </p>
                                    {sub.group && (
                                      <span className="inline-block mt-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold">
                                        {sub.group.groupName}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  {isPending && (
                                    <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                      <Clock className="w-3 h-3" /> Menunggu
                                    </span>
                                  )}
                                  {isApproved && (
                                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" /> Disetujui
                                    </span>
                                  )}
                                  {isRejected && (
                                    <span className="px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                      <XCircle className="w-3 h-3" /> Revisi
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Submitted Content Preview */}
                              <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200/60 dark:border-white/5 space-y-2 text-xs">
                                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-white/50">
                                  <span>
                                    Dikumpulkan:{" "}
                                    {sub.submittedAt
                                      ? new Date(sub.submittedAt).toLocaleString("id-ID")
                                      : "-"}
                                  </span>
                                  <span
                                    className={`font-bold ${
                                      timing.isLate ? "text-rose-500" : "text-emerald-500"
                                    }`}
                                  >
                                    {timing.isLate ? "⚠️ " : "⚡ "}
                                    {timing.text}
                                  </span>
                                </div>

                                {/* Skor Badge (jika TTS / Kuis / ada score) */}
                                {sub.score != null && (
                                  <div className="flex items-center justify-between bg-primary/10 px-2.5 py-1 rounded-lg text-primary font-bold text-xs">
                                    <span>Skor Pengerjaan:</span>
                                    <span>
                                      {sub.score}% {sub.correctCount != null ? `(${sub.correctCount}/${sub.totalQuestions || "?"} Benar)` : ""}
                                    </span>
                                  </div>
                                )}

                                {/* Links or Quick Action */}
                                {sub.fileUrl && !isTTSTask && !isFormTask && (
                                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                                    {sub.fileUrl.split(",").map((url, idx) => (
                                      <a
                                        key={idx}
                                        href={url.trim()}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                        <span>
                                          Buka Berkas {sub.fileUrl.split(",").length > 1 ? `#${idx + 1}` : ""}
                                        </span>
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {sub.feedback && (
                                  <div className="pt-2 border-t border-gray-200/50 dark:border-white/5 text-xs text-gray-600 dark:text-white/70">
                                    <strong className="text-gray-900 dark:text-white">Catatan:</strong>{" "}
                                    {sub.feedback}
                                  </div>
                                )}
                              </div>

                              {/* Card Footer Actions */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/5 flex-wrap">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-white/80">
                                  <Award className="w-4 h-4 text-primary" />
                                  <span>
                                    {isApproved
                                      ? `+${sub.xpEarned || task.rewardXp || 0} XP`
                                      : `Reward: +${task.rewardXp || 0} XP`}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {/* Button Lihat Detail Jawaban Tanpa Buka Spreadsheet */}
                                  {hasAnswersData && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenAnswersModal(sub)}
                                      className="px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-all flex items-center gap-1"
                                      title="Lihat rincian jawaban member secara instan"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Lihat Jawaban</span>
                                    </button>
                                  )}

                                  {canReview && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReview(sub)}
                                      className="px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-sm"
                                    >
                                      <CheckSquare className="w-3.5 h-3.5" />
                                      <span>{isPending ? "Tinjau & Nilai" : "Ubah Nilai"}</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Standalone Answers Viewer Modal (Tanpa Buka Spreadsheet) ── */}
      <AnimatePresence>
        {answersModalOpen && answersTargetSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0b1712] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                    {answersTargetSub.task?.submissionType === "TTS" ||
                    answersTargetSub.task?.ttsCrosswordId ? (
                      <Gamepad2 className="w-6 h-6" />
                    ) : (
                      <FileText className="w-6 h-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white truncate">
                      Detail Jawaban: {answersTargetSub.member?.name || `User ${answersTargetSub.memberId}`}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5 truncate">
                      {answersTargetSub.task?.title} • NPM: {answersTargetSub.member?.npm || "-"} •{" "}
                      {answersTargetSub.group?.groupName || "Belum Ada Kelompok"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAnswersModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors shrink-0 ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="py-5 overflow-y-auto flex-1 pr-1 space-y-5">
                {/* Submission Meta Bar */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center justify-between gap-3 text-xs flex-wrap">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-500">Dikumpulkan:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {answersTargetSub.submittedAt
                        ? new Date(answersTargetSub.submittedAt).toLocaleString("id-ID")
                        : "-"}
                    </span>
                  </div>
                  <div>
                    <span
                      className={`font-bold ${
                        formatTimingDifference(answersTargetSub.submittedAt, answersTargetSub.task?.deadline)
                          .isLate
                          ? "text-rose-500"
                          : "text-emerald-500"
                      }`}
                    >
                      {
                        formatTimingDifference(
                          answersTargetSub.submittedAt,
                          answersTargetSub.task?.deadline
                        ).text
                      }
                    </span>
                  </div>
                </div>

                {/* Answers Component */}
                <SubmissionAnswersViewer submission={answersTargetSub} />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Jawaban ditarik langsung dari database portal
                </span>
                <div className="flex items-center gap-2">
                  {canReview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAnswersModalOpen(false);
                        handleOpenReview(answersTargetSub);
                      }}
                      className="px-5 py-2.5 rounded-xl bg-primary text-[#050e0a] font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-primary-focus transition-all"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span>Beri Penilaian & Nilai XP</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setAnswersModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Review & Grading Modal ── */}
      <AnimatePresence>
        {reviewModalOpen && targetSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0b1712] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-primary" />
                    Tinjau & Evaluasi Submisi
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
                    {targetSubmission.task?.title || "Tugas"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReview} className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
                {/* Member Details */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-sm font-bold text-gray-800 dark:text-white shrink-0 overflow-hidden">
                      {targetSubmission.member?.profilePictureUrl ? (
                        <img
                          src={targetSubmission.member.profilePictureUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        targetSubmission.member?.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {targetSubmission.member?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        NPM: {targetSubmission.member?.npm || "-"} •{" "}
                        {targetSubmission.group?.groupName || "Belum ada kelompok"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timing Analysis */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-white/50">Waktu Dikumpulkan:</span>
                  <span
                    className={`font-bold ${
                      estimationDetails.timingInfo.isLate ? "text-rose-500" : "text-emerald-500"
                    }`}
                  >
                    {estimationDetails.timingInfo.isLate ? "⚠️ " : "⚡ "}
                    {estimationDetails.timingInfo.text}
                  </span>
                </div>

                {/* Embedded Answers Viewer Inside Review Modal */}
                <div className="p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/5 pb-2">
                    <label className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-primary" />
                      Rincian Jawaban & Pengerjaan Member:
                    </label>
                  </div>
                  <SubmissionAnswersViewer submission={targetSubmission} />
                </div>

                {/* Live Calculation & Estimation / Grading Box */}
                <div className="p-5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/30 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-primary" />
                      {estimationDetails.isManualOnly
                        ? "Penilaian Nilai XP Tugas (Review Manual)"
                        : "Estimasi Perolehan Reward XP Member"}
                    </h4>
                    {estimationDetails.isManualOnly ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        Input Nilai Manual
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-primary text-[10px] font-bold">
                        Reward Otomatis + Bonus
                      </span>
                    )}
                  </div>

                  {/* Breakdown only if Base Reward or Speed Bonus > 0 */}
                  {!estimationDetails.isManualOnly && (
                    <div className="space-y-2 text-xs divide-y divide-emerald-500/10">
                      <div className="flex justify-between pt-1">
                        <span className="text-gray-500 dark:text-white/60">Base Reward Tugas:</span>
                        <span className="font-bold text-gray-900 dark:text-white">
                          +{estimationDetails.baseXp} XP
                        </span>
                      </div>
                      {estimationDetails.speedBonusXp > 0 && (
                        <div className="flex justify-between pt-2">
                          <span className="text-gray-500 dark:text-white/60">Speed Bonus (Tepat Waktu):</span>
                          <span className="font-bold text-emerald-500">
                            +{estimationDetails.speedBonusXp} XP
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Large, Prominent Score Input Field */}
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1">
                        <span>
                          {estimationDetails.isManualOnly
                            ? "Masukkan Nilai XP yang Diberikan:"
                            : "Bonus Tambahan Penilai (Opsional):"}
                        </span>
                      </label>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {estimationDetails.isManualOnly
                          ? "Sesuai kualitas pengerjaan peserta"
                          : "Tambahan di atas reward dasar"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          min="0"
                          max="10000"
                          value={reviewBonusXp}
                          onChange={(e) => setReviewBonusXp(e.target.value)}
                          placeholder="0"
                          className="w-full h-14 pl-4 pr-16 bg-white dark:bg-black/40 border-2 border-emerald-500/40 focus:border-primary rounded-2xl text-2xl font-black text-gray-900 dark:text-white focus:outline-none shadow-sm transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 rounded-xl bg-primary/15 text-primary text-xs font-black pointer-events-none">
                          XP
                        </div>
                      </div>
                    </div>

                    {/* Quick Presets Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] uppercase font-bold text-gray-400 mr-1">Preset Cepat:</span>
                      {(estimationDetails.isManualOnly
                        ? [0, 10, 25, 50, 75, 100, 150, 200]
                        : [0, 5, 10, 15, 25, 50]
                      ).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setReviewBonusXp(String(preset))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                            String(reviewBonusXp) === String(preset)
                              ? "bg-primary text-[#050e0a] shadow-sm scale-105"
                              : "bg-white/80 dark:bg-white/10 hover:bg-emerald-500/15 text-gray-700 dark:text-white/80 border border-gray-200/60 dark:border-white/10"
                          }`}
                        >
                          {preset === 0 ? "0 XP" : `+${preset} XP`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total XP Banner */}
                  <div className="flex justify-between items-center pt-3 border-t border-emerald-500/20 text-sm font-black">
                    <span className="text-gray-900 dark:text-white">TOTAL XP DITERIMA MEMBER:</span>
                    <span
                      className={`px-3.5 py-1.5 rounded-xl text-sm font-black tracking-wide ${
                        reviewStatus === "APPROVED"
                          ? "bg-primary text-[#050e0a] shadow-[0_0_15px_rgba(16,185,129,0.35)]"
                          : "bg-rose-500/20 text-rose-500"
                      }`}
                    >
                      {reviewStatus === "APPROVED"
                        ? `+${estimationDetails.totalEstimatedXp} XP`
                        : "0 XP (Ditolak)"}
                    </span>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-white/80">
                    Keputusan Evaluasi:
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setReviewStatus("APPROVED")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        reviewStatus === "APPROVED"
                          ? "bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm"
                          : "border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Setujui (APPROVED)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReviewStatus("REJECTED")}
                      className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                        reviewStatus === "REJECTED"
                          ? "bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm"
                          : "border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5"
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Tolak / Revisi</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Notes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-gray-700 dark:text-white/80">
                      Catatan untuk Member:
                    </label>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {quickFeedbackTemplates.map((template, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setReviewFeedback(template)}
                        className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white/80 text-[10px] font-semibold transition-colors text-left"
                      >
                        + &quot;{template.slice(0, 36)}...&quot;
                      </button>
                    ))}
                  </div>
                  <textarea
                    rows={3}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Tuliskan evaluasi atau saran perbaikan..."
                    className="w-full p-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-primary resize-none"
                  />
                </div>

                {/* Modal Footer */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingReview}
                    className="px-6 py-2.5 rounded-xl bg-primary text-[#050e0a] font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:bg-primary-focus transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingReview ? "Menyimpan..." : "Simpan Penilaian"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
