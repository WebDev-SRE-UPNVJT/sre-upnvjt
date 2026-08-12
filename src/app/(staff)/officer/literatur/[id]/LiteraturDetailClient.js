"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, FileText, FolderOpen, Info, Zap } from "lucide-react";
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
  const { t } = useLanguage();
  const router = useRouter();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);

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
          <div className="sticky top-24">
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white/60 dark:bg-[#08120e]/60 backdrop-blur-2xl rounded-[2rem] border border-slate-200 dark:border-white/10 p-8 shadow-2xl relative overflow-hidden group"
            >
              {/* Card Ambient Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl group-hover:bg-teal-500/20 transition-colors duration-700 pointer-events-none" />

              <div className="relative z-10">
                <div className="flex gap-3 mb-8">
                  <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-sm border ${
                    TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
                  }`}>
                    <Zap className="w-3.5 h-3.5" />
                    {item.type || "OTHER"}
                  </span>
                  {item.category && (
                    <span className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 shadow-sm">
                      {item.category.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight mb-10 tracking-tight drop-shadow-sm">
                  {item.title}
                </h1>

                <div className="space-y-6 mb-12">
                  {item.author && (
                    <motion.div 
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-default"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0 shadow-inner">
                        <User className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-emerald-600/50 dark:text-emerald-400/50 tracking-[0.2em] mb-1">Penulis Dokumen</p>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">{item.author}</p>
                      </div>
                    </motion.div>
                  )}

                  {item.year && (
                    <motion.div 
                      whileHover={{ scale: 1.02, x: 5 }}
                      className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-default"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-500/10 border border-teal-100 dark:border-teal-500/20 flex items-center justify-center shrink-0 shadow-inner">
                        <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-teal-600/50 dark:text-teal-400/50 tracking-[0.2em] mb-1">Tahun Terbit</p>
                        <p className="text-base font-bold text-slate-800 dark:text-slate-200">{item.year}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  <motion.div 
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium p-3 -mx-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-default"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0 shadow-inner">
                      <FolderOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-blue-600/50 dark:text-blue-400/50 tracking-[0.2em] mb-1">Kategori</p>
                      <p className="text-base font-bold text-slate-800 dark:text-slate-200">{item.category?.name || "Uncategorized"}</p>
                    </div>
                  </motion.div>
                </div>

                <div className="pt-8 border-t border-slate-200/50 dark:border-white/10">
                  <motion.a
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    href={item.driveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-5 rounded-2xl bg-emerald-500 text-white font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all shadow-[0_8px_0_0_#047857] hover:shadow-[0_4px_0_0_#047857] hover:translate-y-[4px] active:shadow-none active:translate-y-[8px] group"
                  >
                    Buka Original File
                    <ExternalLink className="w-5 h-5 group-hover:rotate-12 transition-transform" />
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
