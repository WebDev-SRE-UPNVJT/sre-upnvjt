"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Presentation,
  Search,
  CheckCircle2,
  Clock,
  Users,
  Award,
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
  FileSpreadsheet,
  UserCheck,
  TrendingUp,
  SlidersHorizontal,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import ExcelJS from "exceljs";

export default function ModuleProgressClient({ initialData, currentUser }) {
  const modules = initialData?.modules || [];
  const phases = initialData?.phases || [];
  const members = initialData?.members || [];
  const mentorGroups = initialData?.mentorGroups || [];
  const isRestrictedMentor = initialData?.isRestrictedMentor || false;

  // View Mode: 'matrix' (tabel per member) | 'module' (kartu per modul)
  const [viewMode, setViewMode] = useState("matrix");

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState("ALL");
  const [selectedModuleFilter, setSelectedModuleFilter] = useState("ALL");
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("ALL");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("ALL"); // 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'NOT_STARTED'

  // Selected Member for detailed modal
  const [selectedMember, setSelectedMember] = useState(null);

  // Notification Toast
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Filter Modules by Phase
  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchPhase =
        selectedPhaseFilter === "ALL" || String(m.phaseId) === String(selectedPhaseFilter);
      const matchModule =
        selectedModuleFilter === "ALL" || String(m.id) === String(selectedModuleFilter);
      return matchPhase && matchModule;
    });
  }, [modules, selectedPhaseFilter, selectedModuleFilter]);

  // Filtered Members
  const filteredMembers = useMemo(() => {
    return members.filter((mem) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        mem.name.toLowerCase().includes(q) ||
        (mem.npm && mem.npm.toLowerCase().includes(q)) ||
        mem.email.toLowerCase().includes(q) ||
        (mem.group?.groupName && mem.group.groupName.toLowerCase().includes(q));

      const matchGroup =
        selectedGroupFilter === "ALL" ||
        (mem.group && String(mem.group.groupId) === String(selectedGroupFilter));

      let matchStatus = true;
      if (selectedStatusFilter === "COMPLETED") {
        matchStatus = mem.overallProgressPct === 100;
      } else if (selectedStatusFilter === "IN_PROGRESS") {
        matchStatus = mem.overallProgressPct > 0 && mem.overallProgressPct < 100;
      } else if (selectedStatusFilter === "NOT_STARTED") {
        matchStatus = mem.overallProgressPct === 0;
      }

      return matchSearch && matchGroup && matchStatus;
    });
  }, [members, searchQuery, selectedGroupFilter, selectedStatusFilter]);

  // Overall Metrics
  const stats = useMemo(() => {
    const totalMembers = filteredMembers.length;
    const totalModules = modules.length;
    let completedAllCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;
    let totalProgressSum = 0;

    filteredMembers.forEach((mem) => {
      totalProgressSum += mem.overallProgressPct || 0;
      if (mem.overallProgressPct === 100) completedAllCount++;
      else if (mem.overallProgressPct > 0) inProgressCount++;
      else notStartedCount++;
    });

    const averageProgress =
      totalMembers > 0 ? Math.round(totalProgressSum / totalMembers) : 0;

    return {
      totalMembers,
      totalModules,
      completedAllCount,
      inProgressCount,
      notStartedCount,
      averageProgress,
    };
  }, [filteredMembers, modules]);

  // Export to Excel Matrix
  const handleExportExcel = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPNVJT Portal";
      workbook.created = new Date();

      const sheet = workbook.addWorksheet("Monitoring Progres Modul");

      const headers = [
        "Nama Member",
        "NPM",
        "Email",
        "Departemen",
        "Kelompok Mentoring",
        "Rata-rata Progres (%)",
        "Modul Selesai",
      ];

      filteredModules.forEach((m) => {
        headers.push(`${m.title} (${(m.slides || []).length} Slide)`);
      });

      sheet.addRow(headers);

      const headerRow = sheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF064E3B" },
      };

      filteredMembers.forEach((mem) => {
        const row = [
          mem.name,
          mem.npm || "-",
          mem.email,
          mem.department?.name || "-",
          mem.group?.groupName || "Belum ada kelompok",
          `${mem.overallProgressPct}%`,
          `${mem.totalCompletedModules} / ${mem.totalModulesCount}`,
        ];

        filteredModules.forEach((m) => {
          const p = mem.moduleProgress?.[m.id];
          if (!p) {
            row.push("0% (Belum dibaca)");
          } else if (p.isCompleted || p.progressPct === 100) {
            row.push("100% (SELESAI)");
          } else {
            row.push(`${p.progressPct}% (Slide ${p.maxSlideIdx + 1}/${p.totalSlides})`);
          }
        });

        sheet.addRow(row);
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
      anchor.download = `Monitoring_Progres_Modul_${new Date().toISOString().slice(0, 10)}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);
      notify("success", "File Excel monitoring berhasil di-export!");
    } catch (err) {
      console.error(err);
      notify("error", "Gagal export Excel: " + err.message);
    }
  };

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
              <BookOpen className="w-8 h-8 text-primary" />
              Monitoring Progres Modul
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
              ? "Pantau perkembangan membaca modul pembelajaran PPT dari member kelompok mentoring Anda."
              : "Pantau kemajuan membaca modul pembelajaran PPT dari setiap anggota SRE UPNVJT secara real-time."}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input
              type="text"
              placeholder="Cari member / kelompok..."
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
            <span>Export Matriks</span>
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
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Member Dipantau</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white">{stats.totalMembers}</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-500 flex items-center justify-center font-bold">
            <Presentation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">Total Modul</p>
            <h3 className="text-2xl font-black text-teal-600 dark:text-teal-400">{stats.totalModules}</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Rata-rata Progres</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{stats.averageProgress}%</h3>
          </div>
        </div>

        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 backdrop-blur-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Selesai 100%</p>
            <h3 className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.completedAllCount} Member</h3>
          </div>
        </div>
      </div>

      {/* ── Filters Toolbar ── */}
      <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl p-4 mb-6 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          {phases.length > 0 && (
            <select
              value={selectedPhaseFilter}
              onChange={(e) => setSelectedPhaseFilter(e.target.value)}
              className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white/80 focus:outline-none focus:border-primary"
            >
              <option value="ALL">Semua Phase ({phases.length})</option>
              {phases.map((ph) => (
                <option key={ph.id} value={ph.id}>
                  {ph.name}
                </option>
              ))}
            </select>
          )}

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

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-white/80 focus:outline-none focus:border-primary"
          >
            <option value="ALL">Semua Status</option>
            <option value="COMPLETED">Selesai 100%</option>
            <option value="IN_PROGRESS">Sedang Membaca</option>
            <option value="NOT_STARTED">Belum Membaca (0%)</option>
          </select>

          {/* View Toggles */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setViewMode("matrix")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "matrix"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Matriks</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("module")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                viewMode === "module"
                  ? "bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 dark:text-white/50 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Per Modul</span>
            </button>
          </div>
        </div>

        <span className="text-xs text-gray-500 dark:text-white/40 font-semibold">
          Menampilkan {filteredMembers.length} member
        </span>
      </div>

      {/* ── Content Views ── */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-16 text-center backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-gray-500 dark:text-white/30">
            <BookOpen className="w-12 h-12 text-gray-400" />
            <p className="font-semibold text-base text-gray-900 dark:text-white">Tidak ada data member ditemukan</p>
            <p className="text-xs text-gray-500 dark:text-white/40">Coba sesuaikan kata kunci pencarian atau filter kelompok.</p>
          </div>
        </div>
      ) : viewMode === "matrix" ? (
        /* ── VIEW 1: MATRIX TABLE VIEW ── */
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50/70 dark:bg-white/[0.03] border-b border-gray-200/50 dark:border-white/10">
                <tr>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 sticky left-0 bg-gray-50/90 dark:bg-[#08120e] z-10 w-64">
                    Member & Kelompok
                  </th>
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 w-36 text-center">
                    Total Progres
                  </th>
                  {filteredModules.map((m) => (
                    <th
                      key={m.id}
                      className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 min-w-[170px]"
                    >
                      <div className="truncate max-w-[160px]" title={m.title}>
                        {m.title}
                      </div>
                      <span className="text-[10px] font-normal text-gray-400 block lowercase font-mono">
                        {(m.slides || []).length} slide
                      </span>
                    </th>
                  ))}
                  <th className="p-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 w-24 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {filteredMembers.map((mem) => (
                  <tr key={mem.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    {/* Member Column */}
                    <td className="p-4 sticky left-0 bg-white/90 dark:bg-[#07130e] z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white shrink-0 overflow-hidden">
                          {mem.profilePictureUrl ? (
                            <img src={mem.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            mem.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{mem.name}</p>
                          <p className="text-xs text-gray-400 truncate">{mem.npm || mem.email}</p>
                          {mem.group && (
                            <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold mt-1 truncate max-w-[160px]">
                              {mem.group.groupName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Overall Progress Gauge */}
                    <td className="p-4 text-center">
                      <div className="inline-flex flex-col items-center gap-1">
                        <span className="text-sm font-black text-gray-900 dark:text-white font-mono">
                          {mem.overallProgressPct}%
                        </span>
                        <div className="w-24 h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              mem.overallProgressPct === 100
                                ? "bg-emerald-500"
                                : mem.overallProgressPct > 0
                                ? "bg-primary"
                                : "bg-transparent"
                            }`}
                            style={{ width: `${mem.overallProgressPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {mem.totalCompletedModules}/{mem.totalModulesCount} selesai
                        </span>
                      </div>
                    </td>

                    {/* Per Module Cells */}
                    {filteredModules.map((m) => {
                      const p = mem.moduleProgress?.[m.id];
                      const isDone = p?.isCompleted || p?.progressPct === 100;
                      const hasStarted = p && p.progressPct > 0;

                      return (
                        <td key={m.id} className="p-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              {isDone ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px]">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                                </span>
                              ) : hasStarted ? (
                                <span className="text-primary font-bold text-[11px] flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Slide {p.maxSlideIdx + 1}/{p.totalSlides}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-[11px]">Belum dibaca</span>
                              )}
                              <span className="font-bold font-mono text-xs text-gray-700 dark:text-white/80">
                                {p ? `${p.progressPct}%` : "0%"}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  isDone ? "bg-emerald-500" : hasStarted ? "bg-primary" : "bg-transparent"
                                }`}
                                style={{ width: `${p ? p.progressPct : 0}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      );
                    })}

                    {/* Action */}
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedMember(mem)}
                        className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-primary/50 text-gray-700 dark:text-white/80 text-xs font-bold transition-all inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Rincian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ── VIEW 2: PER MODULE CARDS VIEW ── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredModules.map((mod) => {
            const totalSlides = (mod.slides || []).length;
            const completedMembers = filteredMembers.filter(
              (mem) => mem.moduleProgress?.[mod.id]?.isCompleted || mem.moduleProgress?.[mod.id]?.progressPct === 100
            );

            return (
              <div
                key={mod.id}
                className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl space-y-4 shadow-lg"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                      <Presentation className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-white">{mod.title}</h3>
                      <p className="text-xs text-gray-400">
                        {mod.phase?.name || "Modul Materi"} • {totalSlides} Slide Presentasi
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                    {completedMembers.length} / {filteredMembers.length} Selesai
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full h-2 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{
                        width: `${
                          filteredMembers.length > 0
                            ? (completedMembers.length / filteredMembers.length) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5 max-h-[220px] overflow-y-auto pr-1">
                  {filteredMembers.map((mem) => {
                    const p = mem.moduleProgress?.[mod.id];
                    const isDone = p?.isCompleted || p?.progressPct === 100;

                    return (
                      <div
                        key={mem.id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold text-gray-700 dark:text-white shrink-0">
                            {mem.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate">{mem.name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isDone ? (
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> 100%
                            </span>
                          ) : p && p.progressPct > 0 ? (
                            <span className="text-xs font-bold text-primary">
                              Slide {p.maxSlideIdx + 1}/{totalSlides} ({p.progressPct}%)
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">0%</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Member Detailed Modal Matching Dashboard Standard ── */}
      <AnimatePresence>
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0b1712] border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-white/10 flex items-center justify-center text-base font-bold text-gray-800 dark:text-white shrink-0 overflow-hidden">
                    {selectedMember.profilePictureUrl ? (
                      <img src={selectedMember.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      selectedMember.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedMember.name}</h2>
                    <p className="text-xs text-gray-400">
                      {selectedMember.npm ? `NPM: ${selectedMember.npm} • ` : ""}
                      {selectedMember.group?.groupName || "Belum ada kelompok"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 pt-4 overflow-y-auto flex-1 pr-1">
                {/* Overall Gauge Banner */}
                <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-primary uppercase tracking-wider">Kemajuan Membaca Keseluruhan</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                      {selectedMember.overallProgressPct}% Selesai
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedMember.totalCompletedModules} dari {selectedMember.totalModulesCount} modul telah tuntas
                    </p>
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-primary text-[#050e0a] flex items-center justify-center font-black text-lg shrink-0 shadow-lg">
                    {selectedMember.overallProgressPct}%
                  </div>
                </div>

                {/* Modules breakdown */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Rincian Modul yang Dibaca:</h4>
                  <div className="space-y-2">
                    {modules.map((m) => {
                      const p = selectedMember.moduleProgress?.[m.id];
                      const totalSlides = (m.slides || []).length;
                      const isDone = p?.isCompleted || p?.progressPct === 100;

                      return (
                        <div
                          key={m.id}
                          className={`p-4 rounded-2xl border transition-all ${
                            isDone
                              ? "bg-emerald-500/[0.04] border-emerald-500/30"
                              : p && p.progressPct > 0
                              ? "bg-primary/[0.04] border-primary/30"
                              : "bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{m.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {m.phase?.name || "Modul"} • {totalSlides} Slide
                                {p?.lastAccessedAt
                                  ? ` • Terakhir dibaca: ${new Date(p.lastAccessedAt).toLocaleString("id-ID")}`
                                  : " • Belum pernah dibuka"}
                              </p>
                            </div>

                            <div>
                              {isDone ? (
                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Selesai 100%
                                </span>
                              ) : p && p.progressPct > 0 ? (
                                <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
                                  Slide {p.maxSlideIdx + 1}/{totalSlides} ({p.progressPct}%)
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Belum dibaca</span>
                              )}
                            </div>
                          </div>

                          <div className="w-full h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden mt-3">
                            <div
                              className={`h-full rounded-full ${
                                isDone ? "bg-emerald-500" : p && p.progressPct > 0 ? "bg-primary" : "bg-transparent"
                              }`}
                              style={{ width: `${p ? p.progressPct : 0}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedMember(null)}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold hover:bg-gray-800 dark:hover:bg-white/90 transition-all shadow-sm"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
