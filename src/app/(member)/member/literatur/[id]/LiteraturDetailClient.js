"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Calendar, User, FileText, FolderOpen, Zap, Search, Copy, Check, Tag, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw } from "lucide-react";
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
  const { language, t } = useLanguage();
  const router = useRouter();
  const [iframeLoading, setIframeLoading] = useState(true);
  const [numPages, setNumPages] = useState(null);
  const [copied, setCopied] = useState(false);
  
  // Responsive PDF Viewer & Zoom controls
  const viewerCardRef = useRef(null);
  const viewerContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (viewerCardRef.current?.requestFullscreen) {
          await viewerCardRef.current.requestFullscreen();
        } else if (viewerCardRef.current?.webkitRequestFullscreen) {
          await viewerCardRef.current.webkitRequestFullscreen();
        } else {
          setIsFullscreen(!isFullscreen);
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Fullscreen toggle error:", err);
      setIsFullscreen(prev => !prev);
    }
  };

  useEffect(() => {
    if (!viewerContainerRef.current) return;
    const updateWidth = () => {
      if (viewerContainerRef.current) {
        const isMobile = window.innerWidth < 768;
        const padding = isMobile ? 16 : 32;
        const w = viewerContainerRef.current.clientWidth - padding;
        setContainerWidth(Math.max(260, Math.floor(w)));
      }
    };
    updateWidth();
    const ro = new ResizeObserver(updateWidth);
    ro.observe(viewerContainerRef.current);
    window.addEventListener('resize', updateWidth);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateWidth);
    };
  }, [isFullscreen]);

  const handleZoomIn = () => {
    setZoomScale(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  };
  const handleZoomOut = () => {
    setZoomScale(prev => Math.max(0.5, +(prev - 0.15).toFixed(2)));
  };
  const handleResetZoom = () => {
    setZoomScale(1.0);
  };

  const handleMouseDown = (e) => {
    if (!viewerContainerRef.current) return;
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.tagName === 'A') return;
    setIsDragging(true);
    setDragStart({
      x: e.pageX - viewerContainerRef.current.offsetLeft,
      y: e.pageY - viewerContainerRef.current.offsetTop,
      scrollLeft: viewerContainerRef.current.scrollLeft,
      scrollTop: viewerContainerRef.current.scrollTop,
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !viewerContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - viewerContainerRef.current.offsetLeft;
    const y = e.pageY - viewerContainerRef.current.offsetTop;
    const walkX = (x - dragStart.x) * 1.2;
    const walkY = (y - dragStart.y) * 1.2;
    viewerContainerRef.current.scrollLeft = dragStart.scrollLeft - walkX;
    viewerContainerRef.current.scrollTop = dragStart.scrollTop - walkY;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const calculatedPageWidth = Math.round((containerWidth || 600) * zoomScale);
  
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
        
        {/* Left Side (Desktop) / Second (Mobile): PDF Document Viewer with Zoom Controls */}
        <div className="order-2 lg:order-1 lg:col-span-7 xl:col-span-8">
          <motion.div 
            ref={viewerCardRef}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`w-full ${
              isFullscreen 
                ? 'fixed inset-0 z-[999] h-screen w-screen rounded-none bg-slate-900 border-none' 
                : 'h-[600px] sm:h-[750px] lg:h-[820px] bg-white dark:bg-[#090d14] rounded-3xl border border-slate-200 dark:border-white/10 shadow-xl'
            } overflow-hidden relative flex flex-col`}
          >
            {/* PDF Viewer Header Toolbar */}
            {item.type === 'PDF' && (
              <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 bg-slate-50/95 dark:bg-[#07100c]/95 backdrop-blur-md border-b border-slate-200 dark:border-white/10 z-30 shrink-0">
                {/* Page Count */}
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/50 text-[11px] font-bold">
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{numPages ? `${numPages} Halaman` : 'Dokumen PDF'}</span>
                </div>

                {/* Zoom Controls & Fullscreen */}
                <div className="flex items-center gap-1 bg-white dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    disabled={zoomScale <= 0.5}
                    title="Perkecil (Zoom Out)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Reset Zoom (100% Lebar Layar)"
                    className="px-2 py-0.5 rounded-lg text-[11px] font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all font-mono min-w-[46px] text-center"
                  >
                    {Math.round(zoomScale * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    disabled={zoomScale >= 2.5}
                    title="Perbesar (Zoom In)"
                    className="p-1.5 rounded-lg text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-30 transition-all"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleResetZoom}
                    title="Sesuaikan Lebar Layar (Fit Width)"
                    className={`p-1.5 rounded-lg transition-all ${
                      zoomScale === 1.0 
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" 
                        : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-3.5 bg-slate-200 dark:border-white/10 mx-0.5" />

                  <button
                    type="button"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? "Keluar Layar Penuh (Exit Fullscreen)" : "Layar Penuh (Fullscreen)"}
                    className={`p-1.5 rounded-lg transition-all ${
                      isFullscreen 
                        ? "bg-emerald-500 text-white shadow-sm" 
                        : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {iframeLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-[#08120e] z-10">
                <FileText className="w-12 h-12 text-emerald-500/40 animate-bounce mb-4" />
                <span className="text-sm font-bold text-slate-400 dark:text-white/40 tracking-widest uppercase animate-pulse">Memuat Dokumen...</span>
              </div>
            )}

            {item.type === 'PDF' ? (
              <div 
                ref={viewerContainerRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className={`w-full flex-1 overflow-x-auto overflow-y-auto bg-slate-100 dark:bg-slate-950/60 custom-scrollbar relative z-20 p-2 sm:p-4 touch-pan-x touch-pan-y ${
                  zoomScale > 1.0 ? 'cursor-grab active:cursor-grabbing select-none' : ''
                }`}
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain',
                }}
              >
                <div 
                  className="flex flex-col items-center pb-8 min-h-full"
                  style={{
                    minWidth: calculatedPageWidth > containerWidth ? calculatedPageWidth + 24 : '100%',
                    width: calculatedPageWidth > containerWidth ? calculatedPageWidth + 24 : '100%',
                    margin: calculatedPageWidth > containerWidth ? '0 auto' : undefined,
                  }}
                >
                  <PDFViewerWrapper
                    file={pdfUrl}
                    onLoadSuccess={onDocumentLoadSuccess}
                    numPages={numPages}
                    renderPageWrapper={(Page, index) => (
                      <div
                        key={`page_${index + 1}`}
                        className="my-3 shadow-xl rounded-xl overflow-hidden border border-slate-200/70 dark:border-white/10 transition-all bg-white shrink-0"
                        style={{ width: calculatedPageWidth }}
                      >
                        <Page 
                          pageNumber={index + 1} 
                          width={calculatedPageWidth}
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                        />
                      </div>
                    )}
                  />
                </div>
              </div>
            ) : (
              <iframe 
                src={previewUrl} 
                className="w-full flex-1 border-none z-20 relative bg-white"
                allow="autoplay"
                onLoad={() => setIframeLoading(false)}
              />
            )}
          </motion.div>
        </div>

        {/* Right Side (Desktop) / First (Mobile): Details Card */}
        <div className="order-1 lg:order-2 lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#090d14] rounded-3xl border border-slate-200 dark:border-white/10 p-6 md:p-8 shadow-xl max-h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar flex flex-col"
            >
              {/* Badges & Meta Top */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm border ${
                  TYPE_COLORS[item.type] || TYPE_COLORS.OTHER
                }`}>
                  {item.type || "OTHER"}
                </span>
                {item.category && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60">
                    {item.category.name}
                  </span>
                )}
                {item.year && (
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-white/60 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-emerald-500" />
                    {item.year}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-xl lg:text-2xl font-black text-slate-900 dark:text-white leading-tight mb-6 tracking-tight">
                {item.title}
              </h1>

              {/* Metadata Grid (Author, Year, Category, Type) */}
              <div className="grid grid-cols-2 gap-3 mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
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
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
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
              <div className="mb-6 pb-6 border-b border-slate-100 dark:border-white/10">
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
                <a
                  href={item.driveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/25 group"
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
