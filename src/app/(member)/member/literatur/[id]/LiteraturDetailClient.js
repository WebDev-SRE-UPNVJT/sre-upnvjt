"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, FileText, FolderOpen, Info, Search } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useRouter } from "next/navigation";
import dynamic from 'next/dynamic';

const PDFViewerWrapper = dynamic(() => import('@/components/ui/PDFViewerWrapper'), { ssr: false });

const TYPE_COLORS = {
  PDF:    "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  SLIDES: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  DOC:    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  VIDEO:  "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  OTHER:  "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
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
    <div className="w-full relative min-h-[85vh]">
      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 dark:bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Back Button */}
      <button
        onClick={() => router.push("/member/literatur")}
        className="relative z-20 group flex items-center gap-2 mb-8 text-slate-500 dark:text-white/50 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors font-bold text-sm tracking-wide"
      >
        <div className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-500/10 transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </div>
        {t('literatur.back')}
      </button>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 relative z-10">
        
        {/* Left Side: A4 Portrait Preview (7 columns) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full aspect-[1/1.414] bg-white dark:bg-[#090d14] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl overflow-hidden relative flex flex-col"
          >
            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#08120e] z-10">
                <FileText className="w-12 h-12 text-emerald-500/40 animate-bounce mb-4" />
                <span className="text-sm font-bold text-slate-400 dark:text-white/40 tracking-widest uppercase animate-pulse">Memuat Dokumen...</span>
              </div>
            )}
            {item.type === 'PDF' ? (
              <div className="w-full h-full overflow-y-auto bg-slate-100 dark:bg-slate-900/50 custom-scrollbar relative z-20">
                <PDFViewerWrapper
                  file={pdfUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  numPages={numPages}
                  renderPageWrapper={(Page, index) => (
                    <Page 
                      key={`page_${index + 1}`} 
                      pageNumber={index + 1} 
                      width={800}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-md"
                    />
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
          
          <div className="mt-4 flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-white/60">
            <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">
              <strong>Tips Pencarian:</strong> Anda dapat mencari kata spesifik di dalam isi dokumen ini dengan menekan <kbd className="px-2 py-1 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-md text-xs font-mono shadow-sm">Ctrl + F</kbd> (atau <kbd className="px-2 py-1 bg-white dark:bg-black/30 border border-slate-200 dark:border-white/10 rounded-md text-xs font-mono shadow-sm">Cmd + F</kbd> di Mac), atau dengan mengklik tombol <span className="inline-flex items-center gap-1 font-semibold text-slate-800 dark:text-white"><Search className="w-3.5 h-3.5 inline" /> Pencarian</span> di bagian atas dokumen (jika tersedia).
            </p>
          </div>
        </div>

        {/* Right Side: Details Card (5 columns) */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-24">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#090d14] rounded-3xl border border-slate-200 dark:border-white/10 p-8 shadow-xl"
            >
              <div className="flex gap-2 mb-6">
                <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${
                  TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
                }`}>
                  {item.type || "OTHER"}
                </span>
                {item.category && (
                  <span className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60">
                    {item.category.name}
                  </span>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-8 tracking-tight">
                {item.title}
              </h1>

              <div className="space-y-6 mb-10">
                {item.author && (
                  <div className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider mb-0.5">Penulis / Author</p>
                      <p className="text-sm font-bold">{item.author}</p>
                    </div>
                  </div>
                )}

                {item.year && (
                  <div className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider mb-0.5">{t('literatur.year')} Terbit</p>
                      <p className="text-sm font-bold">{item.year}</p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-4 text-slate-600 dark:text-white/70 font-medium">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-slate-400 dark:text-white/40 tracking-wider mb-0.5">{t('literatur.category')}</p>
                    <p className="text-sm font-bold">{item.category?.name || "Uncategorized"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 dark:border-white/10">
                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/25 group"
                >
                  {t('literatur.open')} Original File
                  <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
