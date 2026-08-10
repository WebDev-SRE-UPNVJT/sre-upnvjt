"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, FolderKanban, FileText, Calendar, Award,
  Clock, Check, Eye, ExternalLink, ShieldCheck, ChevronDown, ChevronUp, Filter,
  Download, FileSpreadsheet, Upload, RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";
import * as XLSX from "xlsx";
import { calculateSpeedBonusXp } from "@/lib/xpUtils";

const EMPTY_TASK = {
  title: "",
  description: "",
  rewardXp: "30",
  deadline: "",
  folderId: "",
  submissionType: "FILE",
  maxUploadSizeMb: "10",
  allowMultipleFiles: false,
};

function CustomSelect({ value, onChange, options, icon: Icon, placeholder = "Pilih..." }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(o => o.value === value) || options[0];

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-9 px-3.5 bg-white dark:bg-[#0d1c16] border border-gray-200 dark:border-white/15 rounded-xl text-xs font-bold text-gray-900 dark:text-white flex items-center gap-2 hover:border-primary/50 dark:hover:border-primary/50 transition-all shadow-sm"
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

export default function TasksClient({ initialTasks, initialSubmissions, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  const [activeTab, setActiveTab] = useState("tasks"); // "tasks" | "submissions"
  const [tasks, setTasks] = useState(initialTasks || []);
  const [submissions, setSubmissions] = useState(initialSubmissions || []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Submission Filter & Collapse state
  const [selectedTaskFilter, setSelectedTaskFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL");
  const [collapsedTasks, setCollapsedTasks] = useState({});

  const toggleTaskCollapse = (taskId) => {
    setCollapsedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  // Task Modal state
  const [taskModal, setTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState(EMPTY_TASK);
  const [targetTask, setTargetTask] = useState(null);
  const [taskDelModal, setTaskDelModal] = useState(false);

  // Review Modal state
  const [reviewModal, setReviewModal] = useState(false);
  const [targetSubmission, setTargetSubmission] = useState(null);
  const [reviewStatus, setReviewStatus] = useState("APPROVED"); // APPROVED | REJECTED
  const [reviewFeedback, setReviewFeedback] = useState("");
  const [reviewBonusXp, setReviewBonusXp] = useState("0");

  // Import Excel Modal State
  const [importModal, setImportModal] = useState(false);
  const [importTask, setImportTask] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [importPreviewItems, setImportPreviewItems] = useState([]);
  const [importStep, setImportStep] = useState("IDLE"); // "IDLE" | "PREVIEW" | "SAVING" | "SUCCESS"
  const [importProgressLogs, setImportProgressLogs] = useState([]);
  const [importSummary, setImportSummary] = useState(null);

  const canCreate = hasAccess(user, "tasks", "create");
  const canUpdate = hasAccess(user, "tasks", "update");
  const canDelete = hasAccess(user, "tasks", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleOpenTaskModal = (tk = null) => {
    if (tk) {
      const date = new Date(tk.deadline);
      const tzOffset = date.getTimezoneOffset() * 60000;
      const localISOTime = (new Date(date.getTime() - tzOffset)).toISOString().slice(0, 16);
      
      setTaskForm({
        title: tk.title,
        description: tk.description,
        rewardXp: tk.rewardXp?.toString() || "30",
        deadline: localISOTime,
        folderId: tk.folderId || "",
        submissionType: tk.submissionType === "LINK" ? "LINK" : "FILE",
        maxUploadSizeMb: tk.maxUploadSizeMb?.toString() || "10",
        allowMultipleFiles: tk.allowMultipleFiles ?? false,
      });
    } else {
      setTaskForm({ ...EMPTY_TASK });
    }
    setTargetTask(tk);
    setTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setTaskModal(false);
    setTimeout(() => { setTaskForm(EMPTY_TASK); setTargetTask(null); }, 300);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetTask?.id);

    const url = isEditing ? `/api/tasks/${targetTask.id}` : "/api/tasks";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: taskForm.title,
          description: taskForm.description,
          rewardXp: parseInt(taskForm.rewardXp),
          deadline: taskForm.deadline,
          folderId: taskForm.folderId ? taskForm.folderId.trim() : null,
          submissionType: taskForm.submissionType === "LINK" ? "LINK" : "FILE",
          maxUploadSizeMb: parseInt(taskForm.maxUploadSizeMb) || 10,
          allowMultipleFiles: Boolean(taskForm.allowMultipleFiles),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEditing) {
          setTasks(tasks.map(t => t.id === targetTask.id ? { ...data.task, submissionCount: t.submissionCount } : t));
        } else {
          setTasks([data.task, ...tasks]);
        }
        notify("success", isEditing ? "Tugas diperbarui!" : "Tugas baru dibuat!");
        handleCloseTaskModal();
      } else {
        notify("error", data.error || "Gagal menyimpan tugas");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const exportTaskToExcel = async (tk, groupSubs) => {
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

      // ── SHEET 1: SUBMISI TUGAS ──────────────────────────────────────────────
      const sheet = workbook.addWorksheet("Submisi Tugas");

      // Title Banner (Row 1)
      sheet.mergeCells("A1:H1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `SRE UPNVJT - FORM REVISE & EVALUASI SUBMISI TUGAS: ${tk.title.toUpperCase()}`;
      titleCell.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 30;

      // Notice Banner (Row 2)
      sheet.mergeCells("A2:H2");
      const noticeCell = sheet.getCell("A2");
      noticeCell.value = "DILARANG MENGUBAH KOLOM MERAH (ID Submisi, ID User, Nama, Waktu, Link). UBAH HANYA KOLOM HIJAU (Status, Catatan Feedback, Bonus XP).";
      noticeCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF991B1B" } };
      noticeCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } };
      noticeCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(2).height = 24;

      // Empty Row 3
      sheet.getRow(3).height = 10;

      // Header Row (Row 4)
      const headers = [
        { header: "ID Submisi [LOCKED]", key: "submissionId", locked: true },
        { header: "ID User [LOCKED]", key: "memberId", locked: true },
        { header: "Nama Anggota [LOCKED]", key: "memberName", locked: true },
        { header: "Waktu Submisi [LOCKED]", key: "submittedAt", locked: true },
        { header: "Link Submisi [LOCKED]", key: "fileUrl", locked: true },
        { header: "Status [EDITABLE]", key: "status", locked: false },
        { header: "Catatan Feedback [EDITABLE]", key: "feedback", locked: false },
        { header: "Bonus XP [EDITABLE]", key: "bonusXp", locked: false },
      ];

      const headerRow = sheet.getRow(4);
      headerRow.height = 28;

      headers.forEach((h, colIdx) => {
        const cell = headerRow.getCell(colIdx + 1);
        cell.value = h.header;
        cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        
        if (h.locked) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDC2626" } }; // Red
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } }; // Green
        }
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

        const rowValues = [
          s.id,
          s.memberId,
          s.member?.name || `User ${s.memberId}`,
          s.submittedAt ? new Date(s.submittedAt).toLocaleString("id-ID") : "-",
          s.fileUrl || "",
          s.status,
          s.feedback || "",
          0,
        ];

        rowValues.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Arial", size: 10 };

          const isLocked = colIdx < 5;

          if (isLocked) {
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF2F2" } }; // Rose light
            cell.font = { name: "Arial", size: 10, color: { argb: "FF7F1D1D" } };
            cell.alignment = colIdx === 0 || colIdx === 1 ? { horizontal: "center", vertical: "middle" } : { vertical: "middle" };
            cell.border = {
              top: { style: "thin", color: { argb: "FFFECACA" } },
              bottom: { style: "thin", color: { argb: "FFFECACA" } },
              left: { style: "thin", color: { argb: "FFFECACA" } },
              right: { style: "thin", color: { argb: "FFFECACA" } },
            };
          } else {
            if (colIdx === 5) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            } else if (colIdx === 6) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
              cell.alignment = { vertical: "middle" };
            } else if (colIdx === 7) {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFFBEB" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB45309" } };
              cell.alignment = { horizontal: "center", vertical: "middle" };
            }

            cell.border = {
              top: { style: "thin", color: { argb: "FFA7F3D0" } },
              bottom: { style: "thin", color: { argb: "FFA7F3D0" } },
              left: { style: "thin", color: { argb: "FFA7F3D0" } },
              right: { style: "thin", color: { argb: "FFA7F3D0" } },
            };
          }
        });
      });

      sheet.columns = [
        { width: 16 },
        { width: 14 },
        { width: 30 },
        { width: 22 },
        { width: 45 },
        { width: 22 },
        { width: 42 },
        { width: 16 },
      ];

      // ── SHEET 2: PANDUAN PENGISIAN ─────────────────────────────────────────
      const guideSheet = workbook.addWorksheet("Panduan & Petunjuk");

      guideSheet.mergeCells("A1:D1");
      const guideTitle = guideSheet.getCell("A1");
      guideTitle.value = "PETUNJUK PENGISIAN FILE REVISE & EVALUASI SUBMISI";
      guideTitle.font = { name: "Arial", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      guideTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      guideTitle.alignment = { horizontal: "center", vertical: "middle" };
      guideSheet.getRow(1).height = 30;

      const guideHeaders = ["NAMA KOLOM", "STATUS KOLOM", "WARNA", "PETUNJUK LENGKAP PENGISIAN"];
      const guideHeaderRow = guideSheet.getRow(3);
      guideHeaderRow.height = 24;

      guideHeaders.forEach((gh, idx) => {
        const c = guideHeaderRow.getCell(idx + 1);
        c.value = gh;
        c.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F2937" } };
        c.alignment = { horizontal: "center", vertical: "middle" };
      });

      const guideRowsData = [
        ["ID Submisi [LOCKED]", "DIKUNCI / DO NOT EDIT", "Merah", "DILARANG DIUBAH! Kunci referensi submisi."],
        ["ID User [LOCKED]", "DIKUNCI / DO NOT EDIT", "Merah", "DILARANG DIUBAH! ID identitas pengguna anggota."],
        ["Nama Anggota [LOCKED]", "READ ONLY", "Merah", "DILARANG DIUBAH! Informasi nama lengkap anggota."],
        ["Waktu Submisi [LOCKED]", "READ ONLY", "Merah", "DILARANG DIUBAH! Tanggal & jam submit tugas."],
        ["Link Submisi [LOCKED]", "READ ONLY", "Merah", "DILARANG DIUBAH! Tautan file submisi anggota."],
        ["Status [EDITABLE]", "BISA DIEDIT", "Hijau", "Isikan salah satu dari: APPROVED (Disetujui), REJECTED (Ditolak / Perlu Revisi), atau PENDING (Menunggu Review)."],
        ["Catatan Feedback [EDITABLE]", "BISA DIEDIT", "Hijau", "Tuliskan pesan / masukan / saran perbaikan untuk anggota (Opsional)."],
        ["Bonus XP [EDITABLE]", "BISA DIEDIT", "Hijau", "Isikan angka bonus XP (contoh: 10 atau 20). XP ini akan otomatis ditambahkan ke profil anggota saat file di-import!"],
      ];

      guideRowsData.forEach((gr, idx) => {
        const r = guideSheet.getRow(idx + 4);
        r.height = 22;
        gr.forEach((val, colIdx) => {
          const c = r.getCell(colIdx + 1);
          c.value = val;
          c.font = { name: "Arial", size: 10 };
          c.alignment = { vertical: "middle" };
          
          if (colIdx === 1) {
            c.font = { name: "Arial", size: 10, bold: true, color: val.includes("DIKUNCI") ? { argb: "FFDC2626" } : { argb: "FF059669" } };
          }
        });
      });

      guideSheet.columns = [
        { width: 22 },
        { width: 24 },
        { width: 14 },
        { width: 85 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (tk.title || "Task").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `Submisi_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify("success", `File Excel (.xlsx) premium untuk task "${tk.title}" berhasil di-download!`);
    } catch (err) {
      console.error("Excel export error:", err);
      notify("error", "Gagal meng-export Excel: " + err.message);
    }
  };

  // Import Excel Modal Handlers
  const handleOpenImportModal = (tk) => {
    setImportTask(tk);
    setImportFile(null);
    setImportPreviewItems([]);
    setImportStep("IDLE");
    setImportProgressLogs([]);
    setImportSummary(null);
    setImportModal(true);
  };

  const handleCloseImportModal = () => {
    setImportModal(false);
    setTimeout(() => {
      setImportTask(null);
      setImportFile(null);
      setImportPreviewItems([]);
      setImportStep("IDLE");
      setImportProgressLogs([]);
      setImportSummary(null);
    }, 300);
  };

  const handleSelectImportFile = (e) => {
    const file = e.target?.files?.[0] || e;
    if (!file) return;

    setImportFile(file);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        let sheetName = workbook.SheetNames.find(n => n.includes("Submisi")) || workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        if (!sheet) {
          notify("error", "Sheet submisi tidak ditemukan dalam file Excel");
          return;
        }

        const rawMatrix = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        let headerRowIndex = -1;

        for (let r = 0; r < rawMatrix.length; r++) {
          const rowArr = rawMatrix[r];
          if (Array.isArray(rowArr) && rowArr.length >= 3) {
            const rowStr = rowArr.map(cell => String(cell || "").toLowerCase()).join(" ");
            const hasSubId = rowStr.includes("id submisi") || (rowStr.includes("id") && rowStr.includes("submisi"));
            const hasUserId = rowStr.includes("id user") || (rowStr.includes("id") && rowStr.includes("user"));
            const hasStatus = rowStr.includes("status");

            if ((hasSubId && hasUserId) || (hasSubId && hasStatus) || (hasUserId && hasStatus)) {
              headerRowIndex = r;
              break;
            }
          }
        }

        const jsonRows = XLSX.utils.sheet_to_json(sheet, {
          range: headerRowIndex >= 0 ? headerRowIndex : 0,
        });

        if (!jsonRows || jsonRows.length === 0) {
          notify("error", "File Excel kosong atau format data tidak ditemukan");
          return;
        }

        const getRowVal = (rowObj, ...candidates) => {
          for (const key of Object.keys(rowObj)) {
            const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
            for (const cand of candidates) {
              const cleanCand = cand.toLowerCase().replace(/[^a-z0-9]/g, "");
              if (cleanKey.includes(cleanCand) || cleanCand.includes(cleanKey)) {
                return rowObj[key];
              }
            }
          }
          return undefined;
        };

        const itemsToUpdate = jsonRows.map(row => {
          const rawSubId = getRowVal(row, "idsubmisi", "submisiid", "id");
          const rawMemId = getRowVal(row, "iduser", "userid", "memberid", "user");
          const rawStatusVal = getRowVal(row, "status");
          const rawFeedbackVal = getRowVal(row, "feedback", "catatan", "catatanfeedback");
          const rawBonusVal = getRowVal(row, "bonusxp", "bonus");

          const rawStatusStr = String(rawStatusVal || "").trim().toUpperCase();
          let status = "PENDING";
          if (rawStatusStr.includes("APPROV") || rawStatusStr.includes("SETUJU") || rawStatusStr.includes("ACC") || rawStatusStr.includes("PASSED")) {
            status = "APPROVED";
          } else if (rawStatusStr.includes("REJECT") || rawStatusStr.includes("TOLAK") || rawStatusStr.includes("REVISI") || rawStatusStr.includes("FAIL")) {
            status = "REJECTED";
          } else if (rawStatusStr.includes("PENDING") || rawStatusStr.includes("MENUNGGU")) {
            status = "PENDING";
          }

          return {
            submissionId: rawSubId ? parseInt(rawSubId) : undefined,
            memberId: rawMemId ? parseInt(rawMemId) : undefined,
            status,
            feedback: rawFeedbackVal ? String(rawFeedbackVal).trim() : "",
            bonusXp: rawBonusVal ? (parseInt(rawBonusVal) || 0) : 0,
          };
        }).filter(item => (item.submissionId && !isNaN(item.submissionId)) || (item.memberId && !isNaN(item.memberId)));

        if (itemsToUpdate.length === 0) {
          notify("error", "Tidak ditemukan data submisi valid pada file Excel");
          return;
        }

        setImportPreviewItems(itemsToUpdate);
        setImportStep("PREVIEW");
      } catch (err) {
        notify("error", "Gagal membaca file Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleExecuteImport = async () => {
    if (!importTask || importPreviewItems.length === 0) return;

    setImportStep("SAVING");
    setImportProgressLogs([
      "[1/3] File Excel berhasil dibaca & diverifikasi",
      "[2/3] Mengirim data submisi & memperbarui status di server...",
    ]);

    try {
      const res = await fetch(`/api/tasks/${importTask.id}/import-submissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: importPreviewItems }),
      });

      const resData = await res.json();
      if (res.ok) {
        setImportProgressLogs(prev => [
          ...prev,
          "[2/3] Status & catatan feedback berhasil diperbarui",
          "[3/3] Bonus XP berhasil dihitung & dikreditkan ke profil anggota",
        ]);

        if (resData.updatedSubmissions) {
          const updatedMap = new Map(resData.updatedSubmissions.map(s => [s.id, s]));
          setSubmissions(prev => prev.map(s => updatedMap.get(s.id) || s));
        }

        setImportSummary({
          message: resData.message || `Berhasil memperbarui ${importPreviewItems.length} submisi!`,
          count: importPreviewItems.length,
        });

        setTimeout(() => {
          setImportStep("SUCCESS");
          notify("success", resData.message || "Berhasil mengupdate submisi!");
        }, 600);
      } else {
        notify("error", resData.error || "Gagal meng-import file Excel");
        setImportStep("PREVIEW");
      }
    } catch (err) {
      notify("error", "Terjadi kesalahan koneksi saat import: " + err.message);
      setImportStep("PREVIEW");
    }
  };

  const handleDeleteTask = async () => {
    if (!targetTask?.id) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/tasks/${targetTask.id}`, { method: "DELETE" });
      if (res.ok) {
        setTasks(tasks.filter(t => t.id !== targetTask.id));
        setSubmissions(submissions.filter(s => s.taskId !== targetTask.id));
        notify("success", "Tugas berhasil dihapus!");
        setTaskDelModal(false);
      } else {
        const data = await res.json();
        notify("error", data.error || "Gagal menghapus tugas");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenReviewModal = (sub) => {
    setTargetSubmission(sub);
    setReviewStatus(sub.status === "PENDING" ? "APPROVED" : sub.status);
    setReviewFeedback(sub.feedback || "");
    setReviewBonusXp((sub.bonusXp || 0).toString());
    setReviewModal(true);
  };

  const handleSaveReview = async (e) => {
    e.preventDefault();
    if (!targetSubmission) return;
    setIsLoading(true);

    try {
      const res = await fetch(`/api/tasks/${targetSubmission.taskId}/submissions`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: targetSubmission.id,
          status: reviewStatus,
          feedback: reviewFeedback,
          bonusXp: parseInt(reviewBonusXp) || 0,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmissions(submissions.map(s => s.id === targetSubmission.id ? { ...s, ...data.submission } : s));
        notify("success", "Submisi berhasil ditinjau!");
        setReviewModal(false);
      } else {
        notify("error", data.error || "Gagal menyimpan review");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t =>
    (t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.description || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch =
      (s.member?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.task?.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.feedback || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTask = selectedTaskFilter === "ALL" || String(s.taskId) === String(selectedTaskFilter);
    const matchesStatus = selectedStatusFilter === "ALL" || s.status === selectedStatusFilter;

    return matchesSearch && matchesTask && matchesStatus;
  });

  const taskGroups = tasks
    .filter(t => selectedTaskFilter === "ALL" || String(t.id) === String(selectedTaskFilter))
    .map(t => {
      const taskSubs = filteredSubmissions.filter(s => s.taskId === t.id);
      return {
        task: t,
        submissions: taskSubs,
      };
    })
    .filter(group => {
      if (searchQuery || selectedStatusFilter !== "ALL") {
        return group.submissions.length > 0;
      }
      return true;
    });

  const orphanSubs = filteredSubmissions.filter(
    s => !tasks.some(t => t.id === s.taskId)
  );

  return (
    <div className="w-full relative">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <FolderKanban className="w-8 h-8 text-primary" />
            Tugas & Penugasan
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola penugasan operasional untuk anggota SRE UPNVJT dan tinjau submisi mereka.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder={activeTab === "tasks" ? "Cari tugas..." : "Cari anggota / tugas..."}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          {activeTab === "tasks" && canCreate && (
            <button
              onClick={() => handleOpenTaskModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-5 h-5" />
              <span>Buat Tugas</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 dark:bg-white/[0.03] p-1 rounded-2xl w-fit border border-gray-200 dark:border-white/10">
        {[
          { key: "tasks", label: "Daftar Tugas", icon: FolderKanban },
          { key: "submissions", label: "Submisi Anggota", icon: ShieldCheck },
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

      {/* Tab: Tasks */}
      {activeTab === "tasks" && (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
                <tr>
                  {["Nama Tugas", "Tenggat Waktu", "XP Reward", "Submisi", "Aksi"].map(h => (
                    <th key={h} className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <AnimatePresence>
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                          <FolderKanban className="w-10 h-10" />
                          <p className="font-medium">Belum ada tugas dibuat</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTasks.map(tk => (
                    <tr key={tk.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900 dark:text-white text-sm">{tk.title}</div>
                        <span className="text-xs text-gray-400 dark:text-white/30 line-clamp-1 mt-0.5 max-w-[320px]">
                          {tk.description}
                        </span>
                        {tk.folderId && (
                          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold">
                            GDrive: {tk.folderId}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-white/60">
                        {(() => {
                          const isOverdue = tk.deadline && new Date(tk.deadline) < new Date();
                          return (
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isOverdue 
                                  ? "bg-red-500/10 text-red-500 border border-red-500/20" 
                                  : "text-gray-500 dark:text-white/60"
                              }`}>
                                <Calendar className={`w-3.5 h-3.5 ${isOverdue ? "text-red-500" : "text-primary"}`} />
                                <span>
                                  {new Date(tk.deadline).toLocaleDateString("id-ID", {
                                    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false
                                  })}
                                </span>
                                {isOverdue && (
                                  <span className="ml-1 text-[9px] uppercase font-black px-1.5 py-0.5 rounded bg-red-500 text-white">
                                    Berakhir
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                          <Award className="w-3.5 h-3.5" /> +{tk.rewardXp} XP
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-white/70">
                        {tk.submissionCount || 0} Submisi
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          {canUpdate && (
                            <button
                              onClick={() => handleOpenTaskModal(tk)}
                              className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 border border-transparent hover:border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/70 flex items-center justify-center hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => { setTargetTask(tk); setTaskDelModal(true); }}
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
          {/* Submissions Control Header */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white/40 dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-200/50 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-white/80">
              <Filter className="w-4 h-4 text-primary" />
              <span>Filter Submisi:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <CustomSelect
                value={selectedTaskFilter}
                onChange={setSelectedTaskFilter}
                options={[
                  { value: "ALL", label: `Semua Tugas (${tasks.length})` },
                  ...tasks.map(t => ({ value: t.id.toString(), label: t.title })),
                ]}
                icon={FolderKanban}
              />

              <CustomSelect
                value={selectedStatusFilter}
                onChange={setSelectedStatusFilter}
                options={[
                  { value: "ALL", label: "Semua Status" },
                  { value: "PENDING", label: "Menunggu Review" },
                  { value: "APPROVED", label: "Disetujui" },
                  { value: "REJECTED", label: "Ditolak / Revisi" },
                ]}
                icon={Filter}
              />
            </div>
          </div>

          {/* Grouped Tasks Container */}
          {taskGroups.length === 0 && orphanSubs.length === 0 ? (
            <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-12 text-center backdrop-blur-xl">
              <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
                <ShieldCheck className="w-12 h-12 text-gray-400" />
                <p className="font-semibold text-base text-gray-900 dark:text-white">Tidak ada submisi ditemukan</p>
                <p className="text-xs text-gray-500 dark:text-white/40">Coba ubah kata kunci pencarian atau filter tugas & status.</p>
              </div>
            </div>
          ) : (
            taskGroups.map((group) => {
              const { task: tk, submissions: groupSubs } = group;
              const isCollapsed = Boolean(collapsedTasks[tk.id]);
              const pendingCount = groupSubs.filter(s => s.status === "PENDING").length;
              const approvedCount = groupSubs.filter(s => s.status === "APPROVED").length;
              const rejectedCount = groupSubs.filter(s => s.status === "REJECTED").length;

              return (
                <div
                  key={tk.id}
                  className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg transition-all"
                >
                  {/* Task Header Bar */}
                  <div
                    onClick={() => toggleTaskCollapse(tk.id)}
                    className="p-5 md:p-6 bg-gray-50/70 dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex items-start md:items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {tk.title}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold">
                            <Award className="w-3.5 h-3.5" /> +{tk.rewardXp} XP
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-white/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            Tenggat: {new Date(tk.deadline).toLocaleDateString("id-ID", {
                              day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-200/40 dark:border-white/5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 rounded-lg bg-gray-200/60 dark:bg-white/10 text-gray-700 dark:text-white/80 text-xs font-bold">
                          {groupSubs.length} Submisi
                        </span>
                        {pendingCount > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 text-xs font-bold">
                            {pendingCount} Review
                          </span>
                        )}
                        {approvedCount > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold">
                            {approvedCount} Disetujui
                          </span>
                        )}
                        {rejectedCount > 0 && (
                          <span className="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25 text-xs font-bold">
                            {rejectedCount} Ditolak
                          </span>
                        )}
                      </div>

                      {/* Export & Import Excel (.xlsx) Buttons */}
                      <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => exportTaskToExcel(tk, groupSubs)}
                          title="Export ke file Excel (.xlsx)"
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 text-xs font-bold transition-all shadow-sm hover:scale-105"
                        >
                          <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                          <span>Export Excel (.xlsx)</span>
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleOpenImportModal(tk)}
                            title="Buka modal import file Excel untuk memilih file & memantau proses update"
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border border-blue-500/25 text-xs font-bold transition-all shadow-sm hover:scale-105"
                          >
                            <Upload className="w-4 h-4 text-blue-500" />
                            <span>Import Excel</span>
                          </button>
                        )}
                      </div>

                      <div className="p-1.5 rounded-lg bg-gray-200/50 dark:bg-white/5 text-gray-500 dark:text-white/60">
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Table of Submissions for this Task */}
                  {!isCollapsed && (
                    <div className="overflow-x-auto w-full">
                      {groupSubs.length === 0 ? (
                        <div className="py-8 text-center text-xs font-medium text-gray-400 dark:text-white/30">
                          Belum ada submisi anggota untuk tugas ini
                        </div>
                      ) : (
                        <table className="w-full min-w-[800px] text-left">
                          <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
                            <tr>
                              {["Nama Anggota", "Waktu Submisi", "File Submisi", "Status", "Feedback", "Aksi"].map(h => (
                                <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {groupSubs.map(sub => (
                              <tr key={sub.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                                <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                                  {sub.member?.name || `ID User: ${sub.memberId}`}
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/60">
                                  {sub.submittedAt ? (
                                    new Date(sub.submittedAt).toLocaleDateString("id-ID", {
                                      day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
                                    })
                                  ) : "—"}
                                </td>
                                <td className="px-6 py-4 text-sm">
                                  {sub.fileUrl ? (
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      {sub.fileUrl.split(",").map((rawUrl, idx, arr) => {
                                        const url = rawUrl.trim();
                                        if (!url) return null;
                                        return (
                                          <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold transition-all text-xs inline-flex items-center gap-1 shrink-0"
                                            title={`Buka Link ${arr.length > 1 ? `#${idx + 1}` : ""}`}
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                            {arr.length > 1 ? `File #${idx + 1}` : "Buka Link File"}
                                          </a>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-xs">Tidak ada file</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                                      sub.status === "APPROVED"
                                        ? "bg-green-500/10 text-green-400 border-green-500/25"
                                        : sub.status === "REJECTED"
                                        ? "bg-red-500/10 text-red-400 border-red-500/25"
                                        : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                                    }`}>
                                      {sub.status === "APPROVED" ? "Disetujui" : sub.status === "REJECTED" ? "Ditolak / Revisi" : "Menunggu Review"}
                                    </span>
                                    {sub.bonusXp > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                                        +{sub.bonusXp} Bonus XP
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50 max-w-[200px] truncate">
                                  {sub.feedback || <span className="opacity-30">—</span>}
                                </td>
                                <td className="px-6 py-4">
                                  {canUpdate && (
                                    <button
                                      onClick={() => handleOpenReviewModal(sub)}
                                      className="h-8 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all"
                                    >
                                      Tinjau / Review
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Orphan Submissions group if any */}
          {orphanSubs.length > 0 && (
            <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg mt-6">
              <div className="p-5 bg-gray-50/70 dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/10">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Submisi Tugas Lainnya / Terhapus</h3>
              </div>
              <div className="overflow-x-auto w-full">
                <table className="w-full min-w-[800px] text-left">
                  <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
                    <tr>
                      {["Nama Anggota", "Tugas", "File Submisi", "Status", "Feedback", "Aksi"].map(h => (
                        <th key={h} className="px-6 py-3 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {orphanSubs.map(sub => (
                      <tr key={sub.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                        <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                          {sub.member?.name || `ID User: ${sub.memberId}`}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-white/70">
                          {sub.task?.title || `ID Tugas: ${sub.taskId}`}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {sub.fileUrl ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              {sub.fileUrl.split(",").map((rawUrl, idx, arr) => {
                                const url = rawUrl.trim();
                                if (!url) return null;
                                return (
                                  <a
                                    key={idx}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold transition-all text-xs inline-flex items-center gap-1 shrink-0"
                                    title={`Buka Link ${arr.length > 1 ? `#${idx + 1}` : ""}`}
                                  >
                                    <ExternalLink className="w-3 h-3" />
                                    {arr.length > 1 ? `File #${idx + 1}` : "Buka Link File"}
                                  </a>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Tidak ada file</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                            sub.status === "APPROVED" ? "bg-green-500/10 text-green-400 border-green-500/25" : sub.status === "REJECTED" ? "bg-red-500/10 text-red-400 border-red-500/25" : "bg-amber-500/10 text-amber-500 border-amber-500/25"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50 max-w-[200px] truncate">
                          {sub.feedback || <span className="opacity-30">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          {canUpdate && (
                            <button onClick={() => handleOpenReviewModal(sub)} className="h-8 px-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all">
                              Tinjau / Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Add/Edit Modal */}
      <AnimatePresence>
        {taskModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseTaskModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <FolderKanban className="w-5 h-5 text-primary" />
                  {targetTask ? "Edit Tugas" : "Tugas Baru"}
                </h2>
                <button onClick={handleCloseTaskModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="taskForm" onSubmit={handleSaveTask} className="space-y-5">
                  <InputField label="Judul Tugas *">
                    <input type="text" required value={taskForm.title}
                      onChange={e => setTaskForm(p => ({ ...p, title: e.target.value }))}
                      className={inputCls} placeholder="e.g. Laporan Kegiatan Divisi ACE" />
                  </InputField>

                  <InputField label="Deskripsi Tugas *">
                    <textarea required rows={4} value={taskForm.description}
                      onChange={e => setTaskForm(p => ({ ...p, description: e.target.value }))}
                      className={`${textareaCls} h-28`} placeholder="Instruksi dan rincian pengerjaan tugas..." />
                  </InputField>

                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Tenggat Waktu * (Format 24 Jam)">
                      <input type="datetime-local" required step="60" value={taskForm.deadline}
                        onChange={e => setTaskForm(p => ({ ...p, deadline: e.target.value }))}
                        className={inputCls} />
                    </InputField>
                    <InputField label="XP Reward">
                      <input type="number" required min="0" value={taskForm.rewardXp}
                        onChange={e => setTaskForm(p => ({ ...p, rewardXp: e.target.value }))}
                        className={inputCls} />
                    </InputField>
                  </div>

                  <InputField label="Tipe Pengumpulan Tugas *">
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: "FILE", label: "File / Berkas Upload" },
                        { value: "LINK", label: "Link / Tautan URL" },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setTaskForm(p => ({ ...p, submissionType: opt.value }))}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                            taskForm.submissionType === opt.value
                              ? "bg-primary/15 text-primary border-primary dark:text-primary-light shadow-sm"
                              : "bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </InputField>

                  {taskForm.submissionType === "FILE" && (
                    <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-2xl space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InputField label="Maksimal Ukuran File (MB)">
                          <input
                            type="number"
                            min="1"
                            max="500"
                            value={taskForm.maxUploadSizeMb}
                            onChange={e => setTaskForm(p => ({ ...p, maxUploadSizeMb: e.target.value }))}
                            className={inputCls}
                            placeholder="Contoh: 10"
                          />
                        </InputField>
                        <div className="flex flex-col justify-end">
                          <label className="flex items-center gap-3 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl cursor-pointer hover:border-primary/50 transition-all">
                            <input
                              type="checkbox"
                              checked={taskForm.allowMultipleFiles}
                              onChange={e => setTaskForm(p => ({ ...p, allowMultipleFiles: e.target.checked }))}
                              className="w-4 h-4 rounded text-primary focus:ring-primary accent-emerald-500"
                            />
                            <span className="text-xs font-bold text-gray-800 dark:text-white">Boleh &gt; 1 File</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  <InputField label="Google Drive Folder ID (Opsional)">
                    <input type="text" value={taskForm.folderId}
                      onChange={e => setTaskForm(p => ({ ...p, folderId: e.target.value }))}
                      className={inputCls} placeholder="Contoh: 1WX9qOsbnLeGT44cdoV1uvY4jkvNu8f1E" />
                    <span className="text-[11px] text-gray-500 dark:text-white/40 mt-1 block">
                      ID Folder Google Drive tempat berkas submisi tugas ini disimpan. Kosongkan jika ingin menggunakan folder default.
                    </span>
                  </InputField>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseTaskModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="taskForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Delete Modal */}
      <AnimatePresence>
        {taskDelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setTaskDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Tugas?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Seluruh data submisi anggota untuk tugas ini juga akan terhapus secara permanen.</p>
              <div className="flex gap-3">
                <button onClick={() => setTaskDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDeleteTask} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Submisi Modal */}
      <AnimatePresence>
        {reviewModal && targetSubmission && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReviewModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  Review Submisi Tugas
                </h2>
                <button onClick={() => setReviewModal(false)} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                {(() => {
                  const targetTaskObj = tasks.find(t => t.id === targetSubmission.taskId);
                  const baseRewardXp = targetTaskObj?.rewardXp || 0;
                  const speedBonusXp = calculateSpeedBonusXp(
                    targetTaskObj?.createdAt,
                    targetTaskObj?.deadline,
                    targetSubmission.submittedAt
                  );
                  const addedBonusXp = parseInt(reviewBonusXp) || 0;
                  const isApproved = reviewStatus === "APPROVED";
                  const totalXpGained = isApproved ? (baseRewardXp + speedBonusXp + addedBonusXp) : 0;

                  const isLate = new Date(targetSubmission.submittedAt).getTime() >= new Date(targetTaskObj?.deadline).getTime();

                  return (
                    <div className="p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Anggota</div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">
                            {targetSubmission.member?.name || `User ${targetSubmission.memberId}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          {targetSubmission.fileUrl ? (
                            targetSubmission.fileUrl.split(",").map((rawUrl, idx, arr) => {
                              const url = rawUrl.trim();
                              if (!url) return null;
                              return (
                                <a
                                  key={idx}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  {arr.length > 1 ? `Buka File #${idx + 1}` : "Buka Link Submisi"}
                                </a>
                              );
                            })
                          ) : (
                            <span className="text-gray-400 text-xs">Tidak ada file</span>
                          )}
                        </div>
                      </div>

                      {/* XP Breakdown Card */}
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2 text-xs">
                        <div className="flex items-center justify-between text-gray-600 dark:text-white/70">
                          <span>XP Dasar Tugas ({targetTaskObj?.title}):</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">+{baseRewardXp} XP</span>
                        </div>

                        <div className="flex items-center justify-between text-gray-600 dark:text-white/70">
                          <span className="flex items-center gap-1.5">
                            <span>Bonus Kecepatan Pengumpulkan:</span>
                            {isLate ? (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-semibold border border-red-500/20">Terlambat (0 XP)</span>
                            ) : (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-semibold border border-blue-500/20">Tepat Waktu (+{speedBonusXp} XP)</span>
                            )}
                          </span>
                          <span className="font-bold text-blue-500">+{speedBonusXp} XP</span>
                        </div>

                        {addedBonusXp > 0 && (
                          <div className="flex items-center justify-between text-gray-600 dark:text-white/70">
                            <span>Bonus Admin / Extra:</span>
                            <span className="font-bold text-amber-500">+{addedBonusXp} XP</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-amber-500/20 font-extrabold text-amber-600 dark:text-amber-400">
                          <span>Estimasi Total XP Diterima Anggota:</span>
                          <span className="text-sm">+{totalXpGained} XP</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <form id="reviewForm" onSubmit={handleSaveReview} className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Pilih Status Peninjauan</label>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: "APPROVED", label: "Setujui (Approve)", color: "border-green-500/20 text-green-400 bg-green-500/5", activeColor: "border-green-500 bg-green-500/20 text-green-300" },
                        { key: "REJECTED", label: "Tolak (Reject)", color: "border-red-500/20 text-red-400 bg-red-500/5", activeColor: "border-red-500 bg-red-500/20 text-red-300" },
                      ].map(st => (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setReviewStatus(st.key)}
                          className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                            reviewStatus === st.key ? st.activeColor : st.color
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <InputField label="Bonus XP / Poin Tambahan (Opsional)">
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={reviewBonusXp}
                        onChange={e => setReviewBonusXp(e.target.value)}
                        className={inputCls}
                        placeholder="Contoh: 10 atau 20 (Kosongkan/0 jika tidak ada bonus)"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20">
                        +XP Poin
                      </span>
                    </div>
                  </InputField>

                  <InputField label="Feedback / Catatan Peninjauan">
                    <textarea rows={3} value={reviewFeedback}
                      onChange={e => setReviewFeedback(e.target.value)}
                      className={`${textareaCls} h-24`} placeholder="Tuliskan catatan perbaikan atau apresiasi..." />
                  </InputField>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={() => setReviewModal(false)} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="reviewForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan Review"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Import Excel Submissions */}
      <AnimatePresence>
        {importModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      Import Submisi Excel (.xlsx)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      Tugas: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{importTask?.title}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseImportModal}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">

                {/* STEP 1: IDLE - Upload Area */}
                {importStep === "IDLE" && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-600 dark:text-blue-400 space-y-1.5">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        Petunjuk Import Data Submisi:
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90 pl-1">
                        <li>Gunakan file Excel yang di-export dari tombol <strong>Export Excel (.xlsx)</strong>.</li>
                        <li>Isikan status pada kolom <strong>Status (APPROVED / REJECTED / PENDING)</strong>.</li>
                        <li>Tuliskan saran/apresiasi pada kolom <strong>Catatan Feedback</strong>.</li>
                        <li>Isikan angka pada kolom <strong>Bonus XP</strong> jika ingin memberi bonus XP ekstra ke anggota.</li>
                      </ul>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-2xl cursor-pointer bg-gray-50/50 dark:bg-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all group">
                      <div className="flex flex-col items-center justify-center p-6 text-center">
                        <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500 mb-3 group-hover:scale-110 transition-transform">
                          <Upload className="w-8 h-8" />
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                          Klik atau Seret File Excel (.xlsx / .xls) ke Sini
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white/40">
                          Format yang didukung: .xlsx, .xls
                        </p>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        className="hidden"
                        onChange={handleSelectImportFile}
                      />
                    </label>
                  </div>
                )}

                {/* STEP 2: PREVIEW - Review before committing */}
                {importStep === "PREVIEW" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                          File: {importFile?.name}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                        {importPreviewItems.length} Data Submisi Ditemukan
                      </span>
                    </div>

                    <div className="border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 font-semibold sticky top-0">
                          <tr>
                            <th className="p-2.5">ID Submisi</th>
                            <th className="p-2.5">ID User</th>
                            <th className="p-2.5">Status Baru</th>
                            <th className="p-2.5">Catatan Feedback</th>
                            <th className="p-2.5 text-right">Bonus XP</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                          {importPreviewItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-white/5">
                              <td className="p-2.5 font-mono text-gray-500">{item.submissionId || "-"}</td>
                              <td className="p-2.5 font-mono text-gray-500">{item.memberId || "-"}</td>
                              <td className="p-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.status === "APPROVED"
                                    ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                    : item.status === "REJECTED"
                                    ? "bg-red-500/15 text-red-500 border border-red-500/30"
                                    : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-gray-700 dark:text-white/80 max-w-[180px] truncate">
                                {item.feedback || <span className="opacity-40 italic">-</span>}
                              </td>
                              <td className="p-2.5 text-right font-bold text-amber-500">
                                {item.bonusXp > 0 ? `+${item.bonusXp} XP` : "0"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* STEP 3: SAVING - Progress log */}
                {importStep === "SAVING" && (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                    <RefreshCw className="w-10 h-10 text-emerald-500 animate-spin mb-2" />
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                      Sedang Memproses & Memperbarui Submisi...
                    </h4>
                    <div className="w-full max-w-md bg-gray-100 dark:bg-white/5 rounded-xl p-4 text-left font-mono text-xs space-y-2 border border-gray-200 dark:border-white/10">
                      {importProgressLogs.map((log, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEP 4: SUCCESS */}
                {importStep === "SUCCESS" && (
                  <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                      Import Excel Berhasil!
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-white/60 max-w-sm">
                      {importSummary?.message || `Berhasil memperbarui ${importSummary?.count || 0} data submisi, status, dan bonus XP ke sistem.`}
                    </p>
                  </div>
                )}

              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                {importStep === "IDLE" && (
                  <button
                    type="button"
                    onClick={handleCloseImportModal}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                  >
                    Batal
                  </button>
                )}

                {importStep === "PREVIEW" && (
                  <>
                    <button
                      type="button"
                      onClick={() => setImportStep("IDLE")}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                    >
                      Pilih File Lain
                    </button>
                    <button
                      type="button"
                      onClick={handleExecuteImport}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Proses Import & Berikan XP</span>
                    </button>
                  </>
                )}

                {importStep === "SUCCESS" && (
                  <button
                    type="button"
                    onClick={handleCloseImportModal}
                    className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/25"
                  >
                    Selesai & Tutup
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
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
