"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  Users,
  FileText,
  UserCheck,
  TrendingUp,
  Monitor,
  BarChart2,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Calendar,
  CalendarDays,
  X,
  Clock,
  ChevronRight,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { getAnalyticsReportData } from "@/app/actions/analyticsActions";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

const DEVICE_COLORS = {
  desktop: "#10b981",
  mobile: "#3b82f6",
  tablet: "#f59e0b",
  unknown: "#6b7280",
};

const DEVICE_COLOR_LIST = ["#10b981", "#3b82f6", "#f59e0b", "#6b7280"];

function getIsoDate(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);
}

function getPresetRange(key) {
  const today = new Date();
  if (key === "7days") {
    const s = new Date(today);
    s.setDate(today.getDate() - 6);
    return { start: getIsoDate(s), end: getIsoDate(today) };
  }
  if (key === "14days") {
    const s = new Date(today);
    s.setDate(today.getDate() - 13);
    return { start: getIsoDate(s), end: getIsoDate(today) };
  }
  if (key === "30days") {
    const s = new Date(today);
    s.setDate(today.getDate() - 29);
    return { start: getIsoDate(s), end: getIsoDate(today) };
  }
  if (key === "thisMonth") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: getIsoDate(s), end: getIsoDate(today) };
  }
  if (key === "lastMonth") {
    const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const e = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: getIsoDate(s), end: getIsoDate(e) };
  }
  if (key === "all") {
    return { start: "", end: "" };
  }
  return { start: "", end: "" };
}

