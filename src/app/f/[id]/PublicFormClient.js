'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Sparkles,
  RotateCcw,
  UploadCloud,
  FileText,
  Trash2,
  ExternalLink,
  Clock,
  ShieldCheck,
  Check,
  Calendar,
  ChevronDown,
  X,
  Plus,
  Minus,
  FileCheck,
  Copy,
  Layers,
  ArrowRight,
  HelpCircle,
  CheckSquare,
  List,
  Hash,
  Sun,
  Moon,
  UserCheck,
  LogIn,
  User,
  Info,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import {
  getFileAcceptAttribute,
  getAllowedTypesLabel,
  validateFileRules,
} from '@/lib/fileValidation';

export default function PublicFormClient({ form, user }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [focusedQuestionId, setFocusedQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    form?.successMessage || 'Tanggapan Anda telah berhasil direkam.'
  );
  const [uploadingFiles, setUploadingFiles] = useState({});
  const [uploadErrors, setUploadErrors] = useState({});
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? (theme === 'system' ? resolvedTheme === 'dark' : theme === 'dark') : true;

  // Group questions into pages using 'page_break'
  const pages = useMemo(() => {
    const rawQuestions = form?.questions || [];
    const groupedPages = [[]];

    rawQuestions.forEach((q) => {
      if (q.type === 'page_break') {
        if (groupedPages[groupedPages.length - 1].length > 0) {
          groupedPages.push([]);
        }
      } else {
        groupedPages[groupedPages.length - 1].push(q);
      }
    });

    return groupedPages.filter((p) => p.length > 0);
  }, [form?.questions]);

  const activeQuestions = pages[currentPage] || [];
  const totalPages = pages.length;
  const isLastPage = currentPage === totalPages - 1;

  // Calculate real progress across all questions
  const totalValidQuestions = useMemo(() => {
    return (form?.questions || []).filter((q) => q && q.type !== 'page_break');
  }, [form?.questions]);

  const answeredCount = useMemo(() => {
    return totalValidQuestions.filter((q) => {
      const val = answers[q.id];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      return true;
    }).length;
  }, [answers, totalValidQuestions]);

  const progressPercentage = Math.round(
    (answeredCount / Math.max(totalValidQuestions.length, 1)) * 100
  );

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    if (errors[questionId]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const handleCheckboxChange = (questionId, option, checked) => {
    const current = answers[questionId] || [];
    let updated;
    if (checked) {
      updated = [...current, option];
    } else {
      updated = current.filter((item) => item !== option);
    }
    handleInputChange(questionId, updated);
  };

  const handleFileUpload = async (q, file) => {
    if (!file || !q) return;

    const validation = validateFileRules(file, q.allowedTypes, q.maxSizeMb);
    if (!validation.valid) {
      setUploadErrors((prev) => ({
        ...prev,
        [q.id]: validation.error,
      }));
      return;
    }

    setUploadingFiles((prev) => ({ ...prev, [q.id]: true }));
    setUploadErrors((prev) => ({ ...prev, [q.id]: '' }));

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('questionId', String(q.id));

      const targetId = form.uuid || form.id;
      const res = await fetch(`/api/forms/${targetId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengunggah berkas ke Google Drive');
      }

      handleInputChange(q.id, data.file?.url || '');
    } catch (err) {
      console.error('File upload error:', err);
      setUploadErrors((prev) => ({
        ...prev,
        [q.id]: err.message || 'Gagal mengunggah berkas. Silakan coba kembali.',
      }));
    } finally {
      setUploadingFiles((prev) => ({ ...prev, [q.id]: false }));
    }
  };

  const handleRemoveFile = (questionId) => {
    handleInputChange(questionId, '');
    setUploadErrors((prev) => ({ ...prev, [questionId]: '' }));
  };

  const validateCurrentPage = () => {
    const newErrors = {};

    activeQuestions.forEach((q) => {
      if (uploadingFiles[q.id]) {
        newErrors[q.id] = 'Harap tunggu proses pengunggahan berkas selesai';
      } else if (q.required) {
        const ans = answers[q.id];
        if (
          ans === undefined ||
          ans === null ||
          (typeof ans === 'string' && ans.trim() === '') ||
          (Array.isArray(ans) && ans.length === 0)
        ) {
          newErrors[q.id] =
            q.type === 'file' ? 'Berkas ini wajib diunggah' : 'Pertanyaan ini wajib diisi';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentPage()) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateCurrentPage()) {
      const firstErrorEl = document.querySelector('.has-error');
      if (firstErrorEl) {
        firstErrorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const formattedAnswers = (form.questions || [])
        .filter((q) => q && q.type !== 'page_break')
        .map((q) => {
          const val = answers[q.id];
          return {
            questionId: String(q.id),
            questionTitle: q.question || '',
            value: val !== undefined && val !== null ? val : '',
          };
        });

      const targetId = form.uuid || form.id;
      const res = await fetch(`/api/forms/${targetId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: formattedAnswers,
          userId: user?.id || null,
          userName: user?.name || '',
          userEmail: user?.email || '',
          userNpm: user?.npm || '',
          responderName: user?.name || '',
          responderEmail: user?.email || '',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mengirim tanggapan formulir');
      }

      if (data.message) {
        setSuccessMessage(data.message);
      }
      setSubmissionId(data.submissionId ? `#SRE-${String(data.submissionId).padStart(5, '0')}` : null);
      setSubmittedAt(new Date());
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Submit error:', err);
      setSubmitError(err.message || 'Terjadi kesalahan jaringan saat mengirim tanggapan');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setErrors({});
    setCurrentPage(0);
    setSubmitted(false);
    setSubmissionId(null);
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCopyReceipt = () => {
    const text = `Bukti Pengisian Formulir SRE UPNVJT\nJudul: ${form.title}\nID Submisi: ${submissionId || 'Terekam'}\n${user ? `Akun: ${user.name} (${user.email})\nUser ID: #${user.id}\n` : ''}Waktu: ${new Date().toLocaleString('id-ID')}\nStatus: Berhasil Terkirim ke Google Spreadsheet`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Toggle Theme Function
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // JIKA FORM TIDAK DIPUBLIKASIKAN (DRAFT / TUTUP)
  if (!form.isPublished) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#07130e] text-slate-900 dark:text-white flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="max-w-lg w-full bg-white dark:bg-[#0a1813]/90 border border-amber-500/30 rounded-3xl p-8 sm:p-10 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500" />
          <div className="w-16 h-16 bg-amber-500/15 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/30 shadow-inner">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black mb-3 text-slate-900 dark:text-white">
            Formulir Ditutup Sementara
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
            Formulir <strong className="text-slate-900 dark:text-white">&ldquo;{form.title}&rdquo;</strong> saat ini berstatus draf atau tidak menerima tanggapan baru. Silakan hubungi pengurus SRE UPNVJT.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-7 py-3.5 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // TAMPILAN SUKSES SETELAH PENGISIAN (CELEBRATION SCREEN)
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#06120d] text-slate-900 dark:text-white flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans transition-colors duration-500">
        {/* Glow ambient background orbs */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[150px] pointer-events-none" />
        <div className="fixed bottom-10 right-10 w-80 h-80 bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />

        {/* Floating Theme Switcher */}
        <div className="fixed top-6 right-6 z-50">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-2xl bg-white/80 dark:bg-white/10 backdrop-blur-xl border border-slate-200 dark:border-white/15 text-slate-700 dark:text-white shadow-lg hover:scale-105 transition-all cursor-pointer"
            title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-emerald-600" />}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 25 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl w-full bg-white dark:bg-[#0a1f18]/90 border border-slate-200/80 dark:border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-950/10 dark:shadow-emerald-950/50 backdrop-blur-2xl relative overflow-hidden z-10"
        >
          {/* Top Rainbow Accent Line */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-yellow-300 absolute top-0 left-0" />

          {/* Success Check Icon Badge */}
          <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.1 }}
              className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-600 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-400/30"
            >
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-600 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Respon Berhasil Direkam</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-black text-slate-900 dark:text-white mb-3 tracking-tight">
              Terima Kasih!
            </h2>

            <p className="text-slate-600 dark:text-emerald-100/70 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {successMessage}
            </p>
          </div>

          {/* Digital Receipt Card */}
          <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-5 mb-8 space-y-3.5 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-white/50 font-medium">Formulir</span>
              <span className="font-bold text-slate-900 dark:text-white text-right max-w-[220px] truncate">
                {form.title}
              </span>
            </div>

            {/* Account Info in Receipt */}
            {user && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50 font-medium">Akun Responden</span>
                <span className="font-bold text-slate-900 dark:text-white text-right flex items-center gap-1.5 truncate">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="truncate">{user.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                    #{user.id}
                  </span>
                </span>
              </div>
            )}

            {submissionId && (
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
                <span className="text-slate-500 dark:text-white/50 font-medium">ID Submisi</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 dark:border-emerald-500/30">
                  {submissionId}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/5">
              <span className="text-slate-500 dark:text-white/50 font-medium">Waktu Kirim</span>
              <span className="text-slate-800 dark:text-white/90 font-semibold">
                {new Date(submittedAt || Date.now()).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 dark:text-white/50 font-medium">Sinkronisasi</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Google Sheets & Drive
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCopyReceipt}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-white/15 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 font-bold text-xs sm:text-sm text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedReceipt ? (
                <>
                  <Check size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Salin Bukti Kirim</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw size={16} />
              <span>Kirim Tanggapan Lain</span>
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-200 dark:border-white/10 flex items-center justify-center gap-2 text-xs text-slate-400 dark:text-white/40">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Society of Renewable Energy &bull; UPN Veteran Jawa Timur</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN UTAMA FORM FILLING (MODERN DUAL THEME & RESPONSIVE)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/70 via-slate-50 to-teal-50/50 dark:from-[#05110d] dark:via-[#07140f] dark:to-[#030a08] text-slate-900 dark:text-white py-6 sm:py-12 px-4 sm:px-6 relative font-sans selection:bg-emerald-400 selection:text-slate-950 transition-colors duration-500">
      {/* Background Ambient Glowing Orbs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[850px] h-[400px] bg-gradient-to-b from-emerald-500/10 dark:from-emerald-500/15 via-teal-500/5 dark:via-teal-500/8 to-transparent rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-teal-500/5 dark:bg-teal-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Floating Top Nav Bar with Sticky Live Progress & Theme Switcher */}
      <div className="sticky top-4 z-40 max-w-3xl mx-auto mb-6 sm:mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/85 dark:bg-[#0b211a]/85 backdrop-blur-xl border border-slate-200/80 dark:border-emerald-500/25 rounded-2xl px-4 sm:px-6 py-3.5 shadow-xl shadow-slate-200/50 dark:shadow-emerald-950/60 flex items-center justify-between gap-4 transition-all"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-slate-950 flex items-center justify-center shrink-0 font-black shadow-md shadow-emerald-400/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block leading-none">
                SRE UPNVJT FORM
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate block mt-0.5 max-w-[140px] sm:max-w-xs md:max-w-md">
                {form.title}
              </span>
            </div>
          </div>

          {/* Right Controls: Theme Switcher & Progress Bar Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Interactive Theme Toggle Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={toggleTheme}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-sm"
              title={isDark ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
            >
              <AnimatePresence mode="wait" initial={false}>
                {isDark ? (
                  <motion.div
                    key="sun"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-amber-400"
                  >
                    <Sun className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden md:inline text-white/80 font-medium">Terang</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="moon"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-1.5 text-emerald-700"
                  >
                    <Moon className="w-4 h-4 stroke-[2.5]" />
                    <span className="hidden md:inline text-slate-700 font-medium">Gelap</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Live Progress Bar Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-emerald-100/60">
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">{answeredCount}</span>
              <span>/</span>
              <span>{totalValidQuestions.length}</span>
            </div>

            <div className="w-20 sm:w-28 h-2.5 bg-slate-200/80 dark:bg-black/40 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-emerald-500/20">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 dark:from-emerald-400 dark:via-teal-400 dark:to-yellow-300 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]"
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right min-w-[30px]">
              {progressPercentage}%
            </span>
          </div>
        </motion.div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-6 sm:space-y-8">
        {/* Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="relative bg-white/90 dark:bg-gradient-to-b dark:from-[#0e2c22] dark:to-[#0a2019] border border-slate-200/80 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-xl shadow-emerald-950/5 dark:shadow-emerald-950/40 overflow-hidden backdrop-blur-xl transition-all"
        >
          {/* Top Emerald Neon Accent Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 via-teal-400 to-yellow-300 absolute top-0 left-0" />

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4 sm:mb-5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <span>Official SRE Form</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Estimasi ~2 Menit</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/70 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Cloud Sync</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-slate-900 dark:text-white mb-3 leading-snug">
            {form.title}
          </h1>

          {form.description && (
            <div className="text-slate-600 dark:text-emerald-100/70 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-slate-200 dark:border-white/10 pt-4 mt-4">
              {form.description}
            </div>
          )}

          {/* Account Recording Banner (If collectUserData is true or user is logged in) */}
          {form.collectUserData && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
                    {user.image ? (
                      <img src={user.image} alt={user.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span>{user.name?.charAt(0).toUpperCase() || 'U'}</span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                        {user.name}
                      </span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                        ID: #{user.id}
                      </span>
                      {user.npm && (
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-white/80">
                          NPM: {user.npm}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-500 dark:text-emerald-200/60 block mt-0.5">
                      {user.email} &bull; <strong className="text-emerald-700 dark:text-emerald-400">Data akun otomatis direkam saat submit</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 w-full justify-between">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-white/70">
                    <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Formulir disetel merekam akun responden. Anda belum masuk.</span>
                  </div>
                  <Link
                    href={`/login?callbackUrl=/f/${form.uuid || form.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 transition-all shadow-sm"
                  >
                    <LogIn size={13} />
                    <span>Masuk Akun</span>
                  </Link>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* Page progress badge (if multi-page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-2 text-xs font-bold text-slate-500 dark:text-emerald-200/60">
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Bagian <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{currentPage + 1}</span> dari{' '}
                {totalPages}
              </span>
            </span>
            <span className="text-slate-400 dark:text-white/40">Lengkapi pertanyaan pada bagian ini</span>
          </div>
        )}

        {/* Global Error Banner */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-300 text-sm flex items-center gap-3 shadow-lg"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500 dark:text-red-400" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* QUESTIONS FORM */}
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 sm:space-y-8"
            >
              {activeQuestions.map((q, idx) => {
                const questionIndex =
                  form.questions.findIndex((orig) => orig.id === q.id) + 1;
                const hasError = Boolean(errors[q.id]);
                const value = answers[q.id];
                const isFocused = focusedQuestionId === q.id;
                const isAnswered =
                  value !== undefined &&
                  value !== null &&
                  (typeof value === 'string'
                    ? value.trim().length > 0
                    : Array.isArray(value)
                    ? value.length > 0
                    : true);

                return (
                  <motion.div
                    key={q.id || idx}
                    onFocus={() => setFocusedQuestionId(q.id)}
                    className={`relative bg-white dark:bg-[#0a1e17]/90 rounded-3xl p-6 sm:p-8 transition-all duration-300 backdrop-blur-xl border ${
                      hasError
                        ? 'border-red-500 shadow-xl shadow-red-500/15 has-error ring-2 ring-red-500/30'
                        : isFocused
                        ? 'border-emerald-500 dark:border-emerald-400 shadow-2xl shadow-emerald-500/15 ring-2 ring-emerald-500/25 scale-[1.003]'
                        : 'border-slate-200/90 dark:border-white/10 shadow-md hover:border-emerald-500/40 hover:shadow-lg dark:hover:bg-[#0c241c]/90'
                    }`}
                  >
                    {/* Top Status & Question Number */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-400/30 text-emerald-700 dark:text-emerald-400 font-mono font-extrabold text-xs shadow-inner">
                          {String(questionIndex).padStart(2, '0')}
                        </span>
                        {q.required ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 text-red-600 dark:text-red-400 font-bold text-[11px] uppercase tracking-wider">
                            Wajib
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/40 font-medium text-[10px]">
                            Opsional
                          </span>
                        )}
                      </div>

                      {isAnswered && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 dark:border-emerald-400/30 px-3 py-1 rounded-full shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                          <span>Terisi</span>
                        </motion.div>
                      )}
                    </div>

                    {/* Question Title */}
                    <h3 className="text-base sm:text-xl font-display font-bold text-slate-900 dark:text-white leading-snug mb-1.5">
                      {q.question || `Pertanyaan #${questionIndex}`}
                    </h3>

                    {q.description && (
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-100/60 mb-4 leading-relaxed">
                        {q.description}
                      </p>
                    )}

                    {/* INPUT TYPES */}
                    <div className="mt-5">
                      {/* 1. Jawaban Singkat (Text) */}
                      {q.type === 'text' && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ketik jawaban Anda di sini..."
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl px-4 py-3.5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition-all pr-10 shadow-inner"
                          />
                          {value && (
                            <button
                              type="button"
                              onClick={() => handleInputChange(q.id, '')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-white/40 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* 2. Paragraf */}
                      {q.type === 'paragraph' && (
                        <div className="relative">
                          <textarea
                            rows={4}
                            placeholder="Tuliskan penjelasan atau jawaban lengkap Anda di sini..."
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl p-4 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none transition-all resize-y shadow-inner"
                          />
                          <div className="text-right text-[11px] text-slate-400 dark:text-white/40 mt-1.5 font-mono">
                            {(value || '').length} karakter
                          </div>
                        </div>
                      )}

                      {/* 3. Pilihan Ganda (Radio) */}
                      {q.type === 'radio' && (
                        <div className="space-y-3">
                          {(q.options || []).map((opt, optIdx) => {
                            const isSelected = value === opt;
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.992 }}
                                onClick={() => handleInputChange(q.id, opt)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                                  isSelected
                                    ? 'bg-emerald-50/90 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/15 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                                    : 'bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/80'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-all ${
                                      isSelected
                                        ? 'bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950 font-black shadow-md'
                                        : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-white/70'
                                    }`}
                                  >
                                    {optionLetter}
                                  </span>
                                  <span className="text-sm sm:text-base font-semibold leading-snug">
                                    {opt || `Pilihan ${optIdx + 1}`}
                                  </span>
                                </div>

                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected
                                      ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950'
                                      : 'border-slate-300 dark:border-white/30 bg-transparent'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Kotak Centang (Checkbox) */}
                      {q.type === 'checkbox' && (
                        <div className="space-y-3">
                          {(q.options || []).map((opt, optIdx) => {
                            const checkedList = Array.isArray(value) ? value : [];
                            const isChecked = checkedList.includes(opt);

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.008 }}
                                whileTap={{ scale: 0.992 }}
                                onClick={() => handleCheckboxChange(q.id, opt, !isChecked)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 select-none ${
                                  isChecked
                                    ? 'bg-emerald-50/90 dark:bg-gradient-to-r dark:from-emerald-500/20 dark:to-teal-500/15 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-white shadow-md shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                                    : 'bg-slate-50/80 hover:bg-slate-100/90 dark:bg-white/[0.03] dark:hover:bg-white/[0.07] border-slate-200 dark:border-white/10 text-slate-800 dark:text-white/80'
                                }`}
                              >
                                <span className="text-sm sm:text-base font-semibold leading-snug">
                                  {opt || `Pilihan ${optIdx + 1}`}
                                </span>

                                <div
                                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isChecked
                                      ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950'
                                      : 'border-slate-300 dark:border-white/30 bg-transparent'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3.5]" />}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Dropdown */}
                      {q.type === 'dropdown' && (
                        <div className="relative">
                          <select
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0d2820] border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 rounded-2xl p-4 text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none transition-all appearance-none cursor-pointer pr-10 font-semibold shadow-inner"
                          >
                            <option value="" className="text-slate-400 dark:text-white/60">
                              -- Pilih salah satu opsi jawaban --
                            </option>
                            {(q.options || []).map((opt, optIdx) => (
                              <option key={optIdx} value={opt} className="text-slate-900 dark:text-white">
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}

                      {/* 6. Tanggal (Date) */}
                      {q.type === 'date' && (
                        <div className="relative">
                          <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl p-4 text-sm sm:text-base text-slate-900 dark:text-white focus:outline-none transition-all cursor-pointer font-medium shadow-inner"
                          />
                        </div>
                      )}

                      {/* 7. Angka (Number) */}
                      {q.type === 'number' && (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(value, 10) || 0;
                              handleInputChange(q.id, curr - 1);
                            }}
                            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors cursor-pointer"
                          >
                            <Minus size={18} />
                          </button>
                          <input
                            type="number"
                            placeholder="0"
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/15 focus:border-emerald-500 dark:focus:border-emerald-400 focus:bg-white dark:focus:bg-white/10 rounded-2xl p-3.5 text-center text-lg font-bold text-slate-900 dark:text-white focus:outline-none transition-all font-mono shadow-inner"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(value, 10) || 0;
                              handleInputChange(q.id, curr + 1);
                            }}
                            className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/15 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-700 dark:text-white transition-colors cursor-pointer"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      )}

                      {/* 8. Unggah Berkas / File (Google Drive Sync) */}
                      {q.type === 'file' && (
                        <div className="space-y-3">
                          {value ? (
                            <div className="p-4 rounded-2xl bg-emerald-50/90 dark:bg-emerald-500/15 border border-emerald-300 dark:border-emerald-400/30 flex items-center justify-between gap-3 shadow-md">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="p-3 bg-emerald-500 dark:bg-emerald-400 text-white dark:text-slate-950 rounded-xl shadow-md shrink-0 font-black">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 rounded-full mb-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Tersimpan di Google Drive</span>
                                  </div>
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-300 flex items-center gap-1.5 truncate group underline"
                                  >
                                    <span className="truncate">Lihat Berkas Terunggah</span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                                  </a>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(q.id)}
                                className="p-2.5 text-slate-400 hover:text-red-500 dark:text-white/50 dark:hover:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/15 rounded-xl transition-all shrink-0 cursor-pointer"
                                title="Hapus dan ganti berkas"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : uploadingFiles[q.id] ? (
                            <div className="border-2 border-dashed border-emerald-400/50 bg-emerald-50/50 dark:bg-emerald-500/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                              <div className="w-10 h-10 border-3 border-emerald-500 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
                              <div className="text-sm font-bold text-slate-900 dark:text-white">
                                Sedang Mengunggah ke Google Drive...
                              </div>
                              <p className="text-xs text-slate-500 dark:text-white/50">
                                Berkas otomatis tersimpan di folder aman formulir
                              </p>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-slate-300 hover:border-emerald-500 dark:border-white/20 dark:hover:border-emerald-400 rounded-2xl p-7 sm:p-8 text-center bg-slate-50/60 hover:bg-emerald-50/40 dark:bg-white/[0.02] dark:hover:bg-emerald-500/[0.05] transition-all cursor-pointer flex flex-col items-center justify-center group block">
                              <input
                                type="file"
                                accept={getFileAcceptAttribute(q.allowedTypes)}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileUpload(q, f);
                                }}
                              />
                              <div className="w-14 h-14 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 group-hover:border-emerald-500/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3.5 transition-all group-hover:scale-110 shadow-sm">
                                <UploadCloud className="w-7 h-7" />
                              </div>
                              <p className="text-sm sm:text-base font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-300 transition-colors">
                                Klik untuk unggah berkas atau seret ke sini
                              </p>
                              
                              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                                  Maksimal: {q.maxSizeMb || 10} MB
                                </span>
                                <span className="text-slate-400 dark:text-white/30">&bull;</span>
                                <span className="text-slate-500 dark:text-white/60 font-medium">
                                  {getAllowedTypesLabel(q.allowedTypes)}
                                </span>
                              </div>
                            </label>
                          )}

                          {uploadErrors[q.id] && (
                            <p className="text-red-500 dark:text-red-400 text-xs font-semibold flex items-center gap-1.5 mt-2 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 p-2.5 rounded-xl">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                              <span>{uploadErrors[q.id]}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {hasError && (
                      <p className="text-red-500 dark:text-red-400 text-xs sm:text-sm font-semibold mt-3 flex items-center gap-1.5 bg-red-500/10 dark:bg-red-500/15 border border-red-500/25 dark:border-red-500/30 p-2.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-500 dark:text-red-400" />
                        <span>{errors[q.id]}</span>
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Action Buttons Bar */}
          <div className="flex items-center justify-between pt-4 gap-4">
            {currentPage > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-800 dark:text-white font-bold text-sm transition-all shadow-sm cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                Kembali
              </button>
            ) : (
              <div />
            )}

            {!isLastPage ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm hover:scale-105 transition-all shadow-lg shadow-emerald-500/25 ml-auto cursor-pointer"
              >
                <span>Halaman Berikutnya</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 dark:from-emerald-400 dark:via-teal-400 dark:to-yellow-300 hover:scale-105 text-slate-950 font-black text-sm sm:text-base transition-all shadow-xl shadow-emerald-500/25 dark:shadow-emerald-400/30 disabled:opacity-50 disabled:pointer-events-none ml-auto cursor-pointer"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Merekam ke Spreadsheet...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 stroke-[2.5]" />
                    <span>Kirim Formulir Sekarang</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="text-center py-8 text-xs text-slate-500 dark:text-white/40 space-y-1 border-t border-slate-200 dark:border-white/10 mt-10">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">
            Society of Renewable Energy &bull; UPN Veteran Jawa Timur
          </p>
          <p className="text-[11px] text-slate-400 dark:text-white/30">
            Jawaban Anda otomatis disinkronkan secara aman dan terenkripsi ke Google Spreadsheet.
          </p>
        </div>
      </div>
    </div>
  );
}
