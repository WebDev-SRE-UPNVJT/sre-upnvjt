"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, Calendar, ClipboardCheck, Filter, User,
  FileSpreadsheet, Clock, ChevronDown, ChevronUp, Check,
  Lock, Unlock, Key, ShieldCheck, UserCheck, RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";

const STATUS_OPTIONS = ["PRESENT", "ABSENT", "LATE", "EXCUSED"];

const STATUS_METADATA = {
  PRESENT: { label: "Hadir", color: "bg-green-500/15 text-green-400 border-green-500/25" },
  ABSENT:  { label: "Alpa", color: "bg-red-500/15 text-red-400 border-red-500/25" },
  LATE:    { label: "Terlambat", color: "bg-amber-500/15 text-amber-400 border-amber-500/25" },
  EXCUSED: { label: "Izin/Sakit", color: "bg-blue-500/15 text-blue-400 border-blue-500/25" },
};

const EMPTY_SESSION_FORM = {
  title: "",
  description: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "",
  endTime: "",
  token: "",
  isActive: true,
};

const EMPTY_ATTENDANCE_FORM = {
  memberId: "",
  sessionId: "",
  status: "PRESENT",
  notes: "",
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

export default function AttendanceClient({ initialAttendance, members, initialSessions, currentUser }) {
  const { data: session } = useSession();
  const userObj = session?.user ?? currentUser;

  const [records, setRecords] = useState(initialAttendance || []);
  const [sessions, setSessions] = useState(initialSessions || []);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSession, setFilterSession] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [collapsedSessions, setCollapsedSessions] = useState({});

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Session Modal State
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionForm, setSessionForm] = useState(EMPTY_SESSION_FORM);
  const [targetSession, setTargetSession] = useState(null);
  const [sessionDelModal, setSessionDelModal] = useState(false);

  // Attendance Record Modal State
  const [attModal, setAttModal] = useState(false);
  const [attForm, setAttForm] = useState(EMPTY_ATTENDANCE_FORM);
  const [targetRecord, setTargetRecord] = useState(null);
  const [attDelModal, setAttDelModal] = useState(false);

  const canCreate = hasAccess(userObj, "attendance", "create");
  const canUpdate = hasAccess(userObj, "attendance", "update");
  const canDelete = hasAccess(userObj, "attendance", "delete");

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const toggleSessionCollapse = (sessId) => {
    setCollapsedSessions(prev => ({ ...prev, [sessId]: !prev[sessId] }));
  };

  // Session date formatting
