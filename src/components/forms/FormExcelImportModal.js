'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  X,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  FileCheck,
  RefreshCw,
  PlusCircle,
  FileText,
  List,
  CheckSquare,
  Calendar,
  Hash,
  SplitSquareVertical,
  ChevronDown,
} from 'lucide-react';
import ExcelJS from 'exceljs';

// Mapping helper for question types
export const QUESTION_TYPE_LABELS = {
  text: 'Jawaban Singkat',
  paragraph: 'Paragraf',
  radio: 'Pilihan Ganda',
  checkbox: 'Kotak Centang',
  dropdown: 'Dropdown',
  file: 'Upload File / Berkas',
  date: 'Tanggal',
  number: 'Angka',
  page_break: 'Pembatas Halaman',
};

export const QUESTION_TYPE_ICONS = {
  text: FileText,
  paragraph: FileText,
  radio: List,
  checkbox: CheckSquare,
  dropdown: ChevronDown,
  file: UploadCloud,
  date: Calendar,
  number: Hash,
  page_break: SplitSquareVertical,
};

// --- DOWNLOAD TEMPLATE EXCEL ---
export async function downloadFormQuestionTemplate() {
  try {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'SRE UPN Veteran Jawa Timur - Form Builder';
    workbook.created = new Date();

    // 1. SHEET 1: TEMPLATE PERTANYAAN
    const sheet = workbook.addWorksheet('Template Pertanyaan', {
      views: [{ showGridLines: true }],
    });

    sheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Tipe Pertanyaan', key: 'type', width: 22 },
      { header: 'Pertanyaan / Judul', key: 'question', width: 45 },
      { header: 'Wajib Diisi (YA/TIDAK)', key: 'required', width: 24 },
      { header: 'Pilihan Jawaban (Pisahkan tanda titik koma ; atau koma)', key: 'options', width: 45 },
      { header: 'Format File (Khusus File: all/pdf/image/document/archive/audio_video)', key: 'allowedTypes', width: 42 },
      { header: 'Batas Ukuran MB (1/5/10/25/50/100)', key: 'maxSizeMb', width: 28 },
      { header: 'Maks Jumlah File (1/3/5/10)', key: 'maxFiles', width: 24 },
    ];

    // Style Header
    const headerRow = sheet.getRow(1);
    headerRow.height = 32;
    headerRow.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF059669' }, // Emerald 600
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF047857' } },
        left: { style: 'thin', color: { argb: 'FF047857' } },
        bottom: { style: 'medium', color: { argb: 'FF065F46' } },
        right: { style: 'thin', color: { argb: 'FF047857' } },
      };
    });

    // Example Rows Covering ALL 9 Question Types
    const exampleRows = [
      {
        no: 1,
        type: 'text',
        question: 'Nama Lengkap (Sesuai KTM/KTP)',
        required: 'YA',
        options: '',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 2,
        type: 'paragraph',
        question: 'Motivasi Anda mendaftar program ini?',
        required: 'YA',
        options: '',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 3,
        type: 'radio',
        question: 'Pilihan Divisi Minat',
        required: 'YA',
        options: 'Human Capital; Renewable Energy R&D; Public Relations; Event Organizer; Creative & Media',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 4,
        type: 'checkbox',
        question: 'Keahlian yang Anda miliki (Bisa pilih lebih dari satu)',
        required: 'TIDAK',
        options: 'Desain Grafis (Canva/Figma/Photoshop); Public Speaking / MC; Web Development; Penulisan Artikel; Pengolahan Data (Excel/Python)',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 5,
        type: 'dropdown',
        question: 'Fakultas / Program Studi',
        required: 'YA',
        options: 'Teknik Kimia; Teknik Lingkungan; Teknik Industri; Sistem Informasi; Informatika; Agroteknologi; Manajemen; Ilmu Komunikasi',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 6,
        type: 'number',
        question: 'Nomor WhatsApp Aktif (Angka saja)',
        required: 'YA',
        options: '',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 7,
        type: 'date',
        question: 'Tanggal Lahir',
        required: 'TIDAK',
        options: '',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 8,
        type: 'page_break',
        question: 'Pembatas Halaman (Bagian Dokumen Berkas)',
        required: 'TIDAK',
        options: '',
        allowedTypes: '',
        maxSizeMb: '',
        maxFiles: '',
      },
      {
        no: 9,
        type: 'file',
        question: 'Unggah CV / Resume Terbaru (PDF)',
        required: 'YA',
        options: '',
        allowedTypes: 'pdf',
        maxSizeMb: 10,
        maxFiles: 1,
      },
      {
        no: 10,
        type: 'file',
        question: 'Unggah Bukti Follow Akun Media Sosial (Foto/Screenshot)',
        required: 'TIDAK',
        options: '',
        allowedTypes: 'image',
        maxSizeMb: 5,
        maxFiles: 3,
      },
    ];

    exampleRows.forEach((row, idx) => {
      const addedRow = sheet.addRow(row);
      addedRow.height = 24;
      addedRow.font = { name: 'Segoe UI', size: 10 };
      addedRow.alignment = { vertical: 'middle', wrapText: true };
      
      const isEven = idx % 2 === 0;
      addedRow.eachCell((cell, colNumber) => {
        if (isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF9FAFB' },
          };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        };
        if (colNumber === 1 || colNumber === 4 || colNumber === 7 || colNumber === 8) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    // 2. SHEET 2: PANDUAN & TIPE PERTANYAAN
    const guideSheet = workbook.addWorksheet('Panduan & Tipe Pertanyaan', {
      views: [{ showGridLines: true }],
    });

    guideSheet.columns = [
      { header: 'Nilai Tipe', key: 'typeKey', width: 18 },
      { header: 'Nama Tipe Pertanyaan', key: 'typeName', width: 28 },
      { header: 'Format / Aturan Pengisian', key: 'rules', width: 45 },
      { header: 'Contoh Pengisian', key: 'example', width: 45 },
    ];

    const guideHeader = guideSheet.getRow(1);
    guideHeader.height = 30;
    guideHeader.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    guideHeader.alignment = { vertical: 'middle', horizontal: 'center' };
    guideHeader.eachCell((c) => {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    });

    const guideRows = [
      {
        typeKey: 'text',
        typeName: 'Jawaban Singkat',
        rules: 'Kolom Pilihan Jawaban dan Format File dikosongkan.',
        example: 'Nama Panggilan, Akun Instagram, Asal Kota',
      },
      {
        typeKey: 'paragraph',
        typeName: 'Paragraf / Teks Panjang',
        rules: 'Untuk jawaban esai/penjelasan panjang.',
        example: 'Ceritakan pengalaman kepemimpinan Anda...',
      },
      {
        typeKey: 'radio',
        typeName: 'Pilihan Ganda (Satu Pilihan)',
        rules: 'Kolom Pilihan Jawaban diisi opsi yang dipisahkan titik koma (;) atau koma (,).',
        example: 'Pria; Wanita  ATAU  Setuju, Netral, Tidak Setuju',
      },
      {
        typeKey: 'checkbox',
        typeName: 'Kotak Centang (Multi-Pilihan)',
        rules: 'Kolom Pilihan Jawaban diisi opsi yang dipisahkan titik koma (;) atau koma (,). Responden bisa memilih lebih dari satu.',
        example: 'Figma; Photoshop; Premiere Pro; Illustrator',
      },
      {
        typeKey: 'dropdown',
        typeName: 'Dropdown Menu',
        rules: 'Kolom Pilihan Jawaban diisi opsi yang dipisahkan titik koma (;) atau koma (,). Tampil dalam menu pull-down.',
        example: 'Angkatan 2023; Angkatan 2024; Angkatan 2025; Angkatan 2026',
      },
      {
        typeKey: 'number',
        typeName: 'Angka',
        rules: 'Hanya menerima input numerik dari responden.',
        example: 'NPM / NIM, Umur, IPK Terakhir',
      },
      {
        typeKey: 'date',
        typeName: 'Tanggal',
        rules: 'Input picker tanggal (Hari/Bulan/Tahun).',
        example: 'Tanggal Mulai Magang, Tanggal Ulang Tahun',
      },
      {
        typeKey: 'page_break',
        typeName: 'Pembatas Halaman (Section Break)',
        rules: 'Memisahkan formulir menjadi beberapa halaman step-by-step.',
        example: 'Tuliskan judul pembatas di kolom Pertanyaan.',
      },
      {
        typeKey: 'file',
        typeName: 'Upload File / Berkas Google Drive',
        rules: 'Format File: all / pdf / image / document / archive / audio_video.\nBatas Ukuran MB: 1, 5, 10, 25, 50, 100.\nMaks Jumlah File: 1, 3, 5, 10.',
        example: 'Format File: "pdf, image", Batas Ukuran: 10, Maks File: 2',
      },
    ];

    guideRows.forEach((r, idx) => {
      const gRow = guideSheet.addRow(r);
      gRow.height = 28;
      gRow.font = { name: 'Segoe UI', size: 10 };
      gRow.alignment = { vertical: 'middle', wrapText: true };
      if (idx % 2 === 0) {
        gRow.eachCell((c) => (c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }));
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Template_Import_Pertanyaan_Form_SRE_UPNVJT.xlsx';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
  } catch (err) {
    console.error('Download template error:', err);
    throw err;
  }
}

// --- NORMALIZE PARSED QUESTION ---
function normalizeQuestionType(typeRaw) {
  if (!typeRaw) return 'text';
  const clean = String(typeRaw).toLowerCase().trim().replace(/[\s_-]+/g, '');
  
  if (['text', 'jawabansingkat', 'shorttext', 'singkat', 'string'].includes(clean)) return 'text';
  if (['paragraph', 'paragraf', 'longtext', 'essay', 'esai', 'textarea', 'deskripsi'].includes(clean)) return 'paragraph';
  if (['radio', 'pilihanganda', 'multiplechoice', 'pilihan', 'mc', 'singlechoice'].includes(clean)) return 'radio';
  if (['checkbox', 'kotakcentang', 'centang', 'multichoice', 'multiple'].includes(clean)) return 'checkbox';
  if (['dropdown', 'pilihandropdown', 'select', 'menu'].includes(clean)) return 'dropdown';
  if (['file', 'upload', 'uploadfile', 'berkas', 'dokumen', 'lampiran', 'attachment'].includes(clean)) return 'file';
  if (['date', 'tanggal', 'tgl', 'datetime', 'waktu'].includes(clean)) return 'date';
  if (['number', 'angka', 'nomor', 'numeric', 'integer', 'npm', 'nim'].includes(clean)) return 'number';
  if (['pagebreak', 'pembatashalaman', 'pembatas', 'halamanbaru', 'section', 'break'].includes(clean)) return 'page_break';

  return 'text';
}

function parseBoolean(val) {
  if (typeof val === 'boolean') return val;
  if (!val) return false;
  const str = String(val).toLowerCase().trim();
  return ['ya', 'yes', 'true', '1', 'y', 'wajib', 'required'].includes(str);
}

function parseOptions(val) {
  if (!val) return [''];
  if (Array.isArray(val)) return val.filter(Boolean);
  const str = String(val).trim();
  if (!str) return [''];

  // Support separator: semicolon ;, comma ,, newline \n, or pipe |
  let delimiter = ';';
  if (str.includes(';')) delimiter = ';';
  else if (str.includes('\n')) delimiter = '\n';
  else if (str.includes('|')) delimiter = '|';
  else if (str.includes(',')) delimiter = ',';

  const parts = str.split(delimiter).map((s) => s.trim()).filter((s) => s.length > 0);
  return parts.length > 0 ? parts : [''];
}

function parseAllowedTypes(val) {
  if (!val) return ['all'];
  if (Array.isArray(val)) return val;
  const str = String(val).toLowerCase().trim();
  if (str === '' || str === 'all' || str === 'semua' || str === 'semua format') return ['all'];

  const validTypes = ['all', 'pdf', 'image', 'document', 'archive', 'audio_video'];
  const parts = str.split(/[,;\s/|]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

  const mapped = parts.map((p) => {
    if (['pdf'].includes(p)) return 'pdf';
    if (['image', 'gambar', 'foto', 'jpg', 'png', 'webp'].includes(p)) return 'image';
    if (['document', 'dokumen', 'doc', 'docx', 'word', 'office', 'excel', 'ppt'].includes(p)) return 'document';
    if (['archive', 'arsip', 'zip', 'rar', '7z'].includes(p)) return 'archive';
    if (['audio_video', 'audio', 'video', 'media', 'mp4', 'mp3'].includes(p)) return 'audio_video';
    return p;
  }).filter((p) => validTypes.includes(p));

  return mapped.length > 0 ? mapped : ['all'];
}

export function parseExcelQuestions(rawMatrix) {
  if (!rawMatrix || rawMatrix.length < 2) {
    throw new Error('Format file Excel kosong atau tidak memiliki baris data pertanyaan.');
  }

  // Find header row index
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rawMatrix.length, 6); i++) {
    const rowStr = rawMatrix[i].map((c) => String(c || '').toLowerCase()).join(' ');
    if (
      rowStr.includes('tipe') ||
      rowStr.includes('pertanyaan') ||
      rowStr.includes('question') ||
      rowStr.includes('type')
    ) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    headerIndex = 0; // fallback to first row
  }

  const headerRow = rawMatrix[headerIndex].map((c) => String(c || '').toLowerCase().trim());

  // Identify column indexes with strict disambiguation
  let colType = headerRow.findIndex((h) => h.includes('tipe') || h.includes('type') || h === 'jenis');
  let colQuestion = headerRow.findIndex((h) => 
    (h.includes('pertanyaan') || h.includes('question') || h.includes('judul') || h.includes('title') || h.includes('soal') || h.includes('teks')) &&
    !h.includes('tipe') && !h.includes('type')
  );
  let colRequired = headerRow.findIndex((h) => h.includes('wajib') || h.includes('required') || h.includes('mandatory'));
  let colOptions = headerRow.findIndex((h) => 
    (h.includes('pilihan') || h.includes('option') || h.includes('opsi') || h.includes('jawaban')) && 
    !h.includes('tipe') && !h.includes('type') && !h.includes('wajib')
  );
  let colAllowedTypes = headerRow.findIndex((h) => h.includes('format') || h.includes('allowed') || h.includes('jenis berkas') || h.includes('ekstensi'));
  let colMaxSize = headerRow.findIndex((h) => h.includes('ukuran') || h.includes('size') || h.includes('mb') || h.includes('max size'));
  let colMaxFiles = headerRow.findIndex((h) => h.includes('jumlah') || h.includes('max files') || h.includes('count') || h.includes('banyak file'));

  // Disambiguation fallbacks
  if (colType === -1 && headerRow.length >= 2) colType = 1;
  if (colQuestion === -1 && headerRow.length >= 3) colQuestion = 2;
  if (colQuestion === colType) {
    colQuestion = headerRow.findIndex((h, idx) => idx !== colType && (h.includes('pertanyaan') || h.includes('question') || h.includes('judul') || h.includes('title') || idx === 2));
  }

  const parsedQuestions = [];

  for (let r = headerIndex + 1; r < rawMatrix.length; r++) {
    const row = rawMatrix[r];
    if (!row || row.every((c) => c === '' || c === undefined || c === null)) {
      continue; // Skip empty rows
    }

    const typeRaw = colType !== -1 && colType < row.length ? row[colType] : (row.length > 1 ? row[1] : row[0]);
    const questionRaw = colQuestion !== -1 && colQuestion < row.length ? row[colQuestion] : (row.length > 2 ? row[2] : (colType === 0 ? row[1] : row[0]));
    const requiredRaw = colRequired !== -1 && colRequired < row.length ? row[colRequired] : '';
    const optionsRaw = colOptions !== -1 && colOptions < row.length ? row[colOptions] : '';
    const allowedTypesRaw = colAllowedTypes !== -1 && colAllowedTypes < row.length ? row[colAllowedTypes] : '';
    const maxSizeRaw = colMaxSize !== -1 && colMaxSize < row.length ? row[colMaxSize] : '';
    const maxFilesRaw = colMaxFiles !== -1 && colMaxFiles < row.length ? row[colMaxFiles] : '';

    const type = normalizeQuestionType(typeRaw);
    const questionText = String(questionRaw || '').trim();

    if (!questionText && type !== 'page_break') {
      continue; // Skip rows without question text unless it's a page break
    }

    const qItem = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type,
      question: questionText || (type === 'page_break' ? 'Pembatas Halaman' : ''),
      required: parseBoolean(requiredRaw),
      points: 0,
    };

    if (['radio', 'checkbox', 'dropdown'].includes(type)) {
      qItem.options = parseOptions(optionsRaw);
    } else {
      qItem.options = [''];
    }

    if (type === 'file') {
      qItem.allowedTypes = parseAllowedTypes(allowedTypesRaw);
      const parsedSize = parseInt(String(maxSizeRaw || '10'), 10);
      qItem.maxSizeMb = [1, 5, 10, 25, 50, 100].includes(parsedSize) ? parsedSize : 10;

      const parsedFiles = parseInt(String(maxFilesRaw || '1'), 10);
      qItem.maxFiles = [1, 3, 5, 10].includes(parsedFiles) ? parsedFiles : 1;
    }

    parsedQuestions.push(qItem);
  }

  if (parsedQuestions.length === 0) {
    throw new Error('Tidak ada pertanyaan valid yang berhasil diekstrak dari file Excel.');
  }

  return parsedQuestions;
}

// --- MAIN REACT MODAL COMPONENT ---
export default function FormExcelImportModal({
  isOpen,
  onClose,
  onImportQuestions,
  currentQuestionsCount = 0,
}) {
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [parsedList, setParsedList] = useState([]);
  const [importMode, setImportMode] = useState('append'); // 'append' | 'replace'
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setParsedList([]);
    setErrorMsg('');
    setParsing(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadFormQuestionTemplate();
    } catch (err) {
      setErrorMsg('Gagal mengunduh template Excel: ' + (err.message || 'Terjadi kesalahan'));
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleFileProcess = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setParsing(true);
    setParsedList([]);

    try {
      const XLSX = await import('xlsx');
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          const questions = parseExcelQuestions(rawRows);
          setParsedList(questions);
          setParsing(false);
        } catch (err) {
          console.error('Parse Excel Error:', err);
          setErrorMsg(err.message || 'Gagal membaca isi file Excel.');
          setParsing(false);
        }
      };

      reader.onerror = () => {
        setErrorMsg('Gagal membaca file berkas.');
        setParsing(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      console.error('Import Error:', err);
      setErrorMsg('Gagal memproses file Excel.');
      setParsing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleApplyImport = () => {
    if (parsedList.length === 0) return;
    onImportQuestions(parsedList, importMode);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-3xl bg-white dark:bg-[#071913] border border-gray-200 dark:border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-white to-white dark:from-emerald-950/30 dark:via-[#071913] dark:to-[#071913]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-display font-black text-gray-900 dark:text-white tracking-tight">
                Import Pertanyaan dari Excel (.xlsx)
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/60 mt-0.5">
                Unggah berkas spreadsheet untuk menambahkan seluruh pertanyaan secara instan.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
          {/* Download Template Banner */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-sm shrink-0">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                  Belum punya format Excel?
                </span>
                <span className="text-[11px] text-gray-600 dark:text-white/60">
                  Gunakan template resmi yang telah mencakup seluruh 9 tipe pertanyaan & contoh pengisian.
                </span>
              </div>
            </div>
            <button
              onClick={handleDownloadTemplate}
              disabled={downloadingTemplate}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shrink-0 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingTemplate ? 'Menyiapkan...' : 'Download Template .xlsx'}</span>
            </button>
          </div>

          {/* Upload Dropzone */}
          {parsedList.length === 0 ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-8 sm:p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10 scale-[0.99]'
                  : 'border-gray-200 dark:border-white/15 bg-gray-50/50 dark:bg-white/[0.02] hover:border-emerald-400 dark:hover:border-emerald-500/50 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                className="hidden"
              />
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {parsing ? (
                  <RefreshCw className="w-8 h-8 animate-spin" />
                ) : (
                  <UploadCloud className="w-8 h-8" />
                )}
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                {parsing ? 'Sedang Memproses Berkas Excel...' : 'Klik atau Seret Berkas Excel ke Sini'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-white/50 max-w-sm mx-auto">
                Format yang didukung: <strong>.xlsx</strong>, <strong>.xls</strong>, atau <strong>.csv</strong> (Maksimal 10MB)
              </p>
            </div>
          ) : (
            /* Parsed Questions Preview */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs">
                    {parsedList.length}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                      Pertanyaan Berhasil Dideteksi
                    </h4>
                    <span className="text-[11px] text-gray-500 dark:text-white/50">
                      Periksa pratinjau pertanyaan di bawah sebelum menyimpannya ke formulir.
                    </span>
                  </div>
                </div>

                <button
                  onClick={resetState}
                  className="text-xs text-gray-500 hover:text-red-500 dark:text-white/60 dark:hover:text-red-400 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} /> Ganti Berkas
                </button>
              </div>

              {/* Import Mode Switcher */}
              <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 space-y-2">
                <label className="block text-xs font-bold text-gray-700 dark:text-white/80">
                  Mode Import Pertanyaan:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'append'
                        ? 'bg-emerald-50/70 dark:bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-300 shadow-sm'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-white/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="mt-0.5 text-emerald-600 accent-emerald-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold block">Tambahkan (Append)</span>
                      <span className="text-[10px] opacity-75">
                        Menambahkan {parsedList.length} pertanyaan baru setelah {currentQuestionsCount} pertanyaan yang ada.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      importMode === 'replace'
                        ? 'bg-red-50/70 dark:bg-red-500/10 border-red-500 text-red-900 dark:text-red-300 shadow-sm'
                        : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-white/70'
                    }`}
                  >
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-red-600 accent-red-500"
                    />
                    <div className="text-xs">
                      <span className="font-bold block text-red-700 dark:text-red-400">Gantikan Semua (Replace)</span>
                      <span className="text-[10px] opacity-75">
                        Menghapus seluruh pertanyaan lama dan menggantinya dengan {parsedList.length} pertanyaan ini.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Questions List Table */}
              <div className="border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-white/60 font-bold sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-32">Tipe</th>
                      <th className="py-2.5 px-3">Pertanyaan & Opsi</th>
                      <th className="py-2.5 px-3 w-20 text-center">Wajib</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-800 dark:text-white/90">
                    {parsedList.map((q, idx) => {
                      const Icon = QUESTION_TYPE_ICONS[q.type] || FileText;
                      return (
                        <tr key={q.id || idx} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-gray-400 dark:text-white/40">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold text-[11px] whitespace-nowrap">
                              <Icon className="w-3 h-3 shrink-0" />
                              {QUESTION_TYPE_LABELS[q.type] || q.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {q.question || <span className="italic text-gray-400">(Tanpa Judul)</span>}
                            </div>
                            {q.options && q.options.length > 0 && q.options[0] !== '' && (
                              <div className="text-[10px] text-gray-500 dark:text-white/50 mt-0.5 line-clamp-1">
                                Opsi: {q.options.join(' • ')}
                              </div>
                            )}
                            {q.type === 'file' && (
                              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                                Format: {q.allowedTypes?.join(', ')?.toUpperCase()} • Maks: {q.maxSizeMb}MB • {q.maxFiles} File
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {q.required ? (
                              <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-bold text-[10px]">
                                Ya
                              </span>
                            ) : (
                              <span className="text-gray-400 dark:text-white/30 text-[10px]">
                                Tidak
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-gray-100 dark:border-white/10 flex items-center justify-between bg-gray-50/50 dark:bg-black/20">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white font-bold text-xs hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            Batal
          </button>

          {parsedList.length > 0 && (
            <button
              onClick={handleApplyImport}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {importMode === 'replace'
                  ? `Gantikan dengan ${parsedList.length} Pertanyaan`
                  : `Tambahkan ${parsedList.length} Pertanyaan`}
              </span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
