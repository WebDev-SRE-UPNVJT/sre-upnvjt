'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Trash2,
  GripVertical,
  Save,
  ArrowLeft,
  Eye,
  Edit3,
  ClipboardCheck,
  ChevronDown,
  SplitSquareVertical,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const CustomSelect = ({ options, value, onChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative z-20 min-w-[200px]" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-white dark:bg-white/5 border ${
          isOpen
            ? 'border-primary/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
            : 'border-gray-200 dark:border-white/10'
        } rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-300 font-medium`}
      >
        <span className={selectedOption ? 'text-gray-900 dark:text-white text-sm' : 'text-gray-400 dark:text-white/40 text-sm'}>
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
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#0a1f18] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-2xl z-30"
          >
            <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 scrollbar-track-transparent">
              {options.map((option) => (
                <div 
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`px-4 py-2.5 rounded-lg text-xs sm:text-sm cursor-pointer transition-all flex items-center justify-between ${
                    value === option.value
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-gray-600 dark:text-white/80 hover:bg-gray-50 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {option.label}
                  {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(16,185,129,0.8)]" />}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function CreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [createSpreadsheet, setCreateSpreadsheet] = useState(true);
  const [successMessage, setSuccessMessage] = useState('Tanggapan Anda telah berhasil direkam.');
  const [questions, setQuestions] = useState([
    { id: Date.now().toString(), type: 'text', question: '', options: [''], required: false, points: 0 }
  ]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPage, setPreviewPage] = useState(0);

  // Drag and Drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState(null);

  const typeOptions = [
    { value: 'text', label: 'Jawaban Singkat' },
    { value: 'paragraph', label: 'Paragraf' },
    { value: 'radio', label: 'Pilihan Ganda' },
    { value: 'checkbox', label: 'Kotak Centang' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'date', label: 'Tanggal' },
    { value: 'number', label: 'Angka' },
    { value: 'page_break', label: 'Pembatas Halaman (Page Break)' },
  ];

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), type: 'text', question: '', options: [''], required: false, points: 0 }
    ]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map((q) => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const addOption = (questionId) => {
    setQuestions(questions.map((q) => 
      q.id === questionId ? { ...q, options: [...q.options, ''] } : q
    ));
  };

  const updateOption = (questionId, index, value) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId) {
        const newOptions = [...q.options];
        newOptions[index] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId, index) => {
    setQuestions(questions.map((q) => {
      if (q.id === questionId) {
        return { ...q, options: q.options.filter((_, i) => i !== index) };
      }
      return q;
    }));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Judul form wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions,
          isPublished,
          createSpreadsheet,
          successMessage,
        }),
      });

      if (res.ok) {
        router.push('/forms');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Gagal menyimpan form: ${err.error || 'Terjadi kesalahan'}`);
      }
    } catch (error) {
      console.error('Save error', error);
      alert('Terjadi kesalahan saat menyimpan form');
    } finally {
      setSaving(false);
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && draggedOverIndex !== null && draggedIndex !== draggedOverIndex) {
      const newQuestions = [...questions];
      const draggedItem = newQuestions[draggedIndex];
      newQuestions.splice(draggedIndex, 1);
      newQuestions.splice(draggedOverIndex, 0, draggedItem);
      setQuestions(newQuestions);
    }
    setDraggedIndex(null);
    setDraggedOverIndex(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Pagination Logic for Preview
  const pages = [];
  let currentPage = [];
  questions.forEach((q) => {
    if (q.type === 'page_break') {
      if (currentPage.length > 0) pages.push(currentPage);
      currentPage = [];
    } else {
      currentPage.push(q);
    }
  });
  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return (
    <div className="p-6 w-full pb-24 text-gray-900 dark:text-white">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div className="flex items-center gap-4">
          <Link href="/forms" className="p-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shadow-sm self-start mt-1">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
              <ClipboardCheck className="w-8 h-8 text-primary" />
              {showPreview ? 'Preview Form' : 'Buat Form Baru'}
            </h1>
            <p className="text-gray-500 dark:text-white/50 text-sm max-w-xl">
              Susun pertanyaan formulir interaktif dan hubungkan ke Google Spreadsheet.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              setShowPreview(!showPreview);
              setPreviewPage(0);
            }}
            className="flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm"
          >
            {showPreview ? <><Edit3 size={16} /> Kembali Edit</> : <><Eye size={16} /> Preview Form</>}
          </button>
          {!showPreview && (
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-emerald-400 text-[#050e0a] px-6 py-2.5 rounded-xl font-bold transition disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-sm"
            >
              <Save size={16} />
              {saving ? 'Menyimpan & Menghubungkan...' : 'Simpan & Publikasikan'}
            </button>
          )}
        </div>
      </div>

      {showPreview ? (
        // PREVIEW MODE
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white dark:bg-[#07140f] border border-gray-200 dark:border-white/10 rounded-3xl p-8 shadow-sm">
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-primary to-teal-400 -mt-8 -mx-8 mb-6 rounded-t-3xl" />
            <h1 className="text-3xl font-black font-display mb-3 text-gray-900 dark:text-white">{title || 'Judul Formulir'}</h1>
            <p className="text-gray-600 dark:text-white/70 text-sm whitespace-pre-wrap">{description || 'Tidak ada deskripsi'}</p>
          </div>

          <div className="space-y-4">
            {pages[previewPage]?.map((q, idx) => (
              <div key={q.id || idx} className="bg-white dark:bg-[#07140f] border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm">
                <h3 className="font-bold text-base mb-3 text-gray-900 dark:text-white">
                  {q.question || 'Pertanyaan Baru'}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </h3>

                {q.type === 'text' && (
                  <input type="text" disabled placeholder="Jawaban singkat..." className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm" />
                )}
                {q.type === 'paragraph' && (
                  <textarea disabled rows={3} placeholder="Jawaban paragraf..." className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm resize-none" />
                )}
                {q.type === 'radio' && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-sm">
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-white/30" />
                        <span>{opt || `Pilihan ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'checkbox' && (
                  <div className="space-y-2">
                    {(q.options || []).map((opt, i) => (
                      <div key={i} className="flex items-center gap-2 p-3 rounded-xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] text-sm">
                        <div className="w-4 h-4 rounded-md border-2 border-gray-300 dark:border-white/30" />
                        <span>{opt || `Pilihan ${i + 1}`}</span>
                      </div>
                    ))}
                  </div>
                )}
                {q.type === 'dropdown' && (
                  <select disabled className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm">
                    <option>-- Pilih Jawaban --</option>
                  </select>
                )}
                {q.type === 'date' && (
                  <input type="date" disabled className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm" />
                )}
                {q.type === 'number' && (
                  <input type="number" disabled placeholder="Angka..." className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm" />
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-4">
            {previewPage > 0 ? (
              <button onClick={() => setPreviewPage(previewPage - 1)} className="px-6 py-2.5 bg-white dark:bg-white/5 rounded-xl border font-bold text-sm">
                Kembali
              </button>
            ) : <div />}
            {previewPage < pages.length - 1 ? (
              <button onClick={() => setPreviewPage(previewPage + 1)} className="px-6 py-2.5 bg-primary text-[#050e0a] rounded-xl font-bold text-sm">
                Berikutnya
              </button>
            ) : (
              <button disabled className="px-6 py-2.5 bg-primary text-[#050e0a] rounded-xl font-bold text-sm opacity-60">
                Kirim (Simulasi)
              </button>
            )}
          </div>
        </div>
      ) : (
        // EDIT MODE
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Card */}
          <div className="bg-white/80 dark:bg-[#07140f] backdrop-blur-2xl border border-gray-200 dark:border-white/10 rounded-3xl p-8 border-t-8 border-t-primary shadow-sm space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
                Judul Formulir *
              </label>
              <input 
                type="text" 
                placeholder="Contoh: Form Pendaftaran Kegiatan Renewable Energy Bootcamp" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent border-b-2 border-gray-200 dark:border-white/10 text-2xl sm:text-3xl font-black font-display text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 pb-2 focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1.5">
                Deskripsi Formulir (Opsional)
              </label>
              <textarea 
                placeholder="Tuliskan petunjuk pengisian atau informasi singkat mengenai formulir ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-gray-200 dark:border-white/10 text-sm text-gray-600 dark:text-white/70 placeholder-gray-400 dark:placeholder-white/30 pb-2 focus:outline-none focus:border-primary transition-colors resize-none"
                rows={2}
              />
            </div>

            {/* Integrations & Settings Row */}
            <div className="pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Sheets Sync Toggle */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-500/10 border border-emerald-200/80 dark:border-emerald-500/20 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createSpreadsheet}
                  onChange={(e) => setCreateSpreadsheet(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-emerald-600 accent-emerald-500 rounded focus:ring-emerald-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Otomatis Buat Google Spreadsheet
                  </span>
                  <p className="text-gray-500 dark:text-white/50 mt-0.5">
                    Setiap jawaban akan langsung tercatat secara realtime di Google Sheets Anda.
                  </p>
                </div>
              </label>

              {/* Publish Toggle */}
              <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-primary accent-primary rounded focus:ring-primary"
                />
                <div className="text-xs">
                  <span className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    Publikasikan Formulir
                  </span>
                  <p className="text-gray-500 dark:text-white/50 mt-0.5">
                    Formulir dapat diakses dan diisi langsung melalui tautan publik.
                  </p>
                </div>
              </label>
            </div>

            {/* Success Message Setting */}
            <div className="pt-2">
              <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 dark:text-white/40 mb-1">
                Pesan Sukses Setelah Pengisian
              </label>
              <input
                type="text"
                value={successMessage}
                onChange={(e) => setSuccessMessage(e.target.value)}
                placeholder="Tanggapan Anda telah berhasil direkam."
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Question Items */}
          <div className="space-y-4">
            {questions.map((q, index) => {
              const isDragging = draggedIndex === index;
              const isDraggedOver = draggedOverIndex === index;

              if (q.type === 'page_break') {
                return (
                  <div 
                    key={q.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleDragOver}
                    className={`relative py-4 flex items-center group cursor-grab active:cursor-grabbing transition-all ${
                      isDragging ? 'opacity-50' : 'opacity-100'
                    } ${isDraggedOver ? 'pt-12' : ''}`}
                  >
                    {isDraggedOver && <div className="absolute top-0 left-0 w-full h-1 bg-primary rounded-full" />}
                    <div className="absolute left-0 -ml-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                      <div className="p-2 text-gray-400 bg-gray-100 dark:bg-white/10 rounded-lg cursor-grab">
                        <GripVertical size={16} />
                      </div>
                      <button 
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Hapus Pembatas"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex-1 border-b-2 border-dashed border-gray-300 dark:border-white/20" />
                    <div className="px-4 text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-white/40 flex items-center gap-2">
                      <SplitSquareVertical size={14} />
                      Pembatas Halaman
                    </div>
                    <div className="flex-1 border-b-2 border-dashed border-gray-300 dark:border-white/20" />
                  </div>
                );
              }

              return (
                <div 
                  key={q.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  className={`bg-white dark:bg-[#07140f] border ${
                    isDraggedOver ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-white/10'
                  } rounded-3xl p-6 sm:p-7 relative group transition-all shadow-sm`}
                >
                  {/* Drag Handle & Delete */}
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                        <GripVertical size={18} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-white/40">
                        Pertanyaan #{index + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <CustomSelect 
                        options={typeOptions}
                        value={q.type}
                        onChange={(val) => updateQuestion(q.id, 'type', val)}
                        placeholder="Pilih Tipe"
                      />
                      <button 
                        onClick={() => removeQuestion(q.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                        title="Hapus Pertanyaan"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Question Title Input */}
                  <div className="mb-4">
                    <input 
                      type="text" 
                      placeholder="Tuliskan pertanyaan Anda..." 
                      value={q.question}
                      onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                      className="w-full bg-gray-50 dark:bg-white/[0.03] border-b-2 border-gray-200 dark:border-white/10 focus:border-primary px-4 py-3 text-base sm:text-lg font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none transition-colors rounded-t-xl"
                    />
                  </div>

                  {/* Dynamic Options for Radio, Checkbox, Dropdown */}
                  {(q.type === 'radio' || q.type === 'checkbox' || q.type === 'dropdown') && (
                    <div className="space-y-2.5 pl-2 mb-4">
                      {q.options?.map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-3">
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 dark:border-white/30 shrink-0" />
                          <input 
                            type="text" 
                            placeholder={`Pilihan ${optIndex + 1}`}
                            value={opt}
                            onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                            className="flex-1 bg-transparent border-b border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 py-1.5 focus:outline-none focus:border-primary transition-colors"
                          />
                          {q.options.length > 1 && (
                            <button 
                              onClick={() => removeOption(q.id, optIndex)}
                              className="text-gray-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      <button 
                        onClick={() => addOption(q.id)}
                        className="text-xs font-bold text-primary hover:text-emerald-400 flex items-center gap-1.5 mt-2 py-1 px-2 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <Plus size={14} /> Tambah Pilihan
                      </button>
                    </div>
                  )}

                  {/* Required Switch */}
                  <div className="flex items-center justify-end pt-3 border-t border-gray-100 dark:border-white/5">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-gray-600 dark:text-white/70 select-none">
                      <input 
                        type="checkbox" 
                        checked={q.required || false}
                        onChange={(e) => updateQuestion(q.id, 'required', e.target.checked)}
                        className="w-4 h-4 text-primary accent-primary rounded"
                      />
                      <span>Wajib Diisi</span>
                    </label>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex items-center gap-3">
              <button 
                onClick={addQuestion}
                className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white px-5 py-3 rounded-2xl font-bold transition-all text-sm shadow-sm"
              >
                <Plus size={16} />
                <span>Tambah Pertanyaan</span>
              </button>
              <button 
                onClick={() => {
                  setQuestions([
                    ...questions,
                    { id: Date.now().toString(), type: 'page_break' }
                  ]);
                }}
                className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-white px-5 py-3 rounded-2xl font-bold transition-all text-sm shadow-sm"
              >
                <SplitSquareVertical size={16} />
                <span>Tambah Pembatas Halaman</span>
              </button>
            </div>

            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-primary hover:bg-emerald-400 text-[#050e0a] px-8 py-3.5 rounded-2xl font-bold transition disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.25)] text-sm"
            >
              <Save size={16} />
              {saving ? 'Menyimpan & Menghubungkan...' : 'Simpan Formulir'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
