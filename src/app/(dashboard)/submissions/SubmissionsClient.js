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
  const [copiedUrl, setCopiedUrl] = useState("");

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

  // Group by Task for Accordion View
  const taskGroups = useMemo(() => {
    return tasks
      .filter(
        (t) =>
          selectedTaskFilter === "ALL" || String(t.id) === String(selectedTaskFilter)
      )
      .map((t) => {
        const taskSubs = filteredSubmissions.filter((s) => s.taskId === t.id);
        return {
          task: t,
          submissions: taskSubs,
        };
      })
      .filter((g) => {
        if (
          searchQuery.trim() ||
          selectedStatusFilter !== "ALL" ||
          selectedGroupFilter !== "ALL"
        ) {
          return g.submissions.length > 0;
        }
        return true;
      });
  }, [tasks, filteredSubmissions, selectedTaskFilter, searchQuery, selectedStatusFilter, selectedGroupFilter]);

  // Review Modal Handlers
  const handleOpenReview = (sub) => {
    setTargetSubmission(sub);
    setReviewStatus(sub.status === "PENDING" ? "APPROVED" : sub.status);
    setReviewFeedback(sub.feedback || "");
    setReviewBonusXp((sub.bonusXp || 0).toString());
    setReviewModalOpen(true);
  };

  // Live Calculation for Estimation in Modal
  const estimationDetails = useMemo(() => {
    if (!targetSubmission || !targetSubmission.task) {
      return {
        baseXp: 0,
        speedBonusXp: 0,
        customBonusXp: 0,
        totalEstimatedXp: 0,
        timingInfo: { isLate: false, text: "-" },
      };
    }

    const currentTask = targetSubmission.task;
    const baseXp = currentTask.rewardXp || 0;
    const timingInfo = formatTimingDifference(targetSubmission.submittedAt, currentTask.deadline);

    let speedBonusXp = 0;
    if (currentTask.enableSpeedBonus !== false && !timingInfo.isLate) {
      speedBonusXp = calculateSpeedBonusXp(
        currentTask.createdAt,
        currentTask.deadline,
        targetSubmission.submittedAt
      );
    }

    const customBonusXp = Math.max(0, parseInt(reviewBonusXp) || 0);
    const totalEstimatedXp =
      reviewStatus === "APPROVED" ? baseXp + speedBonusXp + customBonusXp : 0;

    return {
      baseXp,
      speedBonusXp,
      customBonusXp,
      totalEstimatedXp,
      timingInfo,
    };
  }, [targetSubmission, reviewStatus, reviewBonusXp]);

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
        notify("error", res.error || "Gagal menyimpan review submisi.");
      }
    } catch (err) {
      console.error(err);
      notify("error", "Terjadi kesalahan koneksi.");
    } finally {
      setIsSavingReview(false);
    }
  };

  // Export Submissions to Excel
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPNVJT Portal";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Daftar Submisi");

      sheet.addRow([
        "ID Submisi",
        "Nama Member",
        "NPM",
        "Departemen",
        "Kelompok",
        "Judul Tugas",
        "Tanggal Submit",
        "Status",
        "XP Didapat",
        "Link/File URL",
        "Catatan Feedback",
      ]);

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF064E3B" },
      };

      filteredSubmissions.forEach((s) => {
        sheet.addRow([
          s.id,
          s.member?.name || "-",
          s.member?.npm || "-",
          s.member?.department?.name || "-",
          s.group?.groupName || "Belum ada kelompok",
          s.task?.title || "-",
          s.submittedAt ? new Date(s.submittedAt).toLocaleString("id-ID") : "-",
          s.status,
          s.xpEarned || 0,
          s.fileUrl || "-",
          s.feedback || "-",
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

  const handleCopyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(""), 2000);
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
              ? "Tinjau pengerjaan tugas, evaluasi hasil, dan berikan reward XP untuk member kelompok mentoring Anda."
              : "Tinjau pengerjaan tugas operasional, berikan catatan feedback, dan nilai reward XP anggota SRE UPNVJT."}
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
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total XP Diberi</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">+{stats.totalXpAwarded} XP</h3>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedTaskFilter}
            onChange={(e) => setSelectedTaskFilter(e.target.value)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white/80 focus:outline-none focus:border-primary"
          >
            <option value="ALL">Semua Tugas ({tasks.length})</option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white/80 focus:outline-none focus:border-primary"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">Menunggu Review</option>
            <option value="APPROVED">Disetujui</option>
            <option value="REJECTED">Ditolak / Revisi</option>
          </select>

          {!isRestrictedMentor && mentorGroups.length > 0 && (
            <select
              value={selectedGroupFilter}
              onChange={(e) => setSelectedGroupFilter(e.target.value)}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white/80 focus:outline-none focus:border-primary"
            >
              <option value="ALL">Semua Kelompok</option>
              {mentorGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <span className="text-xs text-gray-500 dark:text-white/40 font-semibold">
          Menampilkan {filteredSubmissions.length} submisi
        </span>
      </div>

      {/* ── Submissions Accordion List ── */}
      {taskGroups.length === 0 ? (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
            <ShieldCheck className="w-12 h-12 text-gray-400" />
            <p className="font-semibold text-base text-gray-900 dark:text-white">Tidak ada submisi ditemukan</p>
            <p className="text-xs text-gray-500 dark:text-white/40">Coba sesuaikan kata kunci pencarian atau filter status.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {taskGroups.map(({ task, submissions: taskSubs }) => {
            const isCollapsed = Boolean(collapsedTasks[task.id]);
            const pendingCount = taskSubs.filter((s) => s.status === "PENDING").length;
            const approvedCount = taskSubs.filter((s) => s.status === "APPROVED").length;

            return (
              <div
                key={task.id}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg transition-all"
              >
                {/* Header Accordion */}
                <div
                  onClick={() => toggleTaskCollapse(task.id)}
                  className="p-5 md:p-6 bg-gray-50/70 dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-white/[0.05] transition-all"
                >
                  <div className="flex items-start md:items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {task.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                          <Award className="w-3.5 h-3.5" /> +{task.rewardXp} XP
                        </span>
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 text-[10px] font-black uppercase">
                          {task.category || "MAIN"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          Tenggat: {task.deadline ? new Date(task.deadline).toLocaleDateString("id-ID", {
                            day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                          }) : "Tanpa batas"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/40 dark:border-white/5">
                    <div className="flex items-center gap-2">
                      {pendingCount > 0 && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" /> {pendingCount} Menunggu
                        </span>
                      )}
                      <span className="text-xs font-bold text-gray-500 dark:text-white/40">
                        {approvedCount} / {taskSubs.length} Selesai
                      </span>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500">
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Body List */}
                {!isCollapsed && (
                  <div className="p-5 md:p-6">
                    {taskSubs.length === 0 ? (
                      <p className="text-xs text-gray-400 italic text-center py-6">
                        Belum ada anggota yang mengumpulkan tugas ini.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {taskSubs.map((sub) => {
                          const isPending = sub.status === "PENDING";
                          const isApproved = sub.status === "APPROVED";
                          const isRejected = sub.status === "REJECTED";
                          const timing = formatTimingDifference(sub.submittedAt, task.deadline);

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
                                      <img src={sub.member.profilePictureUrl} alt="" className="w-full h-full object-cover" />
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
                                    Dikumpulkan: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString("id-ID") : "-"}
                                  </span>
                                  <span className={`font-bold ${timing.isLate ? "text-rose-500" : "text-emerald-500"}`}>
                                    {timing.isLate ? "⚠️ " : "⚡ "}
                                    {timing.text}
                                  </span>
                                </div>

                                {sub.fileUrl && (
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
                                        <span>Buka Berkas {sub.fileUrl.split(",").length > 1 ? `#${idx + 1}` : ""}</span>
                                      </a>
                                    ))}
                                  </div>
                                )}

                                {sub.feedback && (
                                  <div className="pt-2 border-t border-gray-200/50 dark:border-white/5 text-xs text-gray-600 dark:text-white/70">
                                    <strong className="text-gray-900 dark:text-white">Catatan:</strong> {sub.feedback}
                                  </div>
                                )}
                              </div>

                              {/* Card Footer */}
                              <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-white/80">
                                  <Award className="w-4 h-4 text-primary" />
                                  <span>
                                    {isApproved ? `+${sub.xpEarned || task.rewardXp || 0} XP Diberikan` : `Reward: +${task.rewardXp || 0} XP`}
                                  </span>
                                </div>

                                {canReview && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenReview(sub)}
                                    className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-white/90 transition-all flex items-center gap-1.5 shadow-sm"
                                  >
                                    <CheckSquare className="w-3.5 h-3.5" />
                                    <span>{isPending ? "Tinjau & Nilai" : "Ubah Penilaian"}</span>
                                  </button>
                                )}
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

      {/* ── Review & Grading Modal Matching Dashboard Standard ── */}
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
                        <img src={targetSubmission.member.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        targetSubmission.member?.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                        {targetSubmission.member?.name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        NPM: {targetSubmission.member?.npm || "-"} • {targetSubmission.group?.groupName || "Belum ada kelompok"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timing Analysis */}
                <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-white/50">Waktu Dikumpulkan:</span>
                  <span className={`font-bold ${estimationDetails.timingInfo.isLate ? "text-rose-500" : "text-emerald-500"}`}>
                    {estimationDetails.timingInfo.isLate ? "⚠️ " : "⚡ "}
                    {estimationDetails.timingInfo.text}
                  </span>
                </div>

                {/* Submission Link/Files */}
                {targetSubmission.fileUrl && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-700 dark:text-white/80">Berkas Pengerjaan:</label>
                    <div className="space-y-2">
                      {targetSubmission.fileUrl.split(",").map((url, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between gap-2"
                        >
                          <span className="text-xs text-gray-700 dark:text-white/70 truncate flex-1 font-mono">
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
                )}

                {/* Live Calculation & Estimation Box */}
                <div className="p-4 rounded-2xl bg-emerald-500/[0.04] border border-emerald-500/25 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <Award className="w-4 h-4" /> Estimasi Reward XP Member
                  </h4>
                  <div className="space-y-2 text-xs divide-y divide-emerald-500/10">
                    <div className="flex justify-between pt-1">
                      <span className="text-gray-500">Base Reward Tugas:</span>
                      <span className="font-bold text-gray-900 dark:text-white">+{estimationDetails.baseXp} XP</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="text-gray-500">Speed Bonus (Tepat Waktu):</span>
                      <span className="font-bold text-emerald-500">+{estimationDetails.speedBonusXp} XP</span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-gray-500">Bonus Tambahan Penilai:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={reviewBonusXp}
                          onChange={(e) => setReviewBonusXp(e.target.value)}
                          className="w-16 px-2 py-0.5 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/20 rounded-lg text-xs font-bold text-right text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                        />
                        <span className="text-gray-400">XP</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-3 text-sm font-black">
                      <span className="text-gray-900 dark:text-white">TOTAL XP DITERIMA:</span>
                      <span className={`px-3 py-1 rounded-xl ${reviewStatus === "APPROVED" ? "bg-primary text-[#050e0a]" : "bg-rose-500/20 text-rose-500"}`}>
                        {reviewStatus === "APPROVED" ? `+${estimationDetails.totalEstimatedXp} XP` : "0 XP (Ditolak)"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 dark:text-white/80">Keputusan Evaluasi:</label>
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
                    <label className="text-xs font-bold text-gray-700 dark:text-white/80">Catatan untuk Member:</label>
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
