"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, FileText, FolderOpen, Info, Zap, Copy, Check, Tag } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

const PDFViewerWrapper = dynamic(() => import('@/components/ui/PDFViewerWrapper'), { ssr: false });

const TYPE_COLORS = {
  PDF:    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  SLIDES: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  DOC:    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  VIDEO:  "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  OTHER:  "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

export default function LiteraturDetailClient({ item }) {
  const { language, t } = useLanguage();
  const router = useRouter();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [copied, setCopied] = useState(false);

  // Default content language based on site language or available content
  const hasAbstract = Boolean(item.abstract || item.abstractId);
  const hasBilingualAbstract = Boolean(item.abstract && item.abstractId);
  const hasKeywords = Boolean(item.keywords || item.keywordsId);
  const hasBilingualKeywords = Boolean(item.keywords && item.keywordsId);

  const [selectedLang, setSelectedLang] = useState(() => {
    if (language === "id" && (item.abstractId || item.keywordsId)) return "id";
    if (item.abstract || item.keywords) return "en";
    if (item.abstractId || item.keywordsId) return "id";
    return "en";
  });

  const currentAbstract = selectedLang === "id"
    ? (item.abstractId || item.abstract)
    : (item.abstract || item.abstractId);

  const currentKeywords = selectedLang === "id"
    ? (item.keywordsId || item.keywords)
    : (item.keywords || item.keywordsId);

  const handleCopyAbstract = () => {
    if (!currentAbstract) return;
    navigator.clipboard.writeText(currentAbstract);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
    setIframeLoading(false);
  }

  // Parse generic google drive urls to preview URLs so they embed correctly in an iframe
  let previewUrl = item.driveUrl;
  let rawDownloadUrl = item.driveUrl;

  if (previewUrl.includes("drive.google.com/file/d/")) {
    const match = previewUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      previewUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      rawDownloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
  }

  const pdfUrl = `/api/proxy-pdf?url=${encodeURIComponent(rawDownloadUrl)}`;

  return (
    <div className="w-full relative min-h-[85vh] font-sans">
      {/* Background Gamified Elements */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[700px] h-[700px] bg-teal-500/10 dark:bg-teal-500/5 rounded-full blur-[150px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      {/* Back Button */}
      <motion.button
        whileHover={{ scale: 1.05, x: -5 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => router.push("/officer/literatur")}
        className="relative z-20 group flex items-center gap-3 mb-8 text-slate-500 dark:text-white/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-sm tracking-wide"
      >
        <div className="w-10 h-10 rounded-2xl bg-white/60 dark:bg-white/5 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:border-emerald-500 group-hover:text-white transition-all shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </div>
        {t('literatur.back')}
      </motion.button>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        
        {/* Left Side: A4 Portrait Preview (7 columns) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 30, rotateX: 10 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{ duration: 0.6, type: "spring" }}
            style={{ perspective: 1000 }}
            className="group w-full aspect-[1/1.414] bg-white/40 dark:bg-[#090d14]/40 backdrop-blur-2xl rounded-[2rem] border border-slate-200/50 dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(16,185,129,0.2)] overflow-hidden relative flex flex-col"
          >
            {/* Inner Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/0 via-emerald-500/5 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-30" />

            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 dark:bg-[#08120e]/80 backdrop-blur-sm z-10">
                <div className="relative mb-6">
                  <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl animate-pulse opacity-50" />
                  <FileText className="w-16 h-16 text-emerald-500 relative z-10 animate-bounce" />
                </div>
                <span className="text-xs font-black text-slate-500 dark:text-emerald-400 tracking-[0.3em] uppercase animate-pulse">Memuat Dokumen</span>
              </div>
            )}
            {item.type === 'PDF' ? (
              <div className="w-full h-full overflow-y-auto bg-slate-100/50 dark:bg-black/40 custom-scrollbar relative z-20 p-4 md:p-8">
                <PDFViewerWrapper
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  numPages={numPages}
                  renderPageWrapper={(Page, index) => (
                    <motion.div
                      key={`page_${index + 1}`}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                    >
                      <Page 
                        pageNumber={index + 1} 
                        width={800}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-2xl rounded-lg overflow-hidden border border-slate-200/50 dark:border-white/10"
                      />
                    </motion.div>
                  )}
                />
              </div>
            ) : (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none z-20 relative bg-white"
                allow="autoplay"
                onLoad={() => setIframeLoading(false)}
              />
            )}
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-start gap-4 p-6 rounded-[2rem] bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 text-slate-700 dark:text-emerald-100/70 shadow-lg shadow-emerald-500/5 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl" />
            <div className="p-3 bg-emerald-500/20 rounded-2xl shrink-0">
              <Info className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-black text-emerald-700 dark:text-emerald-400 mb-2 uppercase tracking-widest">Tips Pintas</h4>
              <p className="text-sm font-medium leading-relaxed mb-2">
                Cari kata spesifik di dokumen ini dengan <kbd className="px-2 py-1 bg-white/80 dark:bg-black/50 border border-emerald-500/30 rounded-lg text-xs font-black shadow-sm mx-1 text-emerald-700 dark:text-emerald-400">Ctrl + F</kbd> (atau <kbd className="px-2 py-1 bg-white/80 dark:bg-black/50 border border-emerald-500/30 rounded-lg text-xs font-black shadow-sm mx-1 text-emerald-700 dark:text-emerald-400">Cmd + F</kbd> di Mac), atau klik ikon kaca pembesar di atas dokumen.
              </p>
              <p className="text-sm font-medium leading-relaxed text-emerald-600/80 dark:text-emerald-400/80">
                <strong>Catatan:</strong> Jika teks di dalam kotak pratinjau (iframe/PDF) tidak dapat disalin (di-copy), silakan tekan tombol <strong>Buka Original File</strong> di panel kanan untuk mengakses dokumen penuh.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Gamified Details Card (5 columns) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/60 dark:bg-[#08120e]/60 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-2xl relative overflow-hidden group max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-colors duration-700 pointer-events-none" />

              <div className="relative z-10">
                {/* Badges & Meta Top */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${
                    TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
                  }`}>
                    <Zap className="w-3.5 h-3.5" />
                    {item.type || "OTHER"}
                  </span>
                  {item.category && (
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 shadow-sm">
                      {item.category.name}
                    </span>
                  )}
                  {item.year && (
                    <span className="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 shadow-sm flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-500" />
                      {item.year}
                    </span>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-6 tracking-tight drop-shadow-sm">
                  {item.title}
                </h1>

                {/* Metadata Grid (Author, Year, Category, Type) */}
                <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
                  {/* Author */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider">Penulis</p>
                      <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200" title={item.author || "-"}>
                        {item.author || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Year */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider">Tahun Terbit</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.year || "-"}
                      </p>
                    </div>
                  </div>

                  {/* Category */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider">Kategori</p>
                      <p className="text-xs font-bold truncate text-slate-800 dark:text-slate-200" title={item.category?.name || "Uncategorized"}>
                        {item.category?.name || "Uncategorized"}
                      </p>
                    </div>
                  </div>

                  {/* Type */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider">Tipe Dokumen</p>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {item.type || "PDF"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Abstract Section (Bilingual) */}
                <div className="mb-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {t('literatur.abstract')}
                      </h3>
                    </div>

                    {/* Language Switcher */}
                    {hasBilingualAbstract || hasBilingualKeywords ? (
                      <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/10 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setSelectedLang("en")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                            selectedLang === "en"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLang("id")}
                          className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase transition-all ${
                            selectedLang === "id"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          ID
                        </button>
                      </div>
                    ) : hasAbstract ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        {item.abstract ? "EN" : "ID"}
                      </span>
                    ) : null}
                  </div>

                  {hasAbstract ? (
                    <div className="relative group/abs bg-slate-50/80 dark:bg-white/[0.02] border border-slate-200/70 dark:border-white/5 rounded-2xl p-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      <p className="whitespace-pre-line select-text font-normal leading-relaxed text-justify">
                        {currentAbstract}
                      </p>

                      <button
                        type="button"
                        onClick={handleCopyAbstract}
                        className="mt-3.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t('literatur.abstract_copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t('literatur.abstract_copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-dashed border-slate-200 dark:border-white/10 text-center">
                      <p className="text-xs text-slate-400 dark:text-white/40 font-medium">
                        Abstrak belum ditambahkan untuk dokumen ini.
                      </p>
                    </div>
                  )}
                </div>

                {/* Keywords (Kata Kunci) */}
                <div className="mb-6 pb-6 border-b border-slate-200/50 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" />
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                        {t('literatur.keywords')}
                      </h3>
                    </div>
                    {!hasAbstract && hasBilingualKeywords ? (
                      <div className="flex bg-slate-100 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => setSelectedLang("en")}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${
                            selectedLang === "en"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          EN
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedLang("id")}
                          className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase transition-all ${
                            selectedLang === "id"
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white"
                          }`}
                        >
                          ID
                        </button>
                      </div>
                    ) : !hasAbstract && hasKeywords ? (
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
                        {item.keywords ? "EN" : "ID"}
                      </span>
                    ) : null}
                  </div>

                  {hasKeywords && currentKeywords ? (
                    <div className="flex flex-wrap gap-2">
                      {currentKeywords.split(',').map((kw, i) => {
                        const cleanKw = kw.trim();
                        if (!cleanKw) return null;
                        return (
                          <span
                            key={i}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 shadow-sm"
                          >
                            {cleanKw}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-white/40 font-medium italic">
                      Tidak ada kata kunci yang dicantumkan.
                    </p>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-auto pt-2">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={item.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_6px_0_0_#047857] hover:shadow-[0_2px_0_0_#047857] hover:translate-y-[4px] active:shadow-none active:translate-y-[6px] group"
                  >
                    Buka Original File
                    <ExternalLink className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
