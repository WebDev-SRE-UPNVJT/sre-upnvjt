"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Plus, Edit2, Trash2, X, Search, Shield, Building2, UserCircle, 
  ChevronDown, AlertTriangle, FileSpreadsheet, Upload, Download, 
  CheckCircle2, Loader2, FileCheck, Info, Check, AlertCircle
} from "lucide-react";
import { 
  createUser, updateUser, deleteUser, importUsers 
} from "@/app/actions/userActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";
import { useLanguage } from "@/i18n/LanguageProvider";

const CustomSelect = ({ name, options, value, onChange, placeholder, disabled, required, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.value?.toString() === value?.toString());

  return (
    <div className={`relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`} ref={dropdownRef}>
      <input type="hidden" name={name} value={value || ""} required={required} />
      
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border ${isOpen ? 'border-primary/50 bg-white dark:bg-white/10 shadow-sm dark:shadow-none shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-gray-200 dark:border-white/10'} rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all duration-300`}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white font-medium' : 'text-gray-500 dark:text-white/40'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-white/50 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden z-[60] shadow-2xl backdrop-blur-2xl ring-1 ring-black/5"
          >
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-gray-500 dark:text-white/40 text-sm text-center">{t("users.no_options")}</div>
              ) : (
                options.map(option => (
                  <div 
                    key={option.value}
                    onClick={() => {
                      onChange(option.value?.toString());
                      setIsOpen(false);
                    }}
                    className={`px-4 py-3 rounded-lg text-sm cursor-pointer transition-all flex items-center justify-between ${value?.toString() === option.value?.toString() ? 'bg-primary/20 text-primary font-bold' : 'text-gray-500 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:text-white'}`}
                  >
                    {option.label}
                    {value?.toString() === option.value?.toString() && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function UsersClient({ initialUsers, roles, departments, divisions }) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const canCreate = hasAccess(session?.user, 'users', 'create');
  const canUpdate = hasAccess(session?.user, 'users', 'update');
  const canDelete = hasAccess(session?.user, 'users', 'delete');

  const [modal, setModal] = useState({ isOpen: false, isEdit: false, data: null });
  
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedDivId, setSelectedDivId] = useState("");
  const [selectedPositionName, setSelectedPositionName] = useState("");

  // Export & Import States
  const [isExporting, setIsExporting] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const positionOptions = [
    { value: "President", label: "President" },
    { value: "Vice President", label: "Vice President" },
    { value: "Secretary", label: "Secretary" },
    { value: "Director", label: "Director" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" }
  ];

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.npm && u.npm.includes(searchQuery)) ||
    (u.role?.name && u.role.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.department?.name && u.department.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.positionName && u.positionName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const availableDivisions = selectedDeptId 
    ? divisions.filter(d => d.departmentId === parseInt(selectedDeptId))
    : [];

  const refreshData = () => window.location.reload();

  const handleOpenModal = (isEdit, data = null) => {
    setModal({ isOpen: true, isEdit, data });
    setSelectedRoleId(data?.roleId?.toString() || "");
    setSelectedDeptId(data?.departmentId?.toString() || "");
    setSelectedDivId(data?.divisionId?.toString() || "");
    setSelectedPositionName(data?.positionName || "");
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.target);
    
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      npm: formData.get("npm"),
      positionName: formData.get("positionName"),
      isActive: formData.getAll("isActive").includes("true"),
      roleId: formData.get("roleId"),
      departmentId: formData.get("departmentId"),
      divisionId: formData.get("divisionId"),
    };

    let res;
    if (modal.isEdit) {
      res = await updateUser(modal.data?.id, data);
    } else {
      res = await createUser(data);
    }

    setLoading(false);
    if (res.success) {
      setModal({ isOpen: false, isEdit: false, data: null });
      showNotification(modal.isEdit ? "Data pengguna berhasil diperbarui" : "Pengguna baru berhasil ditambahkan", "success");
      refreshData();
    } else {
      setError(res.error);
    }
  };

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });

  const handleOpenDeleteModal = (user) => {
    setDeleteModal({ isOpen: true, user });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, user: null });
  };

  const confirmDeleteUser = async () => {
    if (!deleteModal.user) return;
    setLoading(true);
    const res = await deleteUser(deleteModal.user.id);
    setLoading(false);
    if (res.success) {
      handleCloseDeleteModal();
      showNotification("Pengguna berhasil dihapus", "success");
      refreshData();
    } else {
      setError(res.error || "Gagal menghapus pengguna.");
    }
  };

  // --- EXPORT TO EXCEL ---
  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPN Veteran Jawa Timur";
      workbook.lastModifiedBy = session?.user?.name || "Admin SRE";
      workbook.created = new Date();
      workbook.modified = new Date();

      const nowWIB = new Date().toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "full",
        timeStyle: "short",
      });

      // Sheet 1: Daftar Pengguna SRE
      const sheet1 = workbook.addWorksheet("Data Pengguna", {
        views: [{ showGridLines: true }],
        pageSetup: { orientation: "landscape", paperSize: 9 },
      });

      sheet1.columns = [
        { key: "no", width: 8 },
        { key: "id", width: 10 },
        { key: "name", width: 28 },
        { key: "email", width: 32 },
        { key: "npm", width: 18 },
        { key: "role", width: 20 },
        { key: "department", width: 25 },
        { key: "division", width: 25 },
        { key: "position", width: 20 },
        { key: "status", width: 16 },
        { key: "createdAt", width: 22 },
      ];

      // Banner Header
      sheet1.mergeCells("A1:K1");
      const titleCell = sheet1.getCell("A1");
      titleCell.value = "SRE UPN VETERAN JAWA TIMUR";
      titleCell.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      titleCell.alignment = { vertical: "middle", horizontal: "center" };
      sheet1.getRow(1).height = 36;

      sheet1.mergeCells("A2:K2");
      const subCell = sheet1.getCell("A2");
      subCell.value = "LAPORAN DATA PENGGUNA & ANGGOTA";
      subCell.font = { name: "Calibri", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
      subCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      subCell.alignment = { vertical: "middle", horizontal: "center" };
      sheet1.getRow(2).height = 24;

      sheet1.mergeCells("A3:K3");
      const metaCell = sheet1.getCell("A3");
      metaCell.value = `Waktu Ekspor: ${nowWIB} WIB  |  Total Data: ${filteredUsers.length} Pengguna`;
      metaCell.font = { name: "Calibri", size: 10, italic: true, color: { argb: "FF064E3B" } };
      metaCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      metaCell.alignment = { vertical: "middle", horizontal: "center" };
      sheet1.getRow(3).height = 20;

      sheet1.addRow([]);

      // Table Header
      const headerRow = sheet1.addRow([
        "No",
        "ID",
        "Nama Lengkap",
        "Email",
        "NPM",
        "Hak Akses (Role)",
        "Departemen",
        "Divisi",
        "Jabatan / Posisi",
        "Status Akun",
        "Tanggal Terdaftar",
      ]);
      headerRow.height = 26;
      headerRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
        cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
        cell.border = {
          top: { style: "thin", color: { argb: "FF047857" } },
          bottom: { style: "medium", color: { argb: "FF047857" } },
          left: { style: "thin", color: { argb: "FF047857" } },
          right: { style: "thin", color: { argb: "FF047857" } },
        };
      });

      // Data Rows
      filteredUsers.forEach((u, idx) => {
        const row = sheet1.addRow([
          idx + 1,
          u.id,
          u.name,
          u.email,
          u.npm || "-",
          u.role?.name?.replace(/_/g, " ") || "-",
          u.department?.name || "-",
          u.division?.name || "-",
          u.positionName || "-",
          u.isActive ? "AKTIF" : "NONAKTIF",
          u.createdAt ? new Date(u.createdAt).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) : "-",
        ]);
        row.height = 22;

        const isEven = idx % 2 === 0;
        const bgColor = isEven ? "FFFFFFFF" : "FFF9FAFB";

        row.eachCell((cell, colNum) => {
          cell.font = { name: "Calibri", size: 10, color: { argb: "FF1F2937" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: bgColor } };
          cell.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };

          // Alignment
          if (colNum === 1 || colNum === 2 || colNum === 5 || colNum === 10 || colNum === 11) {
            cell.alignment = { vertical: "middle", horizontal: "center" };
          } else {
            cell.alignment = { vertical: "middle", horizontal: "left" };
          }

          // Highlight status
          if (colNum === 10) {
            if (u.isActive) {
              cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FF047857" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
            } else {
              cell.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFB91C1C" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
            }
          }
        });
      });

      // Sheet 2: Ringkasan Statistik
      const sheet2 = workbook.addWorksheet("Ringkasan Statistik", {
        views: [{ showGridLines: true }],
      });
      sheet2.columns = [{ width: 28 }, { width: 16 }, { width: 16 }];

      sheet2.mergeCells("A1:C1");
      const s2Title = sheet2.getCell("A1");
      s2Title.value = "RINGKASAN STATISTIK PENGGUNA";
      s2Title.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      s2Title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      s2Title.alignment = { vertical: "middle", horizontal: "center" };
      sheet2.getRow(1).height = 30;

      sheet2.addRow([]);
      
      const totalUsers = filteredUsers.length;
      const activeUsers = filteredUsers.filter(u => u.isActive).length;
      const inactiveUsers = totalUsers - activeUsers;

      const kpiHeader = sheet2.addRow(["Metrik Pengguna", "Jumlah", "Persentase"]);
      kpiHeader.height = 24;
      kpiHeader.eachCell((c) => {
        c.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        c.alignment = { vertical: "middle", horizontal: "center" };
      });

      const addKpiRow = (metric, count) => {
        const pct = totalUsers > 0 ? `${Math.round((count / totalUsers) * 100)}%` : "0%";
        const r = sheet2.addRow([metric, count, pct]);
        r.height = 20;
        r.getCell(1).alignment = { vertical: "middle", horizontal: "left" };
        r.getCell(2).alignment = { vertical: "middle", horizontal: "center" };
        r.getCell(3).alignment = { vertical: "middle", horizontal: "center" };
      };

      addKpiRow("Total Pengguna Terdaftar", totalUsers);
      addKpiRow("Pengguna Aktif", activeUsers);
      addKpiRow("Pengguna Nonaktif", inactiveUsers);

      // Download buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const dateSlug = new Date().toISOString().split("T")[0];
      a.download = `Data_Pengguna_SRE_UPNVJT_${dateSlug}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification("Berhasil mengekspor data pengguna ke Excel!", "success");
    } catch (err) {
      console.error("Export users error:", err);
      showNotification("Gagal mengekspor data ke Excel: " + err.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // --- DOWNLOAD TEMPLATE EXCEL ---
  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "SRE UPN Veteran Jawa Timur";
      workbook.created = new Date();

      // Sheet 1: Template Data
      const templateSheet = workbook.addWorksheet("Template Data Pengguna", {
        views: [{ showGridLines: true }],
      });

      templateSheet.columns = [
        { key: "name", width: 28 },
        { key: "email", width: 32 },
        { key: "password", width: 22 },
        { key: "npm", width: 18 },
        { key: "role", width: 20 },
        { key: "department", width: 26 },
        { key: "division", width: 26 },
        { key: "position", width: 20 },
        { key: "status", width: 16 },
      ];

      // Title
      templateSheet.mergeCells("A1:I1");
      const tTitle = templateSheet.getCell("A1");
      tTitle.value = "TEMPLATE IMPORT DATA PENGGUNA - SRE UPN VETERAN JAWA TIMUR";
      tTitle.font = { name: "Calibri", size: 14, bold: true, color: { argb: "FFFFFFFF" } };
      tTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      tTitle.alignment = { vertical: "middle", horizontal: "center" };
      templateSheet.getRow(1).height = 32;

      templateSheet.mergeCells("A2:I2");
      const tGuide = templateSheet.getCell("A2");
      tGuide.value = "Petunjuk: Isi baris data di bawah ini mulai baris ke-4. Kolom bertanda (*) Wajib diisi. Lihat sheet 'Panduan & Referensi' untuk daftar Role & Departemen.";
      tGuide.font = { name: "Calibri", size: 9.5, italic: true, color: { argb: "FF064E3B" } };
      tGuide.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFECFDF5" } };
      tGuide.alignment = { vertical: "middle", horizontal: "center" };
      templateSheet.getRow(2).height = 22;

      // Header Row
      const hRow = templateSheet.addRow([
        "Nama Lengkap *",
        "Email *",
        "Password (Opsional)",
        "NPM (Opsional)",
        "Role *",
        "Departemen (Opsional)",
        "Divisi (Opsional)",
        "Jabatan (Opsional)",
        "Status (Opsional)",
      ]);
      hRow.height = 26;
      hRow.eachCell((cell) => {
        cell.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin", color: { argb: "FF047857" } },
          bottom: { style: "medium", color: { argb: "FF047857" } },
          left: { style: "thin", color: { argb: "FF047857" } },
          right: { style: "thin", color: { argb: "FF047857" } },
        };
      });

      // Sample Data Rows
      const sampleRows = [
        ["Ahmad Fauzi", "ahmad.fauzi@example.com", "SRE12345!", "21081010001", "MEMBER", "Human Resource", "Internal", "Staff", "AKTIF"],
        ["Siti Nurhaliza", "siti.nurhaliza@example.com", "SRE12345!", "21081010002", "STAFF", "Research & Technology", "Web Development", "Manager", "AKTIF"],
        ["Budi Pratama", "budi.pratama@example.com", "SRE12345!", "21081010003", "ADMIN", "Operation", "", "Director", "AKTIF"],
      ];

      sampleRows.forEach((sRow, idx) => {
        const r = templateSheet.addRow(sRow);
        r.height = 20;
        r.eachCell((c, colNum) => {
          c.font = { name: "Calibri", size: 10, color: { argb: "FF374151" } };
          c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: idx % 2 === 0 ? "FFFFFFFF" : "FFF9FAFB" } };
          c.border = {
            top: { style: "thin", color: { argb: "FFE5E7EB" } },
            bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
            left: { style: "thin", color: { argb: "FFE5E7EB" } },
            right: { style: "thin", color: { argb: "FFE5E7EB" } },
          };
          if (colNum === 4 || colNum === 5 || colNum === 9) {
            c.alignment = { vertical: "middle", horizontal: "center" };
          }
        });
      });

      // Sheet 2: Panduan & Referensi
      const refSheet = workbook.addWorksheet("Panduan & Referensi", {
        views: [{ showGridLines: true }],
      });
      refSheet.columns = [{ width: 24 }, { width: 30 }, { width: 30 }];

      refSheet.mergeCells("A1:C1");
      const rTitle = refSheet.getCell("A1");
      rTitle.value = "DAFTAR REFERENSI VALID SISTEM SRE UPNVJT";
      rTitle.font = { name: "Calibri", size: 13, bold: true, color: { argb: "FFFFFFFF" } };
      rTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF064E3B" } };
      rTitle.alignment = { vertical: "middle", horizontal: "center" };
      refSheet.getRow(1).height = 28;

      // Section 1: Roles
      refSheet.addRow([]);
      const roleHead = refSheet.addRow(["Daftar Role Valid", "Keterangan", ""]);
      roleHead.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      roleHead.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      roleHead.getCell(2).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } };
      
      roles?.forEach(r => {
        const row = refSheet.addRow([r.name, `Hak akses: ${r.name.replace(/_/g, " ")}`]);
        row.getCell(1).font = { bold: true, color: { argb: "FF047857" } };
      });

      // Section 2: Departments & Divisions
      refSheet.addRow([]);
      const deptHead = refSheet.addRow(["Departemen", "Divisi Terkait", "Kode"]);
      deptHead.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      deptHead.eachCell(c => c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } });

      departments?.forEach(d => {
        const relatedDivs = divisions?.filter(div => div.departmentId === d.id).map(div => div.name).join(", ") || "-";
        refSheet.addRow([d.name, relatedDivs, d.code || "-"]);
      });

      // Section 3: Jabatan
      refSheet.addRow([]);
      const posHead = refSheet.addRow(["Pilihan Jabatan / Posisi", "Status Akun", ""]);
      posHead.font = { name: "Calibri", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
      posHead.eachCell(c => c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF059669" } });

      positionOptions.forEach((p, idx) => {
        refSheet.addRow([p.value, idx === 0 ? "AKTIF (Default)" : (idx === 1 ? "NONAKTIF" : "")]);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Template_Import_Pengguna_SRE_UPNVJT.xlsx";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification("Template Excel berhasil diunduh!", "success");
    } catch (err) {
      console.error("Template download error:", err);
      showNotification("Gagal mengunduh template: " + err.message, "error");
    }
  };

  // --- PARSE IMPORT EXCEL ---
  const handleFileChange = async (file) => {
    if (!file) return;
    setImportFile(file);
    setIsParsing(true);
    setImportPreview([]);
    setImportSummary(null);

    try {
      const XLSX = await import("xlsx");
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          // Read rows as array of arrays
          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
          if (!rawRows || rawRows.length < 2) {
            showNotification("File Excel kosong atau tidak memiliki baris data.", "error");
            setIsParsing(false);
            return;
          }

          // Find header row (skip title/guide rows if any)
          let headerRowIndex = 0;
          for (let i = 0; i < Math.min(rawRows.length, 5); i++) {
            const rowStr = rawRows[i].map(c => String(c).toLowerCase()).join(" ");
            if (rowStr.includes("nama") || rowStr.includes("email") || rowStr.includes("name")) {
              headerRowIndex = i;
              break;
            }
          }

          const headers = rawRows[headerRowIndex].map(h => String(h).trim().toLowerCase());
          
          // Map column indices
          const findCol = (keywords) => {
            return headers.findIndex(h => keywords.some(k => h.includes(k)));
          };

          const nameIdx = findCol(["nama", "name", "full"]);
          const emailIdx = findCol(["email", "mail", "surel"]);
          const pwdIdx = findCol(["pass", "sandi", "kata sandi", "password"]);
          const npmIdx = findCol(["npm", "nim", "student id"]);
          const roleIdx = findCol(["role", "peran", "akses", "level"]);
          const deptIdx = findCol(["departemen", "dept", "department"]);
          const divIdx = findCol(["divisi", "div", "division"]);
          const posIdx = findCol(["jabatan", "posisi", "position"]);
          const statusIdx = findCol(["status", "aktif", "active", "isactive"]);

          const existingEmails = new Set(users.map(u => u.email.toLowerCase().trim()));
          const existingNpms = new Set(users.filter(u => u.npm).map(u => u.npm.trim()));

          const parsedList = [];
          const seenEmailsInFile = new Set();

          for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
            const r = rawRows[i];
            // Skip completely blank rows
            if (!r || r.every(c => String(c).trim() === "")) continue;

            const name = nameIdx !== -1 ? String(r[nameIdx]).trim() : "";
            const email = emailIdx !== -1 ? String(r[emailIdx]).toLowerCase().trim() : "";
            const password = pwdIdx !== -1 && String(r[pwdIdx]).trim() ? String(r[pwdIdx]).trim() : "SRE12345!";
            const npm = npmIdx !== -1 && String(r[npmIdx]).trim() ? String(r[npmIdx]).trim() : "";
            const role = roleIdx !== -1 && String(r[roleIdx]).trim() ? String(r[roleIdx]).trim() : "MEMBER";
            const department = deptIdx !== -1 && String(r[deptIdx]).trim() ? String(r[deptIdx]).trim() : "";
            const division = divIdx !== -1 && String(r[divIdx]).trim() ? String(r[divIdx]).trim() : "";
            const positionName = posIdx !== -1 && String(r[posIdx]).trim() ? String(r[posIdx]).trim() : "";
            const statusRaw = statusIdx !== -1 && String(r[statusIdx]).trim() ? String(r[statusIdx]).trim() : "AKTIF";
            const isActive = !statusRaw.toLowerCase().includes("non") && !statusRaw.toLowerCase().includes("inact") && statusRaw.toLowerCase() !== "false";

            let isValid = true;
            let errorMsg = "";

            if (!name) {
              isValid = false;
              errorMsg = "Nama tidak boleh kosong";
            } else if (!email || !email.includes("@")) {
              isValid = false;
              errorMsg = "Format email tidak valid";
            } else if (existingEmails.has(email)) {
              isValid = false;
              errorMsg = "Email sudah ada di database";
            } else if (seenEmailsInFile.has(email)) {
              isValid = false;
              errorMsg = "Email duplikat di file ini";
            } else if (npm && existingNpms.has(npm)) {
              isValid = false;
              errorMsg = "NPM sudah ada di database";
            }

            if (email) seenEmailsInFile.add(email);

            parsedList.push({
              rowNum: i + 1,
              name,
              email,
              password,
              npm,
              role,
              department,
              division,
              positionName,
              isActive,
              isValid,
              errorMsg,
              raw: {
                name,
                email,
                password,
                npm: npm || null,
                role,
                department: department || null,
                division: division || null,
                positionName: positionName || null,
                isActive,
              }
            });
          }

          setImportPreview(parsedList);
          setIsParsing(false);
        } catch (err) {
          console.error("Parse excel error:", err);
          showNotification("Gagal membaca file Excel: " + err.message, "error");
          setIsParsing(false);
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error("Load XLSX error:", err);
      showNotification("Gagal memuat parser Excel", "error");
      setIsParsing(false);
    }
  };

  // --- SUBMIT BULK IMPORT ---
  const handleConfirmImport = async () => {
    const validRows = importPreview.filter(r => r.isValid).map(r => r.raw);
    if (validRows.length === 0) {
      showNotification("Tidak ada baris data valid untuk diimpor.", "error");
      return;
    }

    setIsImporting(true);
    try {
      const res = await importUsers(validRows);
      if (res.success) {
        setImportSummary(res.data);
        showNotification(`Berhasil mengimpor ${res.data.imported} pengguna!`, "success");
        setTimeout(() => {
          refreshData();
        }, 1500);
      } else {
        showNotification("Gagal mengimpor: " + res.error, "error");
      }
    } catch (err) {
      showNotification("Terjadi kesalahan saat mengimpor: " + err.message, "error");
    } finally {
      setIsImporting(false);
    }
  };

  const roleOptions = (roles || []).map(r => ({ value: r?.id, label: r?.name?.replace("_", " ") }));
  const deptOptions = (departments || []).map(d => ({ value: d?.id, label: d?.name }));
  const divOptions = (availableDivisions || []).map(d => ({ value: d?.id, label: d?.name }));

  const validCount = importPreview.filter(r => r.isValid).length;
  const invalidCount = importPreview.filter(r => !r.isValid).length;

  return (
    <div className="w-full relative">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[100] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-semibold border backdrop-blur-xl ${
              notification.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#071a12]"
                : "bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400 bg-white dark:bg-[#1a0707]"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Users className="w-8 h-8 text-primary" />
            {t("users.title")}
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            {t("users.subtitle")}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 md:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 dark:text-white/30" />
            <input 
              type="text"
              placeholder={t("users.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Export to Excel Button */}
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExporting}
            className="flex items-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Ekspor data pengguna ke Excel"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-4 h-4" />
            )}
            <span>Export Excel</span>
          </button>

          {/* Import from Excel Button */}
          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setImportModalOpen(true);
                setImportFile(null);
                setImportPreview([]);
                setImportSummary(null);
              }}
              className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-white/80 border border-gray-200 dark:border-white/10 px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide transition-all shrink-0 hover:scale-105 active:scale-95 cursor-pointer"
              title="Import data pengguna dari Excel"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}

          {/* Add User Button */}
          {canCreate && (
            <button 
              onClick={() => handleOpenModal(false)}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-2.5 rounded-xl font-bold text-xs md:text-sm tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t("users.add_user")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden backdrop-blur-xl shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
          <table className="w-full min-w-[800px] text-left border-collapse">
            <thead className="border-b border-gray-200/50 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("users.table_user")}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("users.table_role")}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("users.table_dept")}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40">{t("users.table_status")}</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/40 text-right">{t("users.table_actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <UserCircle className="w-12 h-12 text-gray-500 dark:text-white/10 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-white/40">{t("users.no_users")}</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/60 dark:hover:bg-white/[0.04] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-gray-900 dark:text-white font-bold tracking-wide text-sm">{user.name}</h3>
                          <p className="text-gray-500 dark:text-white/40 text-xs">{user.email}</p>
                          {user.npm && <p className="text-gray-500 dark:text-white/30 text-[10px] mt-0.5">NPM: {user.npm}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col items-start gap-1">
                        <span className="px-2 py-1 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-md text-gray-500 dark:text-white/70 text-xs font-medium">
                          {user.role.name.replace("_", " ")}
                        </span>
                        {user.positionName && (
                          <span className="text-[10px] text-primary/70 font-semibold">{user.positionName}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-gray-500 dark:text-white/80 text-sm font-medium">{user.department?.name || "-"}</span>
                        {user.division && <span className="text-gray-500 dark:text-white/40 text-xs">{user.division.name}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t("users.active")}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold tracking-wide">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {t("users.inactive")}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        {canUpdate && (
                          <button 
                            onClick={() => handleOpenModal(true, user)} 
                            className="p-2 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            onClick={() => handleOpenDeleteModal(user)} 
                            className="p-2 text-gray-500 dark:text-white/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* IMPORT FROM EXCEL MODAL */}
      <AnimatePresence>
        {importModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !isImporting && setImportModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-4xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10"
            >
              <button 
                onClick={() => !isImporting && setImportModalOpen(false)} 
                className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Modal Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold font-display text-gray-900 dark:text-white">
                    Import Pengguna dari Excel (.xlsx / .csv)
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-white/40 mt-0.5">
                    Unggah berkas spreadsheet untuk menambahkan banyak akun pengguna sekaligus.
                  </p>
                </div>
              </div>

              {/* Download Template Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                      Gunakan Template Resmi
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400/80 mt-0.5">
                      Unduh template yang sudah terformat rapi beserta panduan role dan departemen valid.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-sm hover:shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template Excel</span>
                </button>
              </div>

              {/* File Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleFileChange(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragOver
                    ? "border-primary bg-primary/10 scale-[1.01]"
                    : "border-gray-200 dark:border-white/15 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                />
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary mx-auto flex items-center justify-center mb-3">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {importFile ? importFile.name : "Klik atau seret file Excel ke sini"}
                </p>
                <p className="text-xs text-gray-400 dark:text-white/40 mt-1">
                  Format yang didukung: .xlsx, .xls, .csv (Maks. 5MB)
                </p>
              </div>

              {/* Parsing State */}
              {isParsing && (
                <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                  <p className="text-xs text-gray-500 dark:text-white/60">Sedang membaca dan memvalidasi data...</p>
                </div>
              )}

              {/* Preview Table & Metrics */}
              {importPreview.length > 0 && !isParsing && (
                <div className="mt-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-primary" />
                      Pratinjau Data ({importPreview.length} Baris)
                    </h3>
                    <div className="flex items-center gap-2 text-xs font-semibold">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        ✓ Siap Impor: {validCount}
                      </span>
                      {invalidCount > 0 && (
                        <span className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
                          ✕ Perlu Koreksi: {invalidCount}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">#</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">Nama Lengkap</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">Email</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">NPM</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">Role</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">Departemen</th>
                          <th className="px-3 py-2.5 font-bold text-gray-500 dark:text-white/50">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {importPreview.map((item, idx) => (
                          <tr 
                            key={idx} 
                            className={item.isValid ? "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]" : "bg-red-50/50 dark:bg-red-950/20"}
                          >
                            <td className="px-3 py-2 text-gray-400">{item.rowNum}</td>
                            <td className="px-3 py-2 font-medium text-gray-900 dark:text-white">{item.name || "-"}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-white/70">{item.email || "-"}</td>
                            <td className="px-3 py-2 text-gray-500 dark:text-white/50">{item.npm || "-"}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-white/70 font-mono text-[11px]">{item.role}</td>
                            <td className="px-3 py-2 text-gray-600 dark:text-white/70">{item.department || "-"}</td>
                            <td className="px-3 py-2">
                              {item.isValid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  <Check className="w-3 h-3" /> Valid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded" title={item.errorMsg}>
                                  <AlertCircle className="w-3 h-3" /> {item.errorMsg}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => !isImporting && setImportModalOpen(false)}
                  disabled={isImporting}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={isImporting || validCount === 0}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-primary text-[#050e0a] hover:bg-primary-focus shadow-lg shadow-primary/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Mengimpor Data...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Impor {validCount} Pengguna</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER MODAL (ADD / EDIT) */}
      <AnimatePresence>
        {modal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setModal({ isOpen: false, isEdit: false, data: null })}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-3xl p-8 w-full max-w-2xl relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent"
            >
              <button onClick={() => setModal({ isOpen: false, isEdit: false, data: null })} className="absolute top-6 right-6 text-gray-500 dark:text-white/50 hover:text-gray-900 dark:text-white z-50 cursor-pointer">
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-6">
                {modal.isEdit ? t("users.modal_edit") : t("users.modal_add")}
              </h2>
              
              {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-sm">{error}</div>}
              
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5 relative">
                
                {/* Basic Info */}
                <div className="col-span-full">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 border-b border-gray-200 dark:border-white/10 pb-2">{t("users.basic_info")}</h3>
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.full_name")}</label>
                  <input name="name" type="text" required defaultValue={modal.data?.name} className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 focus:bg-white dark:bg-white/10 transition-colors" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.email")}</label>
                  <input name="email" type="email" required defaultValue={modal.data?.email} className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 focus:bg-white dark:bg-white/10 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.npm")}</label>
                  <input name="npm" type="text" defaultValue={modal.data?.npm || ""} className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 focus:bg-white dark:bg-white/10 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.password")}</label>
                  <input name="password" type={modal.isEdit ? "password" : "text"} required={!modal.isEdit} placeholder={modal.isEdit ? t("users.pwd_placeholder_edit") : t("users.pwd_placeholder_add")} className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 focus:bg-white dark:bg-white/10 transition-colors" />
                </div>

                {/* Organization Structure */}
                <div className="col-span-full mt-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-primary mb-3 border-b border-gray-200 dark:border-white/10 pb-2">{t("users.org_structure")}</h3>
                </div>

                {/* Custom Selects */}
                <div className="relative z-50">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.role_level")}</label>
                  <CustomSelect 
                    name="roleId" 
                    options={roleOptions} 
                    value={selectedRoleId} 
                    onChange={setSelectedRoleId} 
                    placeholder={t("users.select_role")}
                    required 
                    t={t}
                  />
                </div>

                <div className="relative z-[49]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.specific_position")}</label>
                  <CustomSelect 
                    name="positionName" 
                    options={positionOptions} 
                    value={selectedPositionName} 
                    onChange={setSelectedPositionName} 
                    placeholder={t("users.placeholder_position") || "Select Position"}
                    t={t}
                  />
                </div>

                <div className="relative z-[48]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.table_dept")}</label>
                  <CustomSelect 
                    name="departmentId" 
                    options={[{ value: "", label: t("users.no_dept") }, ...deptOptions]} 
                    value={selectedDeptId} 
                    onChange={(val) => {
                      setSelectedDeptId(val);
                      setSelectedDivId("");
                    }} 
                    placeholder={t("users.select_dept")}
                    t={t}
                  />
                </div>

                <div className="relative z-[47]">
                  <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 mb-2">{t("users.division")}</label>
                  <CustomSelect 
                    name="divisionId" 
                    options={[{ value: "", label: t("users.no_div") }, ...divOptions]} 
                    value={selectedDivId} 
                    onChange={setSelectedDivId} 
                    placeholder={t("users.select_div")} 
                    disabled={!selectedDeptId} 
                    t={t}
                  />
                </div>

                <div className="col-span-full flex items-center gap-3 mt-4">
                  <input type="hidden" name="isActive" value="false" />
                  <input 
                    type="checkbox" 
                    name="isActive" 
                    id="isActive" 
                    value="true" 
                    defaultChecked={modal.isEdit ? modal.data?.isActive : true}
                    className="w-5 h-5 accent-primary rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">{t("users.account_active")}</label>
                </div>

                <div className="col-span-full pt-4 mt-2 border-t border-gray-200 dark:border-white/10">
                  <button type="submit" disabled={loading} className="w-full bg-primary text-[#050e0a] font-bold py-3.5 rounded-xl hover:bg-primary-focus hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-50 cursor-pointer">
                    {loading ? t("users.saving") : t("users.save_user")}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteModal.isOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDeleteModal}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-[#071510] border border-gray-200 dark:border-white/10 rounded-3xl p-6 sm:p-8 w-full max-w-md relative z-10 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Hapus Pengguna Secara Permanen?
              </h2>
              
              <p className="text-sm text-gray-500 dark:text-white/60 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus akun <span className="font-bold text-gray-900 dark:text-white">{deleteModal.user?.name}</span> ({deleteModal.user?.email})? Tindakan ini tidak dapat dibatalkan.
              </p>

              {error && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseDeleteModal}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider text-gray-500 dark:text-white/70 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteUser}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Hapus Permanen"
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