const formatDateInput = (dStr) => {
  if (!dStr) return new Date().toISOString().slice(0, 10);
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatTimeInput = (dStr) => {
  if (!dStr) return "";
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

  const handleOpenSessionModal = (sess = null) => {
    if (sess) {
      setSessionForm({
        title: sess.title,
        description: sess.description || "",
        date: formatDateInput(sess.date),
        startTime: formatTimeInput(sess.startTime),
        endTime: formatTimeInput(sess.endTime),
        token: sess.token || "",
        isActive: sess.isActive,
      });
    } else {
      setSessionForm({ ...EMPTY_SESSION_FORM });
    }
    setTargetSession(sess);
    setSessionModal(true);
  };

  const handleCloseSessionModal = () => {
    setSessionModal(false);
    setTimeout(() => { setSessionForm(EMPTY_SESSION_FORM); setTargetSession(null); }, 300);
  };

  const handleSaveSession = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetSession?.id);

    const url = isEditing ? `/api/attendance/sessions/${targetSession.id}` : "/api/attendance/sessions";
    const method = isEditing ? "PUT" : "POST";

    const dateObj = new Date(sessionForm.date);
    let startDateTime = null;
    let endDateTime = null;

    if (sessionForm.startTime) {
      const [sh, sm] = sessionForm.startTime.split(":");
      startDateTime = new Date(dateObj);
      startDateTime.setHours(parseInt(sh), parseInt(sm));
    }

    if (sessionForm.endTime) {
      const [eh, em] = sessionForm.endTime.split(":");
      endDateTime = new Date(dateObj);
      endDateTime.setHours(parseInt(eh), parseInt(em));
    }

    let finalToken = sessionForm.token ? sessionForm.token.trim().toUpperCase() : "";
    if (!finalToken) {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      finalToken = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
    }

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sessionForm.title,
          description: sessionForm.description,
          date: dateObj.toISOString(),
          startTime: startDateTime ? startDateTime.toISOString() : null,
          endTime: endDateTime ? endDateTime.toISOString() : null,
          token: finalToken,
          isActive: sessionForm.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEditing) {
          setSessions(sessions.map(s => s.id === targetSession.id ? data.session : s));
        } else {
          setSessions([data.session, ...sessions]);
        }
        notify("success", isEditing ? "Sesi presensi diperbarui!" : "Sesi presensi baru berhasil dibuat!");
        handleCloseSessionModal();
      } else {
        notify("error", data.error || "Gagal menyimpan sesi presensi");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSessionActive = async (sess) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/sessions/${sess.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !sess.isActive }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(sessions.map(s => s.id === sess.id ? data.session : s));
        notify("success", `Sesi presensi ${!sess.isActive ? "diaktifkan" : "ditutup"}`);
      } else {
        notify("error", data.error || "Gagal memperbarui status sesi");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!targetSession?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/sessions/${targetSession.id}`, { method: "DELETE" });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== targetSession.id));
        setRecords(records.filter(r => r.sessionId !== targetSession.id));
        notify("success", "Sesi presensi berhasil dihapus");
        setSessionDelModal(false);
      } else {
        const data = await res.json();
        notify("error", data.error || "Gagal menghapus sesi presensi");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  // Record handlers
  const handleOpenAttModal = (sessId = "", rec = null) => {
    if (rec) {
      setAttForm({
        memberId: rec.memberId?.toString() || "",
        sessionId: rec.sessionId?.toString() || "",
        status: rec.status,
        notes: rec.notes || "",
      });
    } else {
      setAttForm({
        memberId: members[0]?.id?.toString() || "",
        sessionId: sessId?.toString() || (sessions[0]?.id?.toString() || ""),
        status: "PRESENT",
        notes: "",
      });
    }
    setTargetRecord(rec);
    setAttModal(true);
  };

  const handleCloseAttModal = () => {
    setAttModal(false);
    setTimeout(() => { setAttForm(EMPTY_ATTENDANCE_FORM); setTargetRecord(null); }, 300);
  };

  const handleSaveAttendance = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetRecord?.id);

    const url = isEditing ? `/api/attendance/${targetRecord.id}` : "/api/attendance";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: parseInt(attForm.memberId),
          sessionId: parseInt(attForm.sessionId),
          status: attForm.status,
          notes: attForm.notes,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        if (isEditing) {
          setRecords(records.map(r => r.id === targetRecord.id ? data.attendance : r));
        } else {
          setRecords([data.attendance, ...records]);
        }
        notify("success", isEditing ? "Catatan kehadiran diperbarui!" : "Presensi anggota ditambahkan!");
        handleCloseAttModal();
      } else {
        notify("error", data.error || "Gagal menyimpan presensi");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAttendance = async () => {
    if (!targetRecord?.id) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/attendance/${targetRecord.id}`, { method: "DELETE" });
      if (res.ok) {
        setRecords(records.filter(r => r.id !== targetRecord.id));
        notify("success", "Catatan presensi dihapus");
        setAttDelModal(false);
      } else {
        const data = await res.json();
        notify("error", data.error || "Gagal menghapus catatan presensi");
      }
    } catch {
      notify("error", "Terjadi kesalahan koneksi");
    } finally {
      setIsLoading(false);
    }
  };

  // Export session to Excel
  const exportSessionToExcel = async (sess, groupRecords) => {
    if (!groupRecords || groupRecords.length === 0) {
      notify("error", "Belum ada catatan presensi untuk diexport");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPNVJT Portal";
      workbook.lastModifiedBy = "SRE Admin";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Rekap Presensi");

      // Title Banner (Row 1)
      sheet.mergeCells("A1:G1");
      const titleCell = sheet.getCell("A1");
      titleCell.value = `SRE UPNVJT - REKAPITULASI PRESENSI: ${(sess.title || "SESI").toUpperCase()}`;
      titleCell.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(1).height = 30;

      // Subtitle Info (Row 2)
      sheet.mergeCells("A2:G2");
      const subCell = sheet.getCell("A2");
      const sessDateStr = sess.date ? new Date(sess.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
      subCell.value = `Tanggal Sesi: ${sessDateStr} | Status: ${sess.isActive ? "Aktif" : "Ditutup"} | Total Peserta: ${groupRecords.length}`;
      subCell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      subCell.alignment = { horizontal: "center", vertical: "middle" };
      sheet.getRow(2).height = 24;

      sheet.getRow(3).height = 10;

      // Headers (Row 4)
      const headers = ["No", "ID Presensi", "NPM", "Nama Anggota", "Status Kehadiran", "Waktu Presensi", "Catatan/Notes"];
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

      // Rows (Row 5+)
      groupRecords.forEach((r, idx) => {
        const rowNum = idx + 5;
        const row = sheet.getRow(rowNum);
        row.height = 22;

        const statusLabel = STATUS_METADATA[r.status]?.label || r.status;
        const rowValues = [
          idx + 1,
          r.id,
          r.member?.npm || "-",
          r.member?.name || `User ${r.memberId}`,
          statusLabel.toUpperCase(),
          r.createdAt ? new Date(r.createdAt).toLocaleString("id-ID") : "-",
          r.notes || "-",
        ];

        rowValues.forEach((val, colIdx) => {
          const cell = row.getCell(colIdx + 1);
          cell.value = val;
          cell.font = { name: "Arial", size: 10 };
          cell.alignment = { vertical: "middle" };

          if (colIdx === 0 || colIdx === 1 || colIdx === 2 || colIdx === 5) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
          }

          if (colIdx === 4) {
            cell.alignment = { horizontal: "center", vertical: "middle" };
            cell.font = { name: "Arial", size: 10, bold: true };
            if (r.status === "PRESENT") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF047857" } };
            } else if (r.status === "LATE") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB45309" } };
            } else if (r.status === "EXCUSED") {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDBEAFE" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FF1D4ED8" } };
            } else {
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
              cell.font = { name: "Arial", size: 10, bold: true, color: { argb: "FFB91C1C" } };
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
        { width: 14 },
        { width: 28 },
        { width: 18 },
        { width: 22 },
        { width: 30 },
      ];

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeTitle = (sess.title || "Sesi").replace(/[^a-zA-Z0-9_-]/g, "_");
      link.href = url;
      link.download = `Presensi_Sesi_${safeTitle}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      notify("success", `File Excel (.xlsx) presensi "${sess.title}" berhasil di-download!`);
    } catch (err) {
      notify("error", "Gagal meng-export Excel: " + err.message);
    }
  };

  // Grouping & filtering
  const sessionMap = useMemo(() => new Map(sessions.map(s => [s.id, s])), [sessions]);

  const sessionGroups = useMemo(() => {
    const map = new Map();

    sessions.forEach(s => {
      map.set(s.id, { session: s, records: [] });
    });

    records.forEach(r => {
      const sId = r.sessionId;
      const sObj = r.session || sessionMap.get(sId);
      if (!map.has(sId)) {
        map.set(sId, { session: sObj || { id: sId, title: `Sesi #${sId}` }, records: [] });
      }
      map.get(sId).records.push(r);
    });

    return Array.from(map.values()).filter(group => {
      if (filterSession !== "all" && group.session.id.toString() !== filterSession) {
        return false;
      }
      return true;
    });
  }, [sessions, records, filterSession, sessionMap]);

  const sessionFilterOptions = [
    { value: "all", label: `Semua Sesi (${sessions.length})` },
    ...sessions.map(s => ({ value: s.id.toString(), label: s.title }))
  ];

  const statusFilterOptions = [
    { value: "all", label: "Semua Status" },
    ...STATUS_OPTIONS.map(opt => ({ value: opt, label: STATUS_METADATA[opt]?.label || opt }))
  ];

  const memberOptions = members.map(m => ({
    value: m.id.toString(),
    label: `${m.name} ${m.npm ? `(${m.npm})` : ""}`,
  }));

  const inputCls = "w-full h-11 px-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all";

  return (
    <div className="w-full relative space-y-8">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2 backdrop-blur-xl ${
              notification.type === "success"
                ? "bg-emerald-500/90 text-white border-emerald-400"
                : "bg-red-500/90 text-white border-red-400"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Manajemen Sesi Presensi
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola sesi presensi kegiatan, pantau rekapitulasi kehadiran anggota, dan cetak laporan Excel (.xlsx).
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Cari anggota / sesi..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-gray-900 dark:text-white focus:outline-none"
            />
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => handleOpenSessionModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-3 rounded-xl font-bold text-xs tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Sesi Presensi</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="relative z-30 p-4 bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50">
            <Filter className="w-4 h-4 text-primary" />
            <span>Filter Sesi:</span>
          </div>
          <CustomSelect
            value={filterSession}
            onChange={setFilterSession}
            options={sessionFilterOptions}
            icon={Calendar}
          />

          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-white/50 ml-2">
            <span>Status Kehadiran:</span>
          </div>
          <CustomSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={statusFilterOptions}
            icon={Filter}
          />
        </div>

        <div className="text-xs text-gray-500 dark:text-white/40 font-medium">
          Menampilkan {sessionGroups.length} Sesi Presensi
        </div>
      </div>

      {/* Session Cards List */}
      {sessionGroups.length === 0 ? (
        <div className="p-16 text-center bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl backdrop-blur-xl">
          <ClipboardCheck className="w-12 h-12 text-gray-400 mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Belum ada sesi presensi</h3>
          <p className="text-xs text-gray-500 dark:text-white/40 mt-1">Klik "+ Tambah Sesi Presensi" untuk membuat sesi kegiatan baru.</p>
        </div>
      ) : (
        sessionGroups.map(({ session: sess, records: groupRecords }) => {
          const isCollapsed = Boolean(collapsedSessions[sess.id]);

          // Filter records by member searchQuery & filterStatus
          const filteredGroupRecords = groupRecords.filter(r => {
            const memberName = r.member?.name || `User ${r.memberId}`;
            const notes = r.notes || "";
            const matchSearch = memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
              notes.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchSearch) return false;

            if (filterStatus !== "all" && r.status !== filterStatus) return false;
            return true;
          });

          const totalCount = groupRecords.length;
          const presentCount = groupRecords.filter(r => r.status === "PRESENT").length;
          const lateCount = groupRecords.filter(r => r.status === "LATE").length;
          const excusedCount = groupRecords.filter(r => r.status === "EXCUSED").length;
          const absentCount = groupRecords.filter(r => r.status === "ABSENT").length;

          return (
            <div
              key={sess.id}
              className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg transition-all"
            >
              {/* Session Group Header */}
              <div className="p-5 md:p-6 bg-gray-50/70 dark:bg-white/[0.02] border-b border-gray-200/50 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 cursor-pointer select-none" onClick={() => toggleSessionCollapse(sess.id)}>
                  <button
                    type="button"
                    className="w-9 h-9 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 shrink-0"
                  >
                    {isCollapsed ? <ChevronDown className="w-4.5 h-4.5" /> : <ChevronUp className="w-4.5 h-4.5" />}
                  </button>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">
                        {sess.title}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${
                        sess.isActive
                          ? "bg-green-500/10 text-green-400 border-green-500/25"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/25"
                      }`}>
                        {sess.isActive ? "SESI AKTIF" : "DITUTUP"}
                      </span>
                      {sess.token && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <Key className="w-3 h-3" /> PIN: {sess.token}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-white/50 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        {sess.date ? new Date(sess.date).toLocaleDateString("id-ID", {
                          day: "numeric", month: "short", year: "numeric"
                        }) : "—"}
                      </span>
                      {sess.startTime && (
                        <span>
                          • Jam: {new Date(sess.startTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          {sess.endTime ? ` - ${new Date(sess.endTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : ""}
                        </span>
                      )}
                      {sess.createdBy?.name && (
                        <span>• Dibuat oleh {sess.createdBy.name}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Actions & Stats */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white/80 border border-gray-200 dark:border-white/10">
                      Total: {totalCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                      Hadir: {presentCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">
                      Terlambat: {lateCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Izin: {excusedCount}
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                      Alpa: {absentCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Record Attendance for Member Button */}
                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => handleOpenAttModal(sess.id)}
                        className="px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-bold transition-all flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Catat Anggota</span>
                      </button>
                    )}

                    {/* Export Excel Button */}
                    <button
                      type="button"
                      onClick={() => exportSessionToExcel(sess, groupRecords)}
                      disabled={totalCount === 0}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                      <span>Export Excel</span>
                    </button>

                    {/* Toggle Active / Close Session */}
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => handleToggleSessionActive(sess)}
                        title={sess.isActive ? "Tutup Sesi Presensi" : "Aktifkan Sesi Presensi"}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          sess.isActive
                            ? "bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20"
                            : "bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20"
                        }`}
                      >
                        {sess.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    )}

                    {/* Edit Session */}
                    {canUpdate && (
                      <button
                        type="button"
                        onClick={() => handleOpenSessionModal(sess)}
                        className="p-2 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete Session */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => { setTargetSession(sess); setSessionDelModal(true); }}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance Table Inside Session Card */}
              {!isCollapsed && (
                <div className="overflow-x-auto w-full">
                  <table className="w-full min-w-[800px] text-left">
                    <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.01]">
                      <tr>
                        {["No", "Nama Anggota", "NPM", "Status Kehadiran", "Waktu Presensi", "Catatan/Notes", "Aksi"].map(h => (
                          <th key={h} className="px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                      {filteredGroupRecords.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-xs text-gray-400 dark:text-white/30 font-medium">
                            Belum ada catatan presensi anggota untuk sesi ini.
                          </td>
                        </tr>
                      ) : (
                        filteredGroupRecords.map((rec, idx) => (
                          <tr key={rec.id} className="hover:bg-white/60 dark:hover:bg-white/[0.03] transition-all">
                            <td className="px-6 py-4 text-xs font-bold text-gray-400">
                              {idx + 1}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900 dark:text-white">
                              {rec.member?.name || `ID User: ${rec.memberId}`}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/60">
                              {rec.member?.npm || <span className="opacity-30">—</span>}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold border ${
                                STATUS_METADATA[rec.status]?.color || "bg-gray-500/10 text-gray-400 border-gray-500/20"
                              }`}>
                                {STATUS_METADATA[rec.status]?.label || rec.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50">
                              {rec.createdAt ? new Date(rec.createdAt).toLocaleString("id-ID") : "—"}
                            </td>
                            <td className="px-6 py-4 text-xs text-gray-500 dark:text-white/50 max-w-[200px] truncate">
                              {rec.notes || <span className="opacity-30">—</span>}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                {canUpdate && (
                                  <button
                                    onClick={() => handleOpenAttModal(sess.id, rec)}
                                    className="p-1.5 rounded-lg bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 border border-gray-200 dark:border-white/10"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => { setTargetRecord(rec); setAttDelModal(true); }}
                                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
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

      {/* Modal: Session */}
      <AnimatePresence>
        {sessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseSessionModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  {targetSession ? "Edit Sesi Presensi" : "Tambah Sesi Presensi Baru"}
                </h2>
                <button onClick={handleCloseSessionModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="sessionForm" onSubmit={handleSaveSession} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Judul Sesi Presensi *</label>
                    <input
                      type="text"
                      required
                      value={sessionForm.title}
                      onChange={e => setSessionForm(p => ({ ...p, title: e.target.value }))}
                      className={inputCls}
                      placeholder="e.g. Rapat Pleno Divisi Tech & IT / Workshop Energi Terbarukan"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Deskripsi / Agenda Kegiatan</label>
                    <textarea
                      rows={3}
                      value={sessionForm.description}
                      onChange={e => setSessionForm(p => ({ ...p, description: e.target.value }))}
                      className={`${inputCls} h-20 py-3 resize-none`}
                      placeholder="Agenda pembahasan atau instruksi presensi..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Tanggal Sesi *</label>
                      <input
                        type="date"
                        required
                        value={sessionForm.date}
                        onChange={e => setSessionForm(p => ({ ...p, date: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase">Kode PIN / Token</label>
                        <button
                          type="button"
                          onClick={() => {
                            const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
                            const randToken = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join("");
                            setSessionForm(p => ({ ...p, token: randToken }));
                          }}
                          className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Acak Token
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={10}
                        value={sessionForm.token}
                        onChange={e => setSessionForm(p => ({ ...p, token: e.target.value.toUpperCase() }))}
                        className={`${inputCls} font-mono font-bold uppercase tracking-wider`}
                        placeholder="Kosongkan untuk otomatis acak (Contoh: SRE78A)"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Waktu Mulai (24 Jam)</label>
                      <input
                        type="time"
                        step="60"
                        value={sessionForm.startTime}
                        onChange={e => setSessionForm(p => ({ ...p, startTime: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Waktu Selesai (24 Jam)</label>
                      <input
                        type="time"
                        step="60"
                        value={sessionForm.endTime}
                        onChange={e => setSessionForm(p => ({ ...p, endTime: e.target.value }))}
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActiveCheck"
                      checked={sessionForm.isActive}
                      onChange={e => setSessionForm(p => ({ ...p, isActive: e.target.checked }))}
                      className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary accent-primary cursor-pointer"
                    />
                    <label htmlFor="isActiveCheck" className="text-xs font-bold text-gray-700 dark:text-white/80 cursor-pointer">
                      Sesi Presensi Langsung Aktif (Anggota Bisa Absen)
                    </label>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseSessionModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="sessionForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan Sesi Presensi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Attendance Record */}
      <AnimatePresence>
        {attModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleCloseAttModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  {targetRecord ? "Edit Presensi Anggota" : "Catat Presensi Anggota"}
                </h2>
                <button onClick={handleCloseAttModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-5">
                <form id="attForm" onSubmit={handleSaveAttendance} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Pilih Anggota *</label>
                    <CustomSelect
                      value={attForm.memberId}
                      onChange={val => setAttForm(p => ({ ...p, memberId: val }))}
                      options={memberOptions}
                      icon={User}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Pilih Sesi Presensi *</label>
                    <CustomSelect
                      value={attForm.sessionId}
                      onChange={val => setAttForm(p => ({ ...p, sessionId: val }))}
                      options={sessions.map(s => ({ value: s.id.toString(), label: s.title }))}
                      icon={Calendar}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Status Kehadiran *</label>
                    <div className="grid grid-cols-2 gap-3">
                      {STATUS_OPTIONS.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setAttForm(p => ({ ...p, status: st }))}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                            attForm.status === st
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5"
                          }`}
                        >
                          {STATUS_METADATA[st]?.label || st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">Catatan / Alasan (Opsional)</label>
                    <textarea
                      rows={3}
                      value={attForm.notes}
                      onChange={e => setAttForm(p => ({ ...p, notes: e.target.value }))}
                      className={`${inputCls} h-20 py-3 resize-none`}
                      placeholder="e.g. Sakit disertai surat dokter / Izin kegiatan perkuliahan"
                    />
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/[0.02]">
                <button type="button" onClick={handleCloseAttModal} className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10">Batal</button>
                <button type="submit" form="attForm" disabled={isLoading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-primary text-[#050e0a] hover:bg-primary-focus flex items-center gap-2">
                  {isLoading ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : "Simpan Presensi"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Session Modal */}
      <AnimatePresence>
        {sessionDelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSessionDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Sesi Presensi?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Seluruh data presensi anggota pada sesi ini juga akan terhapus secara permanen.</p>
              <div className="flex gap-3">
                <button onClick={() => setSessionDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDeleteSession} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Record Modal */}
      <AnimatePresence>
        {attDelModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setAttDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/25">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Catatan Presensi?</h3>
              <p className="text-xs text-gray-500 dark:text-white/40 mb-6">Catatan kehadiran anggota ini akan dihapus dari sistem.</p>
              <div className="flex gap-3">
                <button onClick={() => setAttDelModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5">Batal</button>
                <button onClick={handleDeleteAttendance} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600">Hapus</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
