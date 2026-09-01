'use client';

import React, { useState, useMemo } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import {
  getFileAcceptAttribute,
  getAllowedTypesLabel,
  validateFileRules,
} from '@/lib/fileValidation';

export default function PublicFormClient({ form, user }) {
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
    const text = `Bukti Pengisian Formulir SRE UPNVJT\nJudul: ${form.title}\nID Submisi: ${submissionId || 'Terekam'}\nWaktu: ${new Date().toLocaleString('id-ID')}\nStatus: Berhasil Terkirim ke Google Spreadsheet`;
    navigator.clipboard.writeText(text);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2500);
  };

  // Jika form tidak dipublikasikan (Draft / Tutup)
  if (!form.isPublished) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white border border-gray-200 rounded-3xl p-8 sm:p-10 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-200 shadow-sm">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-display font-black mb-3 text-gray-900">
            Formulir Ditutup Sementara
          </h2>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8">
            Formulir <strong className="text-gray-900">&ldquo;{form.title}&rdquo;</strong> saat ini berstatus draf atau tidak menerima tanggapan baru. Silakan hubungi admin pengelola kegiatan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-2xl font-bold text-sm hover:scale-105 transition-all shadow-md shadow-emerald-600/20"
          >
            Kembali ke Beranda SRE
          </Link>
        </div>
      </div>
    );
  }

  // TAMPILAN SUKSES SETELAH PENGISIAN (CELEBRATION SCREEN - LIGHT THEME)
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] text-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
        {/* Soft Decorative Ambient Background */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/60 rounded-full blur-[140px] pointer-events-none" />
        <div className="fixed bottom-10 right-10 w-80 h-80 bg-teal-100/60 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="max-w-xl w-full bg-white border border-gray-200/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-emerald-950/5 relative overflow-hidden"
        >
          {/* Top Emerald Line */}
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 absolute top-0 left-0" />

          {/* Success Icon */}
          <div className="relative mx-auto w-20 h-20 mb-6 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <CheckCircle2 className="w-10 h-10" />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Respon Berhasil Dicatat</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-black text-gray-900 mb-3">
              Terima Kasih!
            </h2>

            <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {successMessage}
            </p>
          </div>

          {/* Digital Receipt Card */}
          <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-5 mb-8 space-y-3 text-xs sm:text-sm">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
              <span className="text-gray-500 font-medium">Formulir</span>
              <span className="font-bold text-gray-900 text-right max-w-[220px] truncate">
                {form.title}
              </span>
            </div>
            {submissionId && (
              <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
                <span className="text-gray-500 font-medium">ID Submisi</span>
                <span className="font-mono font-bold text-emerald-600">{submissionId}</span>
              </div>
            )}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/80">
              <span className="text-gray-500 font-medium">Waktu Kirim</span>
              <span className="text-gray-800 font-semibold">
                {new Date(submittedAt || Date.now()).toLocaleString('id-ID', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium">Sinkronisasi</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold text-xs bg-emerald-100/80 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Google Sheets & Drive
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={handleCopyReceipt}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 font-bold text-xs sm:text-sm text-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              {copiedReceipt ? (
                <>
                  <Check size={16} className="text-emerald-600" />
                  <span className="text-emerald-600">Tersalin!</span>
                </>
              ) : (
                <>
                  <FileCheck size={16} />
                  <span>Salin Bukti Kirim</span>
                </>
              )}
            </button>

            <button
              onClick={handleReset}
              className="w-full sm:w-1/2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw size={16} />
              <span>Kirim Tanggapan Lain</span>
            </button>
          </div>

          <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>SRE UPN Veteran Jawa Timur</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // TAMPILAN UTAMA FORM FILLING (LIGHT THEME - CLEAN & HIGH CONTRAST)
  return (
    <div className="min-h-screen bg-[#f4f7f5] text-gray-900 py-6 sm:py-10 px-4 sm:px-6 relative font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Background Soft Gradients */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-100/50 via-teal-50/30 to-transparent rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Top Nav Header */}
      <div className="sticky top-4 z-40 max-w-3xl mx-auto mb-6">
        <div className="bg-white/90 backdrop-blur-xl border border-gray-200/90 rounded-2xl px-5 py-3.5 shadow-lg shadow-gray-900/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 block leading-none">
                SRE UPNVJT Form
              </span>
              <span className="text-xs sm:text-sm font-bold text-gray-900 truncate block mt-0.5 max-w-[180px] sm:max-w-md">
                {form.title}
              </span>
            </div>
          </div>

          {/* Live Progress Indicator */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-gray-500">
              <span className="text-emerald-700 font-extrabold text-sm">{answeredCount}</span>
              <span>/</span>
              <span>{totalValidQuestions.length} Terisi</span>
            </div>

            <div className="w-24 sm:w-28 h-2.5 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 text-right min-w-[32px]">
              {progressPercentage}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto relative z-10 space-y-6">
        {/* Hero Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative bg-white border border-gray-200 rounded-3xl p-7 sm:p-10 shadow-xl shadow-gray-200/50 overflow-hidden"
        >
          {/* Top Emerald Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400 absolute top-0 left-0" />

          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2.5 mb-4">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Official SRE Form</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Estimasi ~2 Menit</span>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gray-100 border border-gray-200 text-gray-600 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Cloud Sync</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-4xl font-display font-black tracking-tight text-gray-900 mb-3 leading-snug">
            {form.title}
          </h1>

          {form.description && (
            <div className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line border-t border-gray-100 pt-4 mt-3">
              {form.description}
            </div>
          )}
        </motion.div>

        {/* Page progress pill (if multi-page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-3 text-xs font-bold text-gray-500">
            <span>
              Bagian <span className="text-emerald-600 font-extrabold">{currentPage + 1}</span> dari{' '}
              {totalPages}
            </span>
            <span>Lengkapi pertanyaan di bawah untuk lanjut</span>
          </div>
        )}

        {/* Global Error Banner */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* QUESTIONS FORM */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
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
                    className={`relative bg-white rounded-3xl p-6 sm:p-8 transition-all duration-200 ${
                      hasError
                        ? 'border-2 border-red-500 shadow-lg shadow-red-500/10 has-error ring-4 ring-red-500/10'
                        : isFocused
                        ? 'border-2 border-emerald-500 shadow-xl shadow-emerald-950/5 ring-4 ring-emerald-500/10'
                        : 'border border-gray-200/90 shadow-sm hover:border-gray-300'
                    }`}
                  >
                    {/* Top Status & Question Number */}
                    <div className="flex items-center justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono font-extrabold text-xs">
                          {String(questionIndex).padStart(2, '0')}
                        </span>
                        {q.required && (
                          <span className="px-2.5 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-600 font-bold text-[11px] uppercase tracking-wider">
                            Wajib
                          </span>
                        )}
                      </div>

                      {isAnswered && (
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Terjawab</span>
                        </div>
                      )}
                    </div>

                    {/* Question Title */}
                    <h3 className="text-lg sm:text-xl font-display font-bold text-gray-900 leading-snug mb-1.5">
                      {q.question || `Pertanyaan #${questionIndex}`}
                    </h3>

                    {q.description && (
                      <p className="text-xs sm:text-sm text-gray-500 mb-4 leading-relaxed">
                        {q.description}
                      </p>
                    )}

                    {/* INPUT TYPES */}
                    <div className="mt-4">
                      {/* 1. Jawaban Singkat (Text) */}
                      {q.type === 'text' && (
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ketik jawaban Anda di sini..."
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl px-4 py-3.5 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all pr-10"
                          />
                          {value && (
                            <button
                              type="button"
                              onClick={() => handleInputChange(q.id, '')}
                              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
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
                            placeholder="Tuliskan jawaban lengkap Anda di sini..."
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none transition-all resize-y"
                          />
                          <div className="text-right text-[11px] text-gray-400 mt-1 font-mono">
                            {(value || '').length} karakter
                          </div>
                        </div>
                      )}

                      {/* 3. Pilihan Ganda (Radio) */}
                      {q.type === 'radio' && (
                        <div className="space-y-2.5">
                          {(q.options || []).map((opt, optIdx) => {
                            const isSelected = value === opt;
                            const optionLetter = String.fromCharCode(65 + optIdx);

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.995 }}
                                onClick={() => handleInputChange(q.id, opt)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm shadow-emerald-500/10'
                                    : 'bg-gray-50/70 hover:bg-gray-100/90 border-gray-200 text-gray-800'
                                }`}
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <span
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs font-mono shrink-0 transition-all ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-white border border-gray-200 text-gray-600'
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
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      )}

                      {/* 4. Kotak Centang (Checkbox) */}
                      {q.type === 'checkbox' && (
                        <div className="space-y-2.5">
                          {(q.options || []).map((opt, optIdx) => {
                            const checkedList = Array.isArray(value) ? value : [];
                            const isChecked = checkedList.includes(opt);

                            return (
                              <motion.div
                                key={optIdx}
                                whileHover={{ scale: 1.005 }}
                                whileTap={{ scale: 0.995 }}
                                onClick={() => handleCheckboxChange(q.id, opt, !isChecked)}
                                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                                  isChecked
                                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm shadow-emerald-500/10'
                                    : 'bg-gray-50/70 hover:bg-gray-100/90 border-gray-200 text-gray-800'
                                }`}
                              >
                                <span className="text-sm sm:text-base font-semibold leading-snug">
                                  {opt || `Pilihan ${optIdx + 1}`}
                                </span>

                                <div
                                  className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isChecked
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-gray-300 bg-white'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
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
                            className="w-full bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-4 text-sm sm:text-base text-gray-900 focus:outline-none transition-all appearance-none cursor-pointer pr-10 font-semibold"
                          >
                            <option value="">-- Pilih salah satu opsi jawaban --</option>
                            {(q.options || []).map((opt, optIdx) => (
                              <option key={optIdx} value={opt} className="bg-white text-gray-900">
                                {opt}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      )}

                      {/* 6. Tanggal (Date) */}
                      {q.type === 'date' && (
                        <div className="relative">
                          <input
                            type="date"
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="w-full bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-3.5 text-sm sm:text-base text-gray-900 focus:outline-none transition-all cursor-pointer font-medium"
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
                            className="p-3.5 rounded-2xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            <Minus size={18} />
                          </button>
                          <input
                            type="number"
                            placeholder="0"
                            value={value || ''}
                            onChange={(e) => handleInputChange(q.id, e.target.value)}
                            className="flex-1 bg-gray-50/80 border border-gray-200 focus:border-emerald-500 focus:bg-white rounded-2xl p-3.5 text-center text-lg font-bold text-gray-900 focus:outline-none transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const curr = parseInt(value, 10) || 0;
                              handleInputChange(q.id, curr + 1);
                            }}
                            className="p-3.5 rounded-2xl bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      )}

                      {/* 8. Unggah Berkas / File (Google Drive Sync) */}
                      {q.type === 'file' && (
                        <div className="space-y-3">
                          {value ? (
                            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 shadow-sm">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full mb-1">
                                    <ShieldCheck className="w-3 h-3" />
                                    <span>Tersimpan di Google Drive</span>
                                  </div>
                                  <a
                                    href={value}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs sm:text-sm font-bold text-gray-900 hover:text-emerald-600 flex items-center gap-1.5 truncate group underline"
                                  >
                                    <span className="truncate">Lihat Berkas yang Diunggah</span>
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                                  </a>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(q.id)}
                                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all shrink-0"
                                title="Hapus dan ganti berkas"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ) : uploadingFiles[q.id] ? (
                            <div className="border-2 border-dashed border-emerald-400 bg-emerald-50/50 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-3">
                              <div className="w-10 h-10 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              <div className="text-sm font-bold text-gray-900">
                                Sedang Mengunggah ke Google Drive...
                              </div>
                              <p className="text-xs text-gray-500">
                                Berkas otomatis tersimpan di folder aman formulir
                              </p>
                            </div>
                          ) : (
                            <label className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-7 sm:p-8 text-center bg-gray-50/60 hover:bg-emerald-50/30 transition-all cursor-pointer flex flex-col items-center justify-center group block">
                              <input
                                type="file"
                                accept={getFileAcceptAttribute(q.allowedTypes)}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleFileUpload(q, f);
                                }}
                              />
                              <div className="w-14 h-14 bg-white border border-gray-200 group-hover:border-emerald-300 text-gray-500 group-hover:text-emerald-600 rounded-2xl flex items-center justify-center mb-3.5 transition-all group-hover:scale-110 shadow-sm">
                                <UploadCloud className="w-7 h-7" />
                              </div>
                              <p className="text-sm sm:text-base font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">
                                Klik untuk unggah berkas atau seret ke sini
                              </p>
                              
                              <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs">
                                <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                                  Maksimal: {q.maxSizeMb || 10} MB
                                </span>
                                <span className="text-gray-400">&bull;</span>
                                <span className="text-gray-500 font-medium">
                                  {getAllowedTypesLabel(q.allowedTypes)}
                                </span>
                              </div>
                            </label>
                          )}

                          {uploadErrors[q.id] && (
                            <p className="text-red-600 text-xs font-semibold flex items-center gap-1.5 mt-2 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                              <span>{uploadErrors[q.id]}</span>
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {hasError && (
                      <p className="text-red-600 text-xs sm:text-sm font-semibold mt-3 flex items-center gap-1.5 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
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
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all shadow-sm"
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
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm hover:scale-105 transition-all shadow-md shadow-emerald-600/25 ml-auto"
              >
                <span>Halaman Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm sm:text-base hover:scale-105 transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50 disabled:pointer-events-none ml-auto"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
        <div className="text-center py-8 text-xs text-gray-400 space-y-1 border-t border-gray-200/80 mt-8">
          <p className="font-semibold text-gray-500">
            SRE UPN Veteran Jawa Timur &bull; Official Form Engine
          </p>
          <p className="text-[11px] text-gray-400">
            Jawaban Anda otomatis disinkronkan secara aman dan terenkripsi.
          </p>
        </div>
      </div>
    </div>
  );
}