function formatDisplayDate(isoStr) {
  if (!isoStr) return "";
  const [y, m, d] = isoStr.split("-");
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

// Stat card - widget style matching DashboardClient
function StatCard({ title, value, subtitle, icon: Icon, color = "primary", badge, isText = false }) {
  const isLongText = isText || (typeof value === "string" && value.length > 5 && isNaN(Number(value.replace(/,/g, ""))));

  return (
    <motion.div
      variants={item}
      className="bg-white dark:bg-[#08120e] hover:bg-gray-50 dark:hover:bg-[#0a1611] border border-gray-100 dark:border-white/5 rounded-3xl p-6 relative overflow-hidden group transition-all duration-500 hover:-translate-y-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:hover:shadow-[0_10px_40px_rgba(16,185,129,0.1)] flex flex-col justify-between"
    >
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full bg-${color}/10 blur-2xl group-hover:bg-${color}/20 group-hover:scale-150 transition-all duration-700`} />

      <div className="flex justify-between items-start mb-6 relative z-10">
        <div className={`p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 text-${color} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500 shadow-sm dark:shadow-none`}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-500/20">
          <TrendingUp className="w-3 h-3" />
          {badge}
        </div>
      </div>

      <div className="relative z-10 mb-1">
        {isLongText ? (
          <h3 className="text-xl md:text-2xl font-display font-black text-gray-900 dark:text-white tracking-tight line-clamp-2 min-h-[3.25rem] flex items-center leading-tight">
            {value}
          </h3>
        ) : (
          <h3 className="text-4xl md:text-5xl font-display font-black text-gray-900 dark:text-white tracking-tighter mb-1 truncate leading-none">
            {value}
          </h3>
        )}
        <p className="text-gray-900 dark:text-white font-bold text-sm tracking-wide mt-2 mb-0.5">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 dark:text-white/40 font-medium truncate">{subtitle}</p>}
      </div>

      {/* Decorative sparkline */}
      <div className="absolute bottom-0 left-0 w-full h-12 opacity-20 group-hover:opacity-40 transition-opacity pointer-events-none">
        <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,20 L10,15 L20,18 L30,10 L40,12 L50,5 L60,8 L70,2 L80,6 L90,1 L100,5 L100,20 Z" className={`fill-${color}`} />
        </svg>
      </div>
    </motion.div>
  );
}

// Custom tooltip for theme consistency
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-[#0a1611] border border-gray-100 dark:border-white/10 rounded-xl px-4 py-2.5 shadow-lg text-sm">
      <p className="text-gray-500 dark:text-white/50 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="font-bold" style={{ color: p.color }}>
          {p.name}: {Number(p.value).toLocaleString("en-US")}
        </p>
      ))}
    </div>
  );
}

// Human-friendly page label formatter
function formatPageName(rawPath) {
  if (!rawPath || rawPath === "-" || rawPath === "Unknown") return "-";
  if (rawPath === "/" || rawPath === "") return "Home Page";

  const KNOWN_PAGES = {
    "/": "Home Page",
    "/about": "About Us Page",
    "/activity": "Activity Gallery Page",
    "/articles": "Articles Page",
    "/events": "Events Page",
    "/merchandise": "Merchandise Page",
    "/join": "Recruitment Page",
    "/login": "Login Page",
  };

  if (KNOWN_PAGES[rawPath]) {
    return KNOWN_PAGES[rawPath];
  }

  // Format nested paths (e.g. /articles/transition-green -> Articles: Transition Green Page)
  const clean = rawPath.replace(/^\/+|\/+$/g, "");
  const formatted = clean
    .split("/")
    .map((seg) =>
      seg
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    )
    .join(" - ");

  return `${formatted} Page`;
}

const PRESET_OPTIONS = [
  { key: "14days", label: "14 Hari Terakhir" },
  { key: "7days", label: "7 Hari Terakhir" },
  { key: "30days", label: "30 Hari Terakhir" },
  { key: "thisMonth", label: "Bulan Ini" },
  { key: "lastMonth", label: "Bulan Lalu" },
  { key: "all", label: "Semua Waktu" },
  { key: "custom", label: "Rentang Kustom" },
];

export default function AnalyticsClient({ stats, dailyTraffic, hourlyTraffic, deviceBreakdown, topPages }) {
  const fmt = (n) => (n ?? 0).toLocaleString("en-US");

  const [isExporting, setIsExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("14days");
  const [startDate, setStartDate] = useState(() => getPresetRange("14days").start);
  const [endDate, setEndDate] = useState(() => getPresetRange("14days").end);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectPreset = (key) => {
    setSelectedPreset(key);
    if (key !== "custom") {
      const range = getPresetRange(key);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    setSelectedPreset("custom");
  };

  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    setSelectedPreset("custom");
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      // Validate dates
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        notify("error", "Tanggal mulai tidak boleh lebih besar dari tanggal selesai");
        setIsExporting(false);
        return;
      }

      // Fetch dynamic analytics data for selected range
      const res = await getAnalyticsReportData({ startDate, endDate });
      if (!res?.success) {
        throw new Error(res?.error || "Gagal mengambil data analitik");
      }

      const reportData = res.data;
      const reportStats = reportData.stats;
      const reportDaily = reportData.dailyTraffic || [];
      const reportHourly = reportData.hourlyTraffic || [];
      const reportTopPages = reportData.topPages || [];
      const reportDevices = reportData.deviceBreakdown || [];

      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPN Veteran Jawa Timur";
      workbook.lastModifiedBy = "SRE Admin";
      workbook.created = new Date();

      const nowStr = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "full",
        timeStyle: "medium",
      });

      // Periode label
      let periodeLabel = "Seluruh Waktu (All Time)";
      let fileDateSlug = "Semua_Waktu";
      if (startDate && endDate) {
        periodeLabel = `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`;
        fileDateSlug = `${startDate}_sd_${endDate}`;
      } else if (startDate) {
        periodeLabel = `Mulai ${formatDisplayDate(startDate)}`;
        fileDateSlug = `Mulai_${startDate}`;
      } else if (endDate) {
        periodeLabel = `Sampai ${formatDisplayDate(endDate)}`;
        fileDateSlug = `Sampai_${endDate}`;
      }

      // ==========================================
      // SHEET 1: RINGKASAN EKSEKUTIF (SUMMARY)
      // ==========================================
      const sheetSummary = workbook.addWorksheet("Ringkasan Eksekutif", {
        views: [{ showGridLines: true }],
      });

      // Title Banner
      sheetSummary.mergeCells("A1:E1");
      const titleCell = sheetSummary.getCell("A1");
      titleCell.value = "SRE UPNVJT - LAPORAN ANALITIK PENGUNJUNG WEBSITE";
      titleCell.font = { name: "Arial", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      sheetSummary.getRow(1).height = 32;

      // Subtitle Banner
      sheetSummary.mergeCells("A2:E2");
      const subCell = sheetSummary.getCell("A2");
      subCell.value = `Periode Laporan: ${periodeLabel} | Waktu Ekspor: ${nowStr} WIB`;
      subCell.font = { name: "Arial", size: 9.5, italic: true, color: { argb: "FF047857" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      subCell.alignment = { horizontal: "center", vertical: "middle" };
      sheetSummary.getRow(2).height = 22;

      sheetSummary.getRow(3).height = 10;

      // KPI Summary Section Header
      sheetSummary.mergeCells("A4:E4");
      const kpiHeader = sheetSummary.getCell("A4");
      kpiHeader.value = "1. METRIK UTAMA (KEY PERFORMANCE INDICATORS)";
      kpiHeader.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
      kpiHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      kpiHeader.alignment = { vertical: "middle", indent: 1 };
      sheetSummary.getRow(4).height = 24;

      const kpiData = [
        { no: 1, metric: "Total Pageviews", value: reportStats?.totalViews ?? 0, desc: `Total kunjungan pada rentang ${periodeLabel}` },
        { no: 2, metric: "Unique Visitors", value: reportStats?.uniqueVisitors ?? 0, desc: `Pengunjung unik pada rentang ${periodeLabel}` },
        { no: 3, metric: "Authenticated Visits", value: reportStats?.loggedInVisitors ?? 0, desc: `Kunjungan dari user yang telah login pada rentang ${periodeLabel}` },
        { no: 4, metric: "Halaman Paling Populer", value: `${formatPageName(reportStats?.topPage)} (${reportStats?.topPage ?? "-"})`, desc: "Rute halaman dengan trafik tertinggi di periode ini" },
      ];

      const kpiColHeaders = ["No", "Indikator Metrik", "Nilai / Hasil", "Keterangan"];
      sheetSummary.mergeCells("C5:D5");
      const kpiRow5 = sheetSummary.getRow(5);
      kpiRow5.height = 22;
      ["A", "B", "C", "E"].forEach((colLetter, idx) => {
        const c = sheetSummary.getCell(`${colLetter}5`);
        c.value = kpiColHeaders[idx];
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF374151" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
        c.alignment = { horizontal: idx === 0 ? "center" : "left", vertical: "middle" };
      });

      kpiData.forEach((row, i) => {
        const rowIdx = 6 + i;
        sheetSummary.mergeCells(`C${rowIdx}:D${rowIdx}`);
        const r = sheetSummary.getRow(rowIdx);
        r.height = 21;

        const cA = sheetSummary.getCell(`A${rowIdx}`);
        cA.value = row.no;
        cA.alignment = { horizontal: "center", vertical: "middle" };

        const cB = sheetSummary.getCell(`B${rowIdx}`);
        cB.value = row.metric;
        cB.font = { bold: true };
        cB.alignment = { vertical: "middle" };

        const cC = sheetSummary.getCell(`C${rowIdx}`);
        cC.value = typeof row.value === "number" ? row.value.toLocaleString("id-ID") : row.value;
        cC.alignment = { horizontal: typeof row.value === "number" ? "right" : "left", vertical: "middle" };
        cC.font = { bold: true, color: { argb: "FF065F46" } };

        const cE = sheetSummary.getCell(`E${rowIdx}`);
        cE.value = row.desc;
        cE.alignment = { vertical: "middle" };

        [cA, cB, cC, sheetSummary.getCell(`D${rowIdx}`), cE].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheetSummary.getRow(11).height = 14;

      // Section 2: Top Pages Summary
      sheetSummary.mergeCells("A12:E12");
      const topPageHeader = sheetSummary.getCell("A12");
      topPageHeader.value = "2. RINGKASAN TOP HALAMAN TERPOPULER (PERIODE INI)";
      topPageHeader.font = { name: "Arial", size: 10.5, bold: true, color: { argb: "FFFFFFFF" } };
      topPageHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      topPageHeader.alignment = { vertical: "middle", indent: 1 };
      sheetSummary.getRow(12).height = 24;

      const pageColHeaders = ["Rank", "Nama Halaman", "Path URL", "Pageviews", "Persentase"];
      const pageRow13 = sheetSummary.getRow(13);
      pageRow13.height = 22;
      ["A", "B", "C", "D", "E"].forEach((colLetter, idx) => {
        const c = sheetSummary.getCell(`${colLetter}13`);
        c.value = pageColHeaders[idx];
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FF374151" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } };
        c.alignment = { horizontal: idx === 0 || idx >= 3 ? "center" : "left", vertical: "middle" };
      });

      const totalPageVisits = (reportTopPages || []).reduce((acc, p) => acc + (p.visits || 0), 0) || 1;
      (reportTopPages.slice(0, 10) || []).forEach((p, idx) => {
        const rowIdx = 14 + idx;
        const r = sheetSummary.getRow(rowIdx);
        r.height = 20;

        const cA = sheetSummary.getCell(`A${rowIdx}`);
        cA.value = `#${idx + 1}`;
        cA.alignment = { horizontal: "center", vertical: "middle" };

        const cB = sheetSummary.getCell(`B${rowIdx}`);
        cB.value = formatPageName(p.path);
        cB.alignment = { vertical: "middle" };

        const cC = sheetSummary.getCell(`C${rowIdx}`);
        cC.value = p.path;
        cC.alignment = { vertical: "middle" };

        const cD = sheetSummary.getCell(`D${rowIdx}`);
        cD.value = p.visits;
        cD.numFmt = "#,##0";
        cD.alignment = { horizontal: "right", vertical: "middle" };
        cD.font = { bold: true };

        const cE = sheetSummary.getCell(`E${rowIdx}`);
        cE.value = `${Math.round((p.visits / totalPageVisits) * 100)}%`;
        cE.alignment = { horizontal: "center", vertical: "middle" };

        [cA, cB, cC, cD, cE].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheetSummary.columns = [
        { width: 8 },
        { width: 28 },
        { width: 32 },
        { width: 18 },
        { width: 36 },
      ];

      // ==========================================
      // SHEET 2: TRAFIK HARIAN (DAILY TRAFFIC)
      // ==========================================
      const sheetDaily = workbook.addWorksheet("Trafik Harian", {
        views: [{ showGridLines: true }],
      });

      sheetDaily.mergeCells("A1:D1");
      const dailyTitle = sheetDaily.getCell("A1");
      dailyTitle.value = `SRE UPNVJT - DATA TRAFIK HARIAN (${periodeLabel.toUpperCase()})`;
      dailyTitle.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      dailyTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      dailyTitle.alignment = { horizontal: "center", vertical: "middle" };
      sheetDaily.getRow(1).height = 28;

      sheetDaily.mergeCells("A2:D2");
      const dailySub = sheetDaily.getCell("A2");
      dailySub.value = `Periode: ${periodeLabel} | Waktu Ekspor: ${nowStr} WIB`;
      dailySub.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF047857" } };
      dailySub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      dailySub.alignment = { horizontal: "center", vertical: "middle" };
      sheetDaily.getRow(2).height = 20;

      sheetDaily.getRow(3).height = 8;

      const dailyHeaders = ["No", "Tanggal (Date)", "Jumlah Kunjungan (Pageviews)", "Kontribusi (%)"];
      const dailyHeaderRow = sheetDaily.getRow(4);
      dailyHeaderRow.height = 24;
      dailyHeaders.forEach((h, colIdx) => {
        const c = dailyHeaderRow.getCell(colIdx + 1);
        c.value = h;
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        c.alignment = { horizontal: colIdx === 0 || colIdx === 3 ? "center" : colIdx === 2 ? "right" : "left", vertical: "middle" };
      });

      const totalDailyVisits = (reportDaily || []).reduce((sum, d) => sum + (d.visits || 0), 0) || 1;
      (reportDaily || []).forEach((d, idx) => {
        const rowNum = 5 + idx;
        const row = sheetDaily.getRow(rowNum);
        row.height = 20;

        const c1 = row.getCell(1);
        c1.value = idx + 1;
        c1.alignment = { horizontal: "center", vertical: "middle" };

        const c2 = row.getCell(2);
        c2.value = d.date;
        c2.alignment = { vertical: "middle" };

        const c3 = row.getCell(3);
        c3.value = d.visits;
        c3.numFmt = "#,##0";
        c3.alignment = { horizontal: "right", vertical: "middle" };
        c3.font = { bold: true };

        const c4 = row.getCell(4);
        c4.value = `${((d.visits / totalDailyVisits) * 100).toFixed(1)}%`;
        c4.alignment = { horizontal: "center", vertical: "middle" };

        [c1, c2, c3, c4].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      // Total Row
      const totalDailyRowIdx = 5 + (reportDaily || []).length;
      const totalDailyRow = sheetDaily.getRow(totalDailyRowIdx);
      totalDailyRow.height = 22;

      sheetDaily.mergeCells(`A${totalDailyRowIdx}:B${totalDailyRowIdx}`);
      const totLabelCell = sheetDaily.getCell(`A${totalDailyRowIdx}`);
      totLabelCell.value = "TOTAL KUNJUNGAN";
      totLabelCell.font = { bold: true, color: { argb: "FF064E3B" } };
      totLabelCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      totLabelCell.alignment = { horizontal: "center", vertical: "middle" };

      const totValCell = sheetDaily.getCell(`C${totalDailyRowIdx}`);
      totValCell.value = (reportDaily || []).reduce((sum, d) => sum + (d.visits || 0), 0);
      totValCell.numFmt = "#,##0";
      totValCell.font = { bold: true, color: { argb: "FF064E3B" } };
      totValCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      totValCell.alignment = { horizontal: "right", vertical: "middle" };

      const totPctCell = sheetDaily.getCell(`D${totalDailyRowIdx}`);
      totPctCell.value = "100%";
      totPctCell.font = { bold: true, color: { argb: "FF064E3B" } };
      totPctCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
      totPctCell.alignment = { horizontal: "center", vertical: "middle" };

      [totLabelCell, sheetDaily.getCell(`B${totalDailyRowIdx}`), totValCell, totPctCell].forEach(c => {
        c.border = {
          top: { style: "medium", color: { argb: "FF059669" } },
          bottom: { style: "medium", color: { argb: "FF059669" } },
          left: { style: "thin", color: { argb: "FFE5E7EB" } },
          right: { style: "thin", color: { argb: "FFE5E7EB" } },
        };
      });

      sheetDaily.columns = [
        { width: 8 },
        { width: 22 },
        { width: 30 },
        { width: 20 },
      ];

      // ==========================================
      // SHEET 3: DISTRIBUSI PER JAM (HOURLY)
      // ==========================================
      const sheetHourly = workbook.addWorksheet("Distribusi Per Jam", {
        views: [{ showGridLines: true }],
      });

      sheetHourly.mergeCells("A1:D1");
      const hourlyTitle = sheetHourly.getCell("A1");
      hourlyTitle.value = "SRE UPNVJT - DISTRIBUSI KUNJUNGAN PER JAM (24 JAM WIB)";
      hourlyTitle.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      hourlyTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } };
      hourlyTitle.alignment = { horizontal: "center", vertical: "middle" };
      sheetHourly.getRow(1).height = 28;

      sheetHourly.mergeCells("A2:D2");
      const hourlySub = sheetHourly.getCell("A2");
      hourlySub.value = `Periode: ${periodeLabel} | Waktu Ekspor: ${nowStr} WIB`;
      hourlySub.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF1E40AF" } };
      hourlySub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFF6FF" } };
      hourlySub.alignment = { horizontal: "center", vertical: "middle" };
      sheetHourly.getRow(2).height = 20;

      sheetHourly.getRow(3).height = 8;

      const hourlyHeaders = ["No", "Rentang Jam (WIB)", "Jumlah Kunjungan", "Persentase (%)"];
      const hourlyHeaderRow = sheetHourly.getRow(4);
      hourlyHeaderRow.height = 24;
      hourlyHeaders.forEach((h, colIdx) => {
        const c = hourlyHeaderRow.getCell(colIdx + 1);
        c.value = h;
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF3B82F6" } };
        c.alignment = { horizontal: colIdx === 0 || colIdx === 3 ? "center" : colIdx === 2 ? "right" : "left", vertical: "middle" };
      });

      const totalHourlyVisits = (reportHourly || []).reduce((sum, h) => sum + (h.visits || 0), 0) || 1;
      (reportHourly || []).forEach((h, idx) => {
        const rowNum = 5 + idx;
        const row = sheetHourly.getRow(rowNum);
        row.height = 19;

        const c1 = row.getCell(1);
        c1.value = idx + 1;
        c1.alignment = { horizontal: "center", vertical: "middle" };

        const c2 = row.getCell(2);
        c2.value = `${h.hour} WIB`;
        c2.alignment = { vertical: "middle" };

        const c3 = row.getCell(3);
        c3.value = h.visits;
        c3.numFmt = "#,##0";
        c3.alignment = { horizontal: "right", vertical: "middle" };

        const c4 = row.getCell(4);
        c4.value = `${((h.visits / totalHourlyVisits) * 100).toFixed(1)}%`;
        c4.alignment = { horizontal: "center", vertical: "middle" };

        [c1, c2, c3, c4].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheetHourly.columns = [
        { width: 8 },
        { width: 24 },
        { width: 26 },
        { width: 20 },
      ];

      // ==========================================
      // SHEET 4: HALAMAN TERPOPULER (TOP PAGES)
      // ==========================================
      const sheetPages = workbook.addWorksheet("Halaman Terpopuler", {
        views: [{ showGridLines: true }],
      });

      sheetPages.mergeCells("A1:E1");
      const pagesTitle = sheetPages.getCell("A1");
      pagesTitle.value = `SRE UPNVJT - HALAMAN PALING SERING DIKUNJUNGI (${periodeLabel.toUpperCase()})`;
      pagesTitle.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      pagesTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      pagesTitle.alignment = { horizontal: "center", vertical: "middle" };
      sheetPages.getRow(1).height = 28;

      sheetPages.mergeCells("A2:E2");
      const pagesSub = sheetPages.getCell("A2");
      pagesSub.value = `Periode: ${periodeLabel} | Waktu Ekspor: ${nowStr} WIB`;
      pagesSub.font = { name: "Arial", size: 9, italic: true, color: { argb: "FF047857" } };
      pagesSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      pagesSub.alignment = { horizontal: "center", vertical: "middle" };
      sheetPages.getRow(2).height = 20;

      sheetPages.getRow(3).height = 8;

      const pageHeaders = ["Peringkat", "Nama Halaman (Formatted)", "URL / Path", "Total Pageviews", "Kontribusi (%)"];
      const pageHeaderRow = sheetPages.getRow(4);
      pageHeaderRow.height = 24;
      pageHeaders.forEach((h, colIdx) => {
        const c = pageHeaderRow.getCell(colIdx + 1);
        c.value = h;
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        c.alignment = { horizontal: colIdx === 0 || colIdx === 4 ? "center" : colIdx === 3 ? "right" : "left", vertical: "middle" };
      });

      (reportTopPages || []).forEach((p, idx) => {
        const rowNum = 5 + idx;
        const row = sheetPages.getRow(rowNum);
        row.height = 21;

        const c1 = row.getCell(1);
        c1.value = `Peringkat #${idx + 1}`;
        c1.alignment = { horizontal: "center", vertical: "middle" };

        const c2 = row.getCell(2);
        c2.value = formatPageName(p.path);
        c2.font = { bold: true };
        c2.alignment = { vertical: "middle" };

        const c3 = row.getCell(3);
        c3.value = p.path;
        c3.alignment = { vertical: "middle" };

        const c4 = row.getCell(4);
        c4.value = p.visits;
        c4.numFmt = "#,##0";
        c4.alignment = { horizontal: "right", vertical: "middle" };
        c4.font = { bold: true, color: { argb: "FF065F46" } };

        const c5 = row.getCell(5);
        c5.value = `${Math.round((p.visits / totalPageVisits) * 100)}%`;
        c5.alignment = { horizontal: "center", vertical: "middle" };

        [c1, c2, c3, c4, c5].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheetPages.columns = [
        { width: 14 },
        { width: 30 },
        { width: 34 },
        { width: 20 },
        { width: 18 },
      ];

      // ==========================================
      // SHEET 5: PERANGKAT (DEVICE BREAKDOWN)
      // ==========================================
      const sheetDevice = workbook.addWorksheet("Perangkat Pengunjung", {
        views: [{ showGridLines: true }],
      });

      sheetDevice.mergeCells("A1:D1");
      const devTitle = sheetDevice.getCell("A1");
      devTitle.value = `SRE UPNVJT - STATISTIK PERANGKAT PENGUNJUNG (${periodeLabel.toUpperCase()})`;
      devTitle.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      devTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB45309" } };
      devTitle.alignment = { horizontal: "center", vertical: "middle" };
      sheetDevice.getRow(1).height = 28;

      sheetDevice.mergeCells("A2:D2");
      const devSub = sheetDevice.getCell("A2");
      devSub.value = `Periode: ${periodeLabel} | Waktu Ekspor: ${nowStr} WIB`;
      devSub.font = { name: "Arial", size: 9, italic: true, color: { argb: "FFB45309" } };
      devSub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEF3C7" } };
      devSub.alignment = { horizontal: "center", vertical: "middle" };
      sheetDevice.getRow(2).height = 20;

      sheetDevice.getRow(3).height = 8;

      const devHeaders = ["No", "Kategori Perangkat", "Jumlah Kunjungan", "Persentase (%)"];
      const devHeaderRow = sheetDevice.getRow(4);
      devHeaderRow.height = 24;
      devHeaders.forEach((h, colIdx) => {
        const c = devHeaderRow.getCell(colIdx + 1);
        c.value = h;
        c.font = { name: "Arial", size: 9.5, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF59E0B" } };
        c.alignment = { horizontal: colIdx === 0 || colIdx === 3 ? "center" : colIdx === 2 ? "right" : "left", vertical: "middle" };
      });

      const totalDevVisits = (reportDevices || []).reduce((sum, d) => sum + (d.visits || 0), 0) || 1;
      (reportDevices || []).forEach((dev, idx) => {
        const rowNum = 5 + idx;
        const row = sheetDevice.getRow(rowNum);
        row.height = 20;

        const c1 = row.getCell(1);
        c1.value = idx + 1;
        c1.alignment = { horizontal: "center", vertical: "middle" };

        const c2 = row.getCell(2);
        c2.value = dev.device.toUpperCase();
        c2.font = { bold: true };
        c2.alignment = { vertical: "middle" };

        const c3 = row.getCell(3);
        c3.value = dev.visits;
        c3.numFmt = "#,##0";
        c3.alignment = { horizontal: "right", vertical: "middle" };

        const c4 = row.getCell(4);
        c4.value = `${Math.round((dev.visits / totalDevVisits) * 100)}%`;
        c4.alignment = { horizontal: "center", vertical: "middle" };

        [c1, c2, c3, c4].forEach((cell) => {
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
        });
      });

      sheetDevice.columns = [
        { width: 8 },
        { width: 26 },
        { width: 26 },
        { width: 20 },
      ];

      // Generate buffer and trigger download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Analitik_Pengunjung_SRE_UPNVJT_${fileDateSlug}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
      notify("success", `Laporan Excel (.xlsx) periode ${periodeLabel} berhasil di-download!`);
    } catch (err) {
      console.error("[analytics export error]", err);
      notify("error", "Gagal meng-export laporan Excel: " + (err.message || "Terjadi kesalahan"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden relative pb-20">
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 backdrop-blur-xl ${
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

      {/* Export Date Range Modal */}
      <AnimatePresence>
        {exportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isExporting && setExportModalOpen(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative z-10 w-full max-w-lg bg-white dark:bg-[#0b1712] border border-gray-100 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                      Export Laporan Excel
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                      Pilih rentang tanggal data yang ingin diekspor
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isExporting && setExportModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Preset Chips */}
              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40 mb-2.5">
                  Pilihan Cepat (Preset)
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleSelectPreset(opt.key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        selectedPreset === opt.key
                          ? "bg-primary text-black font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-105"
                          : "bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white/70 border border-transparent dark:border-white/5"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-white/80 mb-1.5">
                    Dari Tanggal (Mulai)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={handleStartDateChange}
                      className="w-full h-11 px-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-white/80 mb-1.5">
                    Sampai Tanggal (Selesai)
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={handleEndDateChange}
                      className="w-full h-11 px-3.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Range Summary Box */}
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CalendarDays className="w-5 h-5 shrink-0" />
                </div>
                <div className="text-xs">
                  <span className="font-bold text-gray-900 dark:text-white block">
                    {startDate && endDate
                      ? `${formatDisplayDate(startDate)} – ${formatDisplayDate(endDate)}`
                      : startDate
                      ? `Mulai ${formatDisplayDate(startDate)} s/d sekarang`
                      : endDate
                      ? `Semua data s/d ${formatDisplayDate(endDate)}`
                      : "Seluruh Waktu Tercatat (All-Time)"}
                  </span>
                  <span className="text-gray-500 dark:text-white/50 text-[11px]">
                    Laporan akan mencakup: Ringkasan Metrik, Trafik Harian, Distribusi Per Jam, Top Halaman, dan Perangkat.
                  </span>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => !isExporting && setExportModalOpen(false)}
                  disabled={isExporting}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  disabled={isExporting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.35)] cursor-pointer"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengekspor Laporan...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download Excel (.xlsx)</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Background ambience */}
      <div className="absolute top-0 left-1/4 w-72 sm:w-96 h-72 sm:h-96 bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" style={{ animationDuration: "6s" }} />
      <div className="absolute top-40 right-1/4 w-60 sm:w-80 h-60 sm:h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8 sm:mb-12 relative z-10 pt-2 sm:pt-4 min-w-0"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-white/60 mb-4 sm:mb-6 shadow-sm">
              <BarChart2 className="w-3.5 h-3.5 text-primary" />
              Visitor Analytics
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter mb-3 sm:mb-4 text-gray-900 dark:text-white leading-tight break-words">
              Visitor <span className="text-primary dark:text-emerald-400">Analytics</span>
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm sm:text-base md:text-lg max-w-xl font-light leading-relaxed">
              Monitor public website traffic, user devices, and popular pages in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setExportModalOpen(true)}
              className="inline-flex items-center justify-center gap-2.5 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-bold transition-all shadow-[0_4px_20px_rgba(16,185,129,0.25)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.35)] cursor-pointer w-full sm:w-auto"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>Export Laporan Excel (.xlsx)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grid 4 Stat Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <StatCard
          title="Total Pageviews"
          value={fmt(stats?.totalViews)}
          subtitle="All-time recorded visits"
          icon={Eye}
          color="primary"
          badge="Views"
        />
        <StatCard
          title="Unique Visitors"
          value={fmt(stats?.uniqueVisitors)}
          subtitle="Identified via unique client ID"
          icon={Users}
          color="blue-500"
          badge="Unique"
        />
        <StatCard
          title="Most Visited Page"
          value={formatPageName(stats?.topPage)}
          subtitle={stats?.topPage && stats.topPage !== "-" ? `Path: ${stats.topPage}` : "Highest traffic route"}
          icon={FileText}
          color="emerald-500"
          badge="Top"
        />
        <StatCard
          title="Authenticated Visits"
          value={fmt(stats?.loggedInVisitors)}
          subtitle="Logged-in users on public pages"
          icon={UserCheck}
          color="amber-500"
          badge="Logged In"
        />
      </motion.div>

      {/* Area Chart — Daily Traffic */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8 }}
        className="mt-6 sm:mt-10 bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-8 min-w-0 overflow-hidden [&_.recharts-wrapper]:outline-none [&_.recharts-wrapper]:focus:outline-none [&_.recharts-surface]:outline-none **:focus:outline-none"
      >
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-primary shrink-0" />
          <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
            Daily Traffic
          </h2>
          <span className="ml-auto text-xs text-gray-400 dark:text-white/30 font-medium">Last 14 days</span>
        </div>
        <div className="w-full h-72 sm:h-80 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyTraffic} margin={{ top: 10, right: 10, left: -15, bottom: 0 }} style={{ outline: "none" }}>
              <defs>
                <linearGradient id="gradVisits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="visits"
                name="Pageviews"
                stroke="#10b981"
                strokeWidth={2.5}
                fill="url(#gradVisits)"
                dot={false}
                activeDot={{ r: 5, fill: "#10b981" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Grid 2 Columns: Hourly Bar Chart + Device Pie Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.8 }}
        className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 min-w-0"
      >
        {/* Bar Chart — Traffic by Hour */}
        <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-8 min-w-0 overflow-hidden [&_.recharts-wrapper]:outline-none **:focus:outline-none">
          <div className="flex items-center gap-2 mb-6">
            <BarChart2 className="w-5 h-5 text-blue-500 shrink-0" />
            <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
              Traffic by Hour
            </h2>
            <span className="ml-auto text-xs text-gray-400 dark:text-white/30 font-medium">24-hour distribution</span>
          </div>
          <div className="w-full h-64 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyTraffic} margin={{ top: 4, right: 0, left: -15, bottom: 0 }} style={{ outline: "none" }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(16,185,129,0.08)" />
                <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} interval={3} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="visits" name="Pageviews" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut/Pie Chart — Devices */}
        <div className="bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-8 min-w-0 overflow-hidden [&_.recharts-wrapper]:outline-none **:focus:outline-none">
          <div className="flex items-center gap-2 mb-6">
            <Monitor className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
              Device Breakdown
            </h2>
          </div>
          {deviceBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-gray-400 dark:text-white/30 text-sm font-medium">
              No device data recorded yet.
            </div>
          ) : (
            <div className="w-full h-64 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart style={{ outline: "none" }}>
                  <Pie
                    data={deviceBreakdown}
                    dataKey="visits"
                    nameKey="device"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {deviceBreakdown.map((entry, i) => (
                      <Cell
                        key={entry.device}
                        fill={DEVICE_COLORS[entry.device] ?? DEVICE_COLOR_LIST[i % DEVICE_COLOR_LIST.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val, name) => [Number(val).toLocaleString("en-US"), name]}
                    contentStyle={{
                      backgroundColor: "var(--color-canvas)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                      <span className="text-xs capitalize font-medium text-gray-600 dark:text-white/60">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>

      {/* Top Pages Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="mt-6 bg-white dark:bg-[#08120e] border border-gray-100 dark:border-white/5 rounded-3xl p-5 sm:p-8 min-w-0 overflow-hidden"
      >
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-emerald-500 shrink-0" />
          <h2 className="font-display font-bold text-lg sm:text-xl tracking-tight text-gray-900 dark:text-white">
            Top Visited Pages
          </h2>
        </div>

        {topPages.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-white/30 font-medium py-6 text-center">
            No pageview data recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto w-full -mx-2 px-2">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left border-b border-gray-100 dark:border-white/5">
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 w-8">#</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30">Page Name & Route</th>
                  <th className="pb-3 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/30 text-right">Pageviews</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {topPages.map((page, i) => {
                  const maxVisits = topPages[0]?.visits ?? 1;
                  const pct = Math.round((page.visits / maxVisits) * 100);
                  const pageName = formatPageName(page.path);
                  return (
                    <tr key={page.path} className="group hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 pr-4 text-gray-300 dark:text-white/20 font-bold">{i + 1}</td>
                      <td className="py-3.5 pr-4">
                        <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-gray-900 dark:text-white text-[13.5px]">
                            {pageName}
                          </span>
                          <span className="text-[11px] text-gray-400 dark:text-white/40 font-mono">
                            ({page.path})
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-white/5 rounded-full h-1 mt-1.5">
                          <div
                            className="bg-primary h-1 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 text-right font-bold text-gray-900 dark:text-white tabular-nums">
                        {page.visits.toLocaleString("en-US")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
