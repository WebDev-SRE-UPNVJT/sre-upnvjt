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
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import Link from 'next/link';

export default function PublicFormClient({ form, user }) {
  const [answers, setAnswers] = useState({});
  const [errors, setErrors] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState(
    form?.successMessage || 'Tanggapan Anda telah berhasil direkam.'
  );

  // Group questions into pages using 'page_break'
  const pages = useMemo(() => {
    const rawQuestions = form?.questions || [];
    const groupedPages = [[]];

    rawQuestions.forEach((q) => {
      if (q.type === 'page_break') {
        // Halaman baru jika ada soal di halaman saat ini
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

  const handleInputChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Hapus error jika sudah diisi
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

  const validateCurrentPage = () => {
    const newErrors = {};

    activeQuestions.forEach((q) => {
      if (q.required) {
        const ans = answers[q.id];
        if (
          ans === undefined ||
          ans === null ||
          (typeof ans === 'string' && ans.trim() === '') ||
          (Array.isArray(ans) && ans.length === 0)
        ) {
          newErrors[q.id] = 'Pertanyaan ini wajib diisi';
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
      // Format answers payload secara lengkap berdasarkan seluruh pertanyaan form
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

      const res = await fetch(`/api/forms/${form.id}/submit`, {
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
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Jika form tidak dipublikasikan (Draft / Tutup)
  if (!form.isPublished) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#040a07] text-gray-900 dark:text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-[#07130e] border border-gray-200 dark:border-white/10 rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-500/20">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Formulir Tidak Menerima Tanggapan</h2>
          <p className="text-gray-500 dark:text-white/60 text-sm mb-6">
            Formulir <strong>&ldquo;{form.title}&rdquo;</strong> saat ini telah ditutup atau sedang dalam mode draf. Silakan hubungi pengelola kegiatan.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-primary text-[#050e0a] px-6 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-all shadow-md"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    );
  }

  // Tampilan Sukses Pengiriman
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50/80 dark:bg-[#030906] text-gray-900 dark:text-white flex items-center justify-center p-4 selection:bg-primary/30">
        {/* Background Ambience */}
        <div className="fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full bg-white dark:bg-[#07140f] border border-gray-200 dark:border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden"
        >
          <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-primary to-teal-400 absolute top-0 left-0" />

          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-display font-black mb-3 text-gray-900 dark:text-white">
            Terima Kasih!
          </h2>

          <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base leading-relaxed mb-8 whitespace-pre-line">
            {successMessage}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleReset}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 font-bold text-sm text-gray-700 dark:text-white/80 transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Kirim Tanggapan Lain
            </button>

            <Link
              href="/"
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-primary text-[#050e0a] font-bold text-sm hover:brightness-110 shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
            >
              Kembali ke Beranda
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-white/40">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>SRE UPN Veteran Jawa Timur</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/80 dark:bg-[#030906] text-gray-900 dark:text-white selection:bg-primary/30 py-8 px-4 sm:px-6">
      {/* Background Ambience */}
      <div className="fixed top-[-15%] left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-15%] right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-2xl mx-auto relative z-10 space-y-6">
        {/* Form Header Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#07140f] border border-gray-200 dark:border-white/10 rounded-3xl overflow-hidden shadow-sm relative"
        >
          {/* Header Accent Bar */}
          <div className="h-3 bg-gradient-to-r from-emerald-500 via-primary to-teal-400" />

          <div className="p-6 sm:p-8">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary mb-3">
              <Sparkles className="w-4 h-4" />
              <span>SRE UPN Veteran Jawa Timur</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-display font-black tracking-tight mb-3 text-gray-900 dark:text-white">
              {form.title}
            </h1>

            {form.description && (
              <p className="text-gray-600 dark:text-white/70 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                {form.description}
              </p>
            )}
          </div>
        </motion.div>

        {/* Progress Bar (jika multi-page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 dark:text-white/50 px-2">
            <span>Halaman {currentPage + 1} dari {totalPages}</span>
            <div className="w-36 h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-center gap-3"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{submitError}</span>
          </motion.div>
        )}

        {/* Questions List */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {activeQuestions.map((q, idx) => {
                const questionNumber = form.questions.findIndex((orig) => orig.id === q.id) + 1;
                const hasError = Boolean(errors[q.id]);
                const value = answers[q.id];

                return (
                  <div
                    key={q.id || idx}
                    className={`bg-white dark:bg-[#07140f] border ${
                      hasError
                        ? 'border-red-300 dark:border-red-500/40 has-error'
                        : 'border-gray-200 dark:border-white/10'
                    } rounded-3xl p-6 sm:p-7 shadow-sm transition-all`}
                  >
                    {/* Question Header */}
                    <div className="mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white leading-snug">
                        {q.question || `Pertanyaan ${questionNumber}`}
                        {q.required && <span className="text-red-500 ml-1.5">*</span>}
                      </h3>
                      {q.description && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-white/50 mt-1">
                          {q.description}
                        </p>
                      )}
                    </div>

                    {/* Question Inputs */}
                    <div className="mt-3">
                      {/* 1. Jawaban Singkat (Text) */}
                      {q.type === 'text' && (
                        <input
                          type="text"
                          placeholder="Jawaban Anda"
                          value={value || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/[0.03] border-b-2 border-gray-200 dark:border-white/10 focus:border-primary dark:focus:border-emerald-400 px-4 py-3 text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none transition-all rounded-t-xl"
                        />
                      )}

                      {/* 2. Paragraf */}
                      {q.type === 'paragraph' && (
                        <textarea
                          rows={4}
                          placeholder="Jawaban Anda"
                          value={value || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 focus:border-primary dark:focus:border-emerald-400 p-4 text-sm sm:text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none transition-all rounded-2xl resize-y"
                        />
                      )}

                      {/* 3. Pilihan Ganda (Radio) */}
                      {q.type === 'radio' && (
                        <div className="space-y-2.5">
                          {(q.options || []).map((opt, optIdx) => {
                            const isSelected = value === opt;
                            return (
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-primary/10 border-primary/40 text-gray-900 dark:text-white'
                                    : 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${q.id}`}
                                  value={opt}
                                  checked={isSelected}
                                  onChange={() => handleInputChange(q.id, opt)}
                                  className="w-4 h-4 text-primary accent-primary focus:ring-primary"
                                />
                                <span className="text-sm sm:text-base font-medium">{opt}</span>
                              </label>
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
                              <label
                                key={optIdx}
                                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                  isChecked
                                    ? 'bg-primary/10 border-primary/40 text-gray-900 dark:text-white'
                                    : 'bg-gray-50/50 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/5 text-gray-700 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/[0.04]'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) =>
                                    handleCheckboxChange(q.id, opt, e.target.checked)
                                  }
                                  className="w-4 h-4 rounded text-primary accent-primary focus:ring-primary"
                                />
                                <span className="text-sm sm:text-base font-medium">{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      )}

                      {/* 5. Dropdown */}
                      {q.type === 'dropdown' && (
                        <select
                          value={value || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                        >
                          <option value="">-- Pilih Jawaban --</option>
                          {(q.options || []).map((opt, optIdx) => (
                            <option key={optIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}

                      {/* 6. Tanggal (Date) */}
                      {q.type === 'date' && (
                        <input
                          type="date"
                          value={value || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                        />
                      )}

                      {/* 7. Angka (Number) */}
                      {q.type === 'number' && (
                        <input
                          type="number"
                          placeholder="Masukkan angka"
                          value={value || ''}
                          onChange={(e) => handleInputChange(q.id, e.target.value)}
                          className="w-full bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl p-3.5 text-sm sm:text-base text-gray-900 dark:text-white focus:outline-none focus:border-primary transition-all"
                        />
                      )}
                    </div>

                    {/* Error message */}
                    {hasError && (
                      <p className="text-red-500 text-xs sm:text-sm font-semibold mt-2.5 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4" />
                        {errors[q.id]}
                      </p>
                    )}
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Form Actions (Pagination & Submit) */}
          <div className="flex items-center justify-between pt-2 gap-4">
            {currentPage > 0 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
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
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-[#050e0a] font-bold text-sm hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)]"
              >
                Berikutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-[#050e0a] font-bold text-sm hover:bg-emerald-400 hover:scale-105 transition-all shadow-[0_0_25px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:pointer-events-none"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#050e0a] border-t-transparent rounded-full animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Kirim Tanggapan</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>

        {/* Footer info */}
        <div className="text-center py-6 text-xs text-gray-400 dark:text-white/40 space-y-1">
          <p>Formulir dibuat dengan SRE UPN Veteran Jawa Timur Form Engine</p>
          <p className="text-[11px] opacity-70">Data respon otomatis disinkronkan secara aman</p>
        </div>
      </div>
    </div>
  );
}
