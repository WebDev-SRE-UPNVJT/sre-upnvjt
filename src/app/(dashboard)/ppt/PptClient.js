"use client";

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Edit2, Trash2, X, Search, CheckCircle2, XCircle,
  AlertTriangle, Presentation, UploadCloud, ChevronLeft,
  ChevronUp, ChevronDown, Eye, EyeOff, Layers, ExternalLink,
  GripVertical, FileSliders, FileText
} from "lucide-react";
import { convertPdfToWebPFiles } from "./pdfToWebp";
import CachedImage from "./CachedImage";
import {
  createPptModule, updatePptModule, deletePptModule,
  createPptSlide, updatePptSlide, deletePptSlide,
  reorderSlides,
} from "@/app/actions/pptActions";
import { useSession } from "next-auth/react";
import { hasAccess } from "@/lib/permissions";

// ─── Constants ────────────────────────────────────────────────────────────────
const EMPTY_MODULE = { title: "", description: "", notes: "", coverImageUrl: "", isPublished: false };
const EMPTY_SLIDE  = { title: "", fileUrl: "" };

// ─── Shared UI helpers ─────────────────────────────────────────────────────────
const InputField = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full h-12 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all";

const textareaCls =
  "w-full p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-all resize-none";

export default function PptClient({ initialModules, currentUser }) {
  const { data: session } = useSession();
  const user = session?.user ?? currentUser;

  // ── View state ──────────────────────────────────────────────────────────────
  const [view, setView]           = useState("list");   // "list" | "slides"
  const [activeModule, setActiveModule] = useState(null); // full module object with slides[]

  // ── Data ────────────────────────────────────────────────────────────────────
  const [modules, setModules]     = useState(initialModules || []);
  const [slides, setSlides]       = useState([]);        // slides of active module

  // ── UI state ────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading]     = useState(false);
  const [notification, setNotification] = useState(null);
  const [pdfProgress, setPdfProgress] = useState(null);

  // Module modal
  const [modModal, setModModal]     = useState(false);
  const [modForm, setModForm]       = useState(EMPTY_MODULE);
  const [targetMod, setTargetMod]   = useState(null);
  const [modDelModal, setModDelModal] = useState(false);

  // Slide modal
  const [slideModal, setSlideModal]     = useState(false);
  const [slideForm, setSlideForm]       = useState(EMPTY_SLIDE);
  const [targetSlide, setTargetSlide]   = useState(null);
  const [slideDelModal, setSlideDelModal] = useState(false);

  // ── Permissions ─────────────────────────────────────────────────────────────
  const canCreate = hasAccess(user, "ppt", "create");
  const canUpdate = hasAccess(user, "ppt", "update");
  const canDelete = hasAccess(user, "ppt", "delete");

  // ── Notification ─────────────────────────────────────────────────────────────
  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // ── File upload ──────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("error", "Harap pilih file gambar"); return; }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "ppt-covers");
    setIsLoading(true);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setModForm(p => ({ ...p, coverImageUrl: data.url }));
        notify("success", "Cover berhasil diunggah!");
      } else {
        notify("error", data.error || "Gagal mengunggah gambar");
      }
    } catch {
      notify("error", "Terjadi kesalahan saat upload");
    } finally {
      setIsLoading(false);
    }
  };


  // ── File upload PDF to WebP ─────────────────────────────────────────────────
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { notify("error", "Harap pilih file PDF"); return; }
    
    setIsLoading(true);
    try {
      setPdfProgress({ current: 0, total: 0, status: "Memproses PDF..." });
      
      const webpFiles = await convertPdfToWebPFiles(file, (current, total) => {
        setPdfProgress({ current, total, status: `Mengekstrak slide ${current}/${total}...` });
      });

      setPdfProgress({ current: 0, total: webpFiles.length, status: "Mengunggah gambar..." });
      
      let uploadedSlides = 0;
      for (const webpFile of webpFiles) {
        // Upload webp file to module-specific folder in R2
        const fd = new FormData();
        fd.append("file", webpFile);
        fd.append("folder", `ppt-slides/module-${activeModule.id}`);
        
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        const uploadData = await uploadRes.json();
        
        if (uploadRes.ok && uploadData.url) {
          // Create slide
          const slideForm = { title: `Slide ${uploadedSlides + 1}`, fileUrl: uploadData.url };
          const slideRes = await createPptSlide(activeModule.id, slideForm);
          
          if (slideRes.success) {
            setSlides(prev => [...prev, slideRes.slide]);
            setModules(prev => prev.map(m =>
              m.id === activeModule.id ? { ...m, slideCount: (m.slideCount || 0) + 1 } : m
            ));
          }
        }
        uploadedSlides++;
        setPdfProgress({ current: uploadedSlides, total: webpFiles.length, status: `Mengunggah slide ${uploadedSlides}/${webpFiles.length}...` });
      }

      notify("success", "Semua slide berhasil diunggah!");
    } catch (err) {
      console.error(err);
      notify("error", "Gagal memproses PDF.");
    } finally {
      setIsLoading(false);
      setPdfProgress(null);
    }
  };

  // Slide manager navigation
  const openSlideManager = async (mod) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/ppt/${mod.id}`);
      const data = await res.json();
      setActiveModule(data);
      setSlides(data.slides || []);
    } catch {
      // Fallback: use module from list with empty slides
      setActiveModule({ ...mod, slides: [] });
      setSlides([]);
    } finally {
      setIsLoading(false);
    }
    setView("slides");
  };

  const backToList = () => {
    setView("list");
    setActiveModule(null);
    setSlides([]);
    setSearchQuery("");
  };

  // Module handlers
  const openModModal = (mod = null) => {
    setModForm(mod ? { ...mod } : { ...EMPTY_MODULE });
    setTargetMod(mod);
    setModModal(true);
  };
  const closeModModal = () => {
    setModModal(false);
    setTimeout(() => { setModForm(EMPTY_MODULE); setTargetMod(null); }, 300);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const isEditing = Boolean(targetMod?.id);
    const res = isEditing
      ? await updatePptModule(targetMod.id, modForm)
      : await createPptModule(modForm, user?.id);

    if (res.success) {
      if (isEditing) {
        setModules(prev => prev.map(m => m.id === targetMod.id
          ? { ...res.module, slideCount: m.slideCount }
          : m
        ));
        // Also update activeModule if in slide view
        if (activeModule?.id === targetMod.id) {
          setActiveModule(p => ({ ...p, ...res.module }));
        }
      } else {
        setModules(prev => [res.module, ...prev]);
      }
      notify("success", isEditing ? "Modul diperbarui!" : "Modul ditambahkan!");
      closeModModal();
    } else {
      notify("error", res.error || "Gagal menyimpan modul");
    }
    setIsLoading(false);
  };

  const handleDeleteModule = async () => {
    if (!targetMod?.id) return;
    setIsLoading(true);
    const res = await deletePptModule(targetMod.id);
    if (res.success) {
      setModules(prev => prev.filter(m => m.id !== targetMod.id));
      notify("success", "Modul dihapus");
      setModDelModal(false);
      if (view === "slides") backToList();
    } else {
      notify("error", res.error || "Gagal menghapus modul");
    }
    setIsLoading(false);
  };

  // Slide handlers
  const openSlideModal = (slide = null) => {
    setSlideForm(slide ? { ...slide } : { ...EMPTY_SLIDE });
    setTargetSlide(slide);
    setSlideModal(true);
  };
  const closeSlideModal = () => {
    setSlideModal(false);
    setTimeout(() => { setSlideForm(EMPTY_SLIDE); setTargetSlide(null); }, 300);
  };

  const handleSaveSlide = async (e) => {
    e.preventDefault();
    if (!activeModule) return;
    setIsLoading(true);
    const isEditing = Boolean(targetSlide?.id);
    const res = isEditing
      ? await updatePptSlide(targetSlide.id, slideForm)
      : await createPptSlide(activeModule.id, slideForm);

    if (res.success) {
      if (isEditing) {
        setSlides(prev => prev.map(s => s.id === targetSlide.id ? res.slide : s));
      } else {
        setSlides(prev => [...prev, res.slide]);
        // Update slide count on module card
        setModules(prev => prev.map(m =>
          m.id === activeModule.id ? { ...m, slideCount: (m.slideCount || 0) + 1 } : m
        ));
      }
      notify("success", isEditing ? "Slide diperbarui!" : "Slide ditambahkan!");
      closeSlideModal();
    } else {
      notify("error", res.error || "Gagal menyimpan slide");
    }
    setIsLoading(false);
  };

  const handleDeleteSlide = async () => {
    if (!targetSlide?.id || !activeModule) return;
    setIsLoading(true);
    const res = await deletePptSlide(targetSlide.id, activeModule.id);
    if (res.success) {
      const updated = slides
        .filter(s => s.id !== targetSlide.id)
        .map((s, i) => ({ ...s, order: i + 1 }));
      setSlides(updated);
      setModules(prev => prev.map(m =>
        m.id === activeModule.id ? { ...m, slideCount: Math.max(0, (m.slideCount || 1) - 1) } : m
      ));
      notify("success", "Slide dihapus");
      setSlideDelModal(false);
    } else {
      notify("error", res.error || "Gagal menghapus slide");
    }
    setIsLoading(false);
  };

  // ── Reorder slides (up/down) ─────────────────────────────────────────────
  const moveSlide = useCallback(async (index, direction) => {
    const newSlides = [...slides];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newSlides.length) return;

    [newSlides[index], newSlides[swapIdx]] = [newSlides[swapIdx], newSlides[index]];
    const reordered = newSlides.map((s, i) => ({ ...s, order: i + 1 }));
    setSlides(reordered);

    await reorderSlides(activeModule.id, reordered.map(s => s.id));
  }, [slides, activeModule]);

  // ── Filtered modules ────────────────────────────────────────────────────────
  const filteredModules = modules.filter(m =>
    (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (view === "slides" && activeModule) {
    return (
      <div className="w-full relative">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={backToList}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Kembali
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-display font-black tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
                <FileSliders className="w-7 h-7 text-primary" />
                {activeModule.title}
              </h1>
              {activeModule.description && (
                <p className="text-sm text-gray-500 dark:text-white/40 mt-1">{activeModule.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {canUpdate && (
              <button
                onClick={() => openModModal(activeModule)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/70 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit Modul
              </button>
            )}
            {canCreate && (
              <label className={`flex items-center gap-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white px-5 py-2.5 rounded-xl font-bold tracking-wide hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                <FileText className="w-4 h-4" />
                Upload PDF
                <input type="file" accept="application/pdf" onChange={(e) => { handlePdfUpload(e); e.target.value = null; }} className="hidden" />
              </label>
            )}
            {canCreate && (
              <button
                onClick={() => openSlideModal()}
                className="flex items-center gap-2 bg-primary text-[#050e0a] px-5 py-2.5 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] text-sm"
              >
                <Plus className="w-4 h-4" />
                Tambah Slide
              </button>
            )}
          </div>
        </div>

        {/* ── Slide count info ── */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold border border-primary/20">
            {slides.length} Slide
          </span>
          <span className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${
            activeModule.isPublished
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-gray-500/10 text-gray-400 border-gray-500/20"
          }`}>
            {activeModule.isPublished ? "Published" : "Draft"}
          </span>
        </div>

        {pdfProgress && (
          <div className="bg-primary/10 text-primary border border-primary/20 p-4 rounded-xl mb-6 flex items-center justify-between">
            <div className="font-semibold text-sm">{pdfProgress.status}</div>
            {pdfProgress.total > 0 && (
              <div className="text-sm font-bold">{Math.round((pdfProgress.current / pdfProgress.total) * 100)}%</div>
            )}
          </div>
        )}

        {/* ── Slides list ── */}
        {slides.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
            <Layers className="w-12 h-12 text-gray-400 dark:text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada slide</h3>
            <p className="text-gray-500 dark:text-white/40 text-sm">Tambahkan slide pertama untuk modul ini.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {slides.map((slide, index) => (
                <motion.div
                  key={slide.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex gap-0"
                >
                  {/* Slide number */}
                  <div className="w-14 bg-gray-50 dark:bg-white/[0.03] border-r border-gray-200 dark:border-white/10 flex flex-col items-center justify-center gap-1 shrink-0">
                    <span className="text-[11px] font-black text-gray-400 dark:text-white/30 uppercase tracking-widest">#{slide.order}</span>
                  </div>

                  {/* Slide preview */}
                  <div className="w-40 h-28 bg-gray-100 dark:bg-black/30 border-r border-gray-200 dark:border-white/10 shrink-0 overflow-hidden relative flex items-center justify-center">
                    <CachedImage
                      src={slide.fileUrl}
                      alt={slide.title || `Slide ${slide.order}`}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug">
                            {slide.title || <span className="text-gray-400 dark:text-white/30 italic font-normal">Tanpa judul</span>}
                          </h3>
                          <a
                            href={
                              slide.fileUrl?.startsWith("http://") || slide.fileUrl?.startsWith("https://")
                                ? slide.fileUrl
                                : `${(process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://cdn.webly.biz.id/").replace(/\/$/, "")}/${slide.fileUrl?.replace(/^\//, "")}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                          >
                            Buka Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-center justify-center gap-1.5 px-4 border-l border-gray-200 dark:border-white/10 shrink-0">
                    {/* Reorder */}
                    <button
                      onClick={() => moveSlide(index, "up")}
                      disabled={index === 0 || isLoading}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition-all border border-gray-200 dark:border-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveSlide(index, "down")}
                      disabled={index === slides.length - 1 || isLoading}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center justify-center transition-all border border-gray-200 dark:border-white/10 disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {canUpdate && (
                      <button
                        onClick={() => openSlideModal(slide)}
                        className="w-8 h-8 rounded-lg bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center transition-all border border-transparent hover:border-gray-200 dark:border-white/10"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => { setTargetSlide(slide); setSlideDelModal(true); }}
                        className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── Slide Save Modal ── */}
        <AnimatePresence>
          {slideModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeSlideModal} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              >
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    {targetSlide ? "Edit Slide" : "Slide Baru"}
                  </h2>
                  <button onClick={closeSlideModal} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                  <form id="slideForm" onSubmit={handleSaveSlide} className="space-y-5">
                    <InputField label="Judul Slide">
                      <input type="text" value={slideForm.title}
                        onChange={e => setSlideForm(p => ({ ...p, title: e.target.value }))}
                        className={inputCls} placeholder="e.g. Pengantar Mekanika Fluida" />
                    </InputField>
                    <InputField label="File URL (WebP / R2) *">
                      <input type="url" required value={slideForm.fileUrl || ''}
                        onChange={e => setSlideForm(p => ({ ...p, fileUrl: e.target.value }))}
                        className={inputCls}
                        placeholder="https://..." />
                      <p className="mt-1.5 text-[11px] text-gray-400 dark:text-white/30 leading-relaxed">
                        Masukkan tautan file dari Cloudflare R2 atau storage lainnya.
                      </p>
                    </InputField>
                  </form>
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
                  <button onClick={closeSlideModal} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                    Batal
                  </button>
                  <button type="submit" form="slideForm" disabled={isLoading}
                    className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50">
                    {isLoading ? <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" /> : "Simpan Slide"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Slide Delete Modal ── */}
        <AnimatePresence>
          {slideDelModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSlideDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <AlertTriangle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Slide</h2>
                <p className="text-gray-500 dark:text-white/50 mb-8 text-sm">
                  Hapus slide <strong className="text-gray-900 dark:text-white">#{targetSlide?.order} — {targetSlide?.title || "Tanpa judul"}</strong>? Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setSlideDelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all">Batal</button>
                  <button onClick={handleDeleteSlide} disabled={isLoading}
                    className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Hapus"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <Toast notification={notification} onClose={() => setNotification(null)} />

        {/* Module edit modal (reused in slide view) */}
        <ModuleModal
          open={modModal} onClose={closeModModal} form={modForm} setForm={setModForm}
          onSubmit={handleSaveModule} isEditing={Boolean(targetMod?.id)}
          isLoading={isLoading} onUpload={handleFileUpload}
        />
      </div>
    );
  }

  return (
    <div className="w-full relative">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-display font-black tracking-tighter mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
            <Presentation className="w-8 h-8 text-primary" />
            PPT Modules
          </h1>
          <p className="text-gray-500 dark:text-white/50 max-w-xl">
            Kelola modul pembelajaran dan slide presentasi SRE UPNVJT.
          </p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30" />
            <input type="text" placeholder="Cari modul..." value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          {canCreate && (
            <button onClick={() => openModModal()}
              className="flex items-center gap-2 bg-primary text-[#050e0a] px-6 py-3 rounded-xl font-bold tracking-wide hover:bg-primary-focus hover:scale-105 transition-all shrink-0 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Tambah Modul</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Module Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {filteredModules.length === 0 ? (
            <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-white/40 dark:bg-white/[0.02] border border-dashed border-gray-200/50 dark:border-white/10 rounded-3xl">
              <Presentation className="w-12 h-12 text-gray-400 dark:text-white/20 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Belum ada modul PPT</h3>
              <p className="text-gray-500 dark:text-white/40 text-sm">Buat modul pertama untuk mulai menambahkan slide.</p>
            </div>
          ) : filteredModules.map(mod => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 shadow-lg dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] rounded-3xl overflow-hidden backdrop-blur-xl group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(16,185,129,0.08)] transition-all duration-300 flex flex-col"
            >
              {/* Cover */}
              <button
                onClick={() => openSlideManager(mod)}
                className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-primary/10 to-primary/5 border-b border-gray-200 dark:border-white/5 cursor-pointer block text-left"
              >
                {mod.coverImageUrl ? (
                  <CachedImage src={mod.coverImageUrl} alt={mod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-primary/40">
                    <Presentation className="w-10 h-10 mb-2" />
                    <span className="text-[11px] font-medium">Klik untuk kelola slide</span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full">
                    Kelola Slide →
                  </span>
                </div>
                {/* Badges */}
                <div className="absolute top-3 left-3 right-3 flex justify-between">
                  <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-black/40 text-white backdrop-blur-md border border-white/10">
                    {mod.slideCount ?? 0} slide
                  </span>
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border backdrop-blur-md ${
                    mod.isPublished
                      ? "bg-green-500/25 text-green-300 border-green-500/30"
                      : "bg-black/40 text-white/60 border-white/10"
                  }`}>
                    {mod.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
              </button>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white mb-1 group-hover:text-primary transition-colors leading-snug">
                  {mod.title}
                </h3>
                {mod.description && (
                  <p className="text-[12px] text-gray-500 dark:text-white/40 line-clamp-2 mb-4 flex-1">
                    {mod.description}
                  </p>
                )}
                <div className="flex gap-2 mt-auto pt-4 border-t border-gray-200 dark:border-white/5">
                  <button
                    onClick={() => openSlideManager(mod)}
                    className="flex-1 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center gap-1.5 transition-all border border-primary/20 text-xs font-bold"
                  >
                    <Layers className="w-3.5 h-3.5" /> Slides
                  </button>
                  {canUpdate && (
                    <button onClick={() => openModModal(mod)}
                      className="h-9 w-9 rounded-xl bg-white dark:bg-white/5 shadow-sm dark:shadow-none hover:bg-gray-50 dark:hover:bg-white/10 text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white flex items-center justify-center transition-all border border-gray-200 dark:border-white/10">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => { setTargetMod(mod); setModDelModal(true); }}
                      className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-all border border-transparent hover:border-red-500/20">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Module Save Modal ── */}
      <ModuleModal
        open={modModal} onClose={closeModModal} form={modForm} setForm={setModForm}
        onSubmit={handleSaveModule} isEditing={Boolean(targetMod?.id)}
        isLoading={isLoading} onUpload={handleFileUpload}
      />

      {/* ── Module Delete Modal ── */}
      <AnimatePresence>
        {modDelModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModDelModal(false)} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Modul</h2>
              <p className="text-gray-500 dark:text-white/50 mb-2 text-sm">
                Hapus modul <strong className="text-gray-900 dark:text-white">{targetMod?.name}</strong>?
              </p>
              <p className="text-red-400/80 text-xs mb-8">Semua slide di dalam modul ini juga akan terhapus.</p>
              <div className="flex gap-3">
                <button onClick={() => setModDelModal(false)} className="flex-1 px-4 py-3 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-all">Batal</button>
                <button onClick={handleDeleteModule} disabled={isLoading}
                  className="flex-1 px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                  {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Hapus Modul"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Toast notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

// ─── Extracted: Module Save Modal ─────────────────────────────────────────────
function ModuleModal({ open, onClose, form, setForm, onSubmit, isEditing, isLoading, onUpload }) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white dark:bg-[#0a1612] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex items-center justify-between shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Presentation className="w-5 h-5 text-primary" />
                {isEditing ? "Edit Modul" : "Modul Baru"}
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="modForm" onSubmit={onSubmit} className="space-y-5">
                <InputField label="Judul Modul *">
                  <input type="text" required value={form.title}
                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className={inputCls} placeholder="e.g. Mekanika Fluida — Pertemuan 1" />
                </InputField>

                <InputField label="Deskripsi">
                  <textarea rows={3} value={form.description || ''}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className={`${textareaCls} h-24`} placeholder="Deskripsi singkat modul..." />
                </InputField>

                <InputField label="Catatan / Notes">
                  <textarea rows={6} value={form.notes || ''}
                    onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className={`${textareaCls} h-32`} placeholder="Catatan materi untuk modul ini..." />
                </InputField>

                <InputField label="Cover Image (URL atau Upload)">
                  <div className="flex gap-3 items-start">
                    {form.coverImageUrl && (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-black/30">
                        <img src={form.coverImageUrl} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 flex flex-col gap-2">
                      <input type="text" value={form.coverImageUrl}
                        onChange={e => setForm(p => ({ ...p, coverImageUrl: e.target.value }))}
                        className={inputCls} placeholder="https://..." />
                      <label className={`relative overflow-hidden flex items-center gap-2 h-10 px-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-500 dark:text-white/50 hover:bg-gray-50 dark:hover:bg-white/10 transition-colors cursor-pointer ${isLoading ? "opacity-50 pointer-events-none" : ""}`}>
                        <input type="file" accept="image/*" onChange={onUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        <UploadCloud className="w-4 h-4" /> Upload cover
                      </label>
                    </div>
                  </div>
                </InputField>

                {/* Published toggle */}
                <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 shadow-sm dark:shadow-none border border-gray-200 dark:border-white/10 rounded-xl">
                  <div>
                    <div className="text-gray-900 dark:text-white font-medium text-[14px]">Status Publikasi</div>
                    <div className="text-gray-500 dark:text-white/40 text-[12px]">
                      {form.isPublished ? "Dapat diakses anggota" : "Disimpan sebagai draft"}
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={form.isPublished}
                      onChange={e => setForm(p => ({ ...p, isPublished: e.target.checked }))} />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3 shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
              <button onClick={onClose} className="px-6 py-2.5 rounded-xl font-semibold text-gray-500 dark:text-white/70 hover:text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all">Batal</button>
              <button type="submit" form="modForm" disabled={isLoading}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-[#050e0a] hover:bg-[#a8d3ba] transition-all flex items-center gap-2 disabled:opacity-50">
                {isLoading ? <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" /> : "Simpan Modul"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Extracted: Toast ──────────────────────────────────────────────────────────
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
          <span className="font-medium">{notification.message}</span>
          <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
