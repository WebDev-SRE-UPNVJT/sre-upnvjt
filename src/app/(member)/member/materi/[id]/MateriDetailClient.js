"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Download, Play, Lightbulb, ArrowLeft, Layers, Presentation, Maximize, Minimize, Loader2, Timer, CheckCircle2, Award
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { resolveImageUrl } from "@/lib/imageUrl";

// Helper component to render HTML notes nicely
const HtmlNotes = ({ html, fontSizeClass }) => {
  if (!html) return null;

  return (
    <>
      <style>{`
        .notes-html p { margin-bottom: 1rem; }
        .notes-html p:last-child { margin-bottom: 0; }
        .notes-html b, .notes-html strong { font-weight: 700; color: inherit; }
        .notes-html i, .notes-html em { font-style: italic; }
        .notes-html ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 1rem; }
        .notes-html ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 1rem; }
        .notes-html li { margin-bottom: 0.25rem; }
        .notes-html h1, .notes-html h2, .notes-html h3, .notes-html h4 { font-weight: 700; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #0f172a; }
        :is(.dark .notes-html h1, .dark .notes-html h2, .dark .notes-html h3, .dark .notes-html h4) { color: #f8fafc; }
        .notes-html a { color: #10b981; text-decoration: underline; }
        .notes-html blockquote { border-left: 4px solid #10b981; padding-left: 1rem; font-style: italic; color: #64748b; margin-bottom: 1rem; }
        :is(.dark .notes-html blockquote) { color: #94a3b8; }
        .notes-html br { display: block; content: ""; margin-top: 0.5rem; }
      `}</style>
      <div 
        className={`notes-html text-slate-600 dark:text-slate-400 leading-relaxed text-justify ${fontSizeClass}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
};

export default function MateriDetailClient({ initialData, r2Url }) {
  const router = useRouter();
  const { t } = useLanguage();
  
  const [moduleData] = useState(initialData);
  const [slides] = useState(initialData?.slides || []);
  const [currentSlideIdx, setCurrentSlideIdx] = useState(0);
  const [maxSlideIdx, setMaxSlideIdx] = useState(0);
  const [notesFontSize, setNotesFontSize] = useState('md');
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [timeLeft, setTimeLeft] = useState(5);
  
  const [isCompleting, setIsCompleting] = useState(false);
  const [xpGained, setXpGained] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (initialData?.id) {
      try {
        const savedProgress = localStorage.getItem(`sre_materi_progress_${initialData.id}`);
        if (savedProgress) {
          const parsed = JSON.parse(savedProgress);
          let cIdx = 0;
          let mIdx = 0;
          
          if (parsed.currentSlideIdx !== undefined && parsed.currentSlideIdx >= 0 && parsed.currentSlideIdx < (initialData.slides?.length || 0)) {
            cIdx = parsed.currentSlideIdx;
          }
          if (parsed.maxSlideIdx !== undefined) {
            mIdx = parsed.maxSlideIdx;
          } else {
            mIdx = cIdx || 0;
          }
          
          setCurrentSlideIdx(cIdx);
          setMaxSlideIdx(mIdx);
          
          if (cIdx < mIdx) {
            setTimeLeft(0);
          }
        }
      } catch (e) {}
    }
  }, [initialData]);


  
  // Custom font sizes based on user preference
  const fontSizeStyles = {
    sm: 'text-xs md:text-sm',
    md: 'text-sm md:text-base',
    lg: 'text-base md:text-lg',
  };

  // Fullscreen State
  const presentationRef = useRef(null);
  const fetchedSlides = useRef(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Cached Images Object URLs
  const [cachedImages, setCachedImages] = useState({});


  // Save progress to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && moduleData?.id) {
      const progressData = { currentSlideIdx, maxSlideIdx, lastAccessed: Date.now() };
      localStorage.setItem(`sre_materi_progress_${moduleData.id}`, JSON.stringify(progressData));
    }
  }, [currentSlideIdx, maxSlideIdx, moduleData?.id]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const getYoutubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]{11})/);
    return match ? match[1] : null;
  };

  // Lazy Load and Cache API Logic
  useEffect(() => {
    const loadImage = async (slideIdx) => {
      if (slideIdx < 0 || slideIdx >= slides.length) return;
      const slide = slides[slideIdx];
      if (!slide?.fileUrl) return;
      
      const isYoutube = getYoutubeVideoId(slide.fileUrl);
      if (isYoutube) return;

      const fullUrl = resolveImageUrl(slide.fileUrl);
      
      // Avoid refetching if we already tried
      if (fetchedSlides.current.has(slideIdx)) return;
      fetchedSlides.current.add(slideIdx);

      try {
        const cache = await caches.open('sre-materi-cache');
        let response = await cache.match(fullUrl);
        
        if (!response) {
          response = await fetch(fullUrl, { mode: 'cors' });
          if (response.ok) {
            await cache.put(fullUrl, response.clone());
          } else {
            // If failed to fetch, fallback silently
            setCachedImages(prev => ({ ...prev, [slideIdx]: fullUrl }));
            return;
          }
        }
        
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        setCachedImages(prev => ({ ...prev, [slideIdx]: objectURL }));
      } catch (e) {
        // Fallback: use direct URL if CORS fails or Cache API fails
        setCachedImages(prev => ({ ...prev, [slideIdx]: fullUrl }));
      }
    };

    loadImage(currentSlideIdx);
    loadImage(currentSlideIdx + 1); // preload next
  }, [currentSlideIdx, slides, r2Url]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  useEffect(() => {
    // If they reached the last slide, immediately try to claim (ignore timeLeft)
    if (slides.length > 0 && maxSlideIdx === slides.length - 1 && !isCompleting && !hasCompleted) {
      const claimXp = async () => {
        setIsCompleting(true);
        try {
          const res = await fetch(`/api/materi/${moduleData.id}/complete`, { method: "POST" });
          const data = await res.json();
          if (data.success && data.gainedXp) {
            setXpGained(data.gainedXp);
            setShowModal(true);
          }
          setHasCompleted(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsCompleting(false);
        }
      };
      claimXp();
    }
  }, [maxSlideIdx, slides.length, isCompleting, hasCompleted, moduleData?.id]);

  // Lock body scroll when completion modal is open
  useEffect(() => {
    if (xpGained && showModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [xpGained, showModal]);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      if (presentationRef.current?.requestFullscreen) {
        await presentationRef.current.requestFullscreen();
        try {
          if (screen.orientation && screen.orientation.lock) {
            await screen.orientation.lock('landscape');
          }
        } catch (e) {
          // Ignore if unsupported
        }
      }
    } else {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
        try {
          if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
          }
        } catch (e) {
          // Ignore if unsupported
        }
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] w-full text-center relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center justify-center"
        >
          <div className="relative flex items-center justify-center w-24 h-24 mb-8">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="absolute inset-0 rounded-full border-[3px] border-emerald-500/20 border-t-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            />
            <motion.div 
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-2 rounded-full border-[3px] border-teal-500/20 border-b-teal-400"
            />
            <Layers className="w-8 h-8 text-emerald-500 drop-shadow-md animate-pulse" />
          </div>
          
          <h2 className="text-xl font-black text-slate-800 dark:text-white tracking-wide mb-2">Memuat Modul</h2>
          <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500 dark:text-slate-400">
            <span>Sinkronisasi Progres</span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}>.</motion.span>
            <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.6 }}>.</motion.span>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!moduleData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-red-500 font-bold text-xl mb-4">{t('materi.module_not_found') || 'Module not found'}</p>
        <button onClick={() => router.push('/member/materi')} className="px-6 py-2 bg-emerald-500 text-[#0f172a] font-bold rounded-lg hover:bg-emerald-400">{t('materi.btn_back') || 'Back to Materi'}</button>
      </div>
    );
  }

  const handleNext = () => {
    if (currentSlideIdx < slides.length - 1 && timeLeft === 0) {
      const nextIdx = currentSlideIdx + 1;
      setDirection(1);
      setCurrentSlideIdx(nextIdx);
      if (nextIdx > maxSlideIdx) {
        setMaxSlideIdx(nextIdx);
        setTimeLeft(5);
      } else {
        setTimeLeft(0);
      }
    }
  };

  const handlePrev = () => {
    if (currentSlideIdx > 0) {
      const prevIdx = currentSlideIdx - 1;
      setDirection(-1);
      setCurrentSlideIdx(prevIdx);
      if (prevIdx > maxSlideIdx) {
        setMaxSlideIdx(prevIdx);
        setTimeLeft(5);
      } else {
        setTimeLeft(0);
      }
    }
  };

  const currentSlide = slides[currentSlideIdx];
  const youtubeId = getYoutubeVideoId(currentSlide?.fileUrl);
  const currentImageUrl = cachedImages[currentSlideIdx];
  const downloadUrl = currentSlide?.fileUrl ? `${r2Url.replace(/\/$/, '')}/${currentSlide.fileUrl.replace(/^\//, '')}` : "#";

  return (
    <div className="w-full pt-8 pb-12">
      <div className="w-full">
        
        {/* Back Button */}
        <button 
          onClick={() => router.push('/member/materi')}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors mb-8 font-semibold text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {t('materi.btn_back') || 'Kembali ke Daftar Materi'}
        </button>

        {/* Header Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-4">
            <Layers className="w-3.5 h-3.5" />
            {t('materi.learning_material') || 'Materi Pembelajaran'}
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {moduleData.title}
          </h1>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6 lg:gap-8 items-start">
          
          {/* Left Column Wrapper */}
          <div className="contents lg:block lg:col-span-3 lg:space-y-6">
            
            {/* 2. Presentation Card (order-2 on mobile) */}
            <div 
              ref={presentationRef}
              className={`order-2 lg:order-none bg-white dark:bg-[#07130e] border-slate-200/80 dark:border-white/10 overflow-hidden flex flex-col relative w-full ${isFullscreen ? 'border-0 rounded-none h-screen' : 'border rounded-2xl shadow-lg dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)]'}`}
            >
              {/* Media Area (strictly 16:9 unless fullscreen) */}
              <div className={`relative bg-slate-100 dark:bg-black/50 w-full flex flex-col items-center justify-center overflow-hidden ${isFullscreen ? 'flex-1' : 'aspect-video'}`}>
                {youtubeId ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?autoplay=0&rel=0`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  ></iframe>
                ) : currentSlide?.fileUrl ? (
                  <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative bg-[#0f172a]">
                    <AnimatePresence mode="wait" custom={direction}>
                      <motion.div
                        key={currentSlideIdx}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -20 }}
                        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        {currentImageUrl ? (
                          <img 
                            src={currentImageUrl} 
                            alt={currentSlide.title || `${t('materi.slide')} ${currentSlideIdx + 1}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400 gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <span className="text-sm font-semibold tracking-wide">{t('materi.loading_slides') || 'Memuat Slide...'}</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="p-12 text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center h-full">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Presentation className="w-8 h-8 text-slate-400 dark:text-emerald-500/50" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-slate-700 dark:text-white">{currentSlide?.title || t('materi.no_title') || "No Title"}</h3>
                    <p className="text-sm max-w-md mx-auto">{moduleData.notes || t('materi.no_notes') || "Tidak ada media pendukung untuk materi ini."}</p>
                  </div>
                )}
              </div>

              {/* Controls Bar */}
              <div className="p-4 bg-white dark:bg-[#07130e] flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrev} 
                    disabled={currentSlideIdx === 0} 
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-600 dark:text-white disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-black/30 border border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300 font-semibold text-sm min-w-[100px] text-center">
                    {t('materi.slide') || 'Slide'} {currentSlideIdx + 1} / {slides.length || 1}
                  </div>
                  
                  <button 
                    onClick={handleNext} 
                    disabled={currentSlideIdx === slides.length - 1 || timeLeft > 0} 
                    className="relative w-10 h-10 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                  >
                    {timeLeft > 0 && currentSlideIdx !== slides.length - 1 ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-[38px] h-[38px] transform -rotate-90 drop-shadow-[0_0_2px_rgba(16,185,129,0.3)]" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-500/20" />
                          <motion.circle 
                            cx="20" cy="20" r="16" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="3" 
                            strokeDasharray="100" 
                            animate={{ strokeDashoffset: 100 - ((10 - timeLeft) / 10) * 100 }}
                            transition={{ duration: 1, ease: "linear" }}
                            strokeLinecap="round"
                            className="text-emerald-500" 
                          />
                        </svg>
                        <motion.span 
                          key={timeLeft}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="absolute text-[11px] font-black text-emerald-600 dark:text-emerald-400"
                        >
                          {timeLeft}
                        </motion.span>
                      </div>
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {youtubeId && (
                    <a 
                      href={currentSlide?.fileUrl || "#"} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-colors shadow-sm"
                    >
                      <Play className="w-4 h-4" />
                      {t('materi.open_youtube') || 'Buka di YouTube'}
                    </a>
                  )}
                  
                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 flex items-center justify-center text-slate-600 dark:text-white transition-colors shrink-0"
                  >
                    {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Notes Section (order-3 on mobile) */}
            {moduleData?.notes && (
              <div className="order-3 lg:order-none bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 sm:p-8 shadow-lg dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-white/10 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 border border-blue-500/20">
                      <Lightbulb className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('materi.module_notes') || 'Catatan Materi'}</h3>
                  </div>
                  
                  {/* Font Size Toggles */}
                  <div className="flex items-center bg-slate-100 dark:bg-white/[0.05] rounded-lg p-1 border border-slate-200 dark:border-white/10 self-start sm:self-auto shrink-0">
                    <button 
                      onClick={() => setNotesFontSize('sm')}
                      className={`w-9 h-9 rounded-md flex items-center justify-center font-bold transition-all ${notesFontSize === 'sm' ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'}`}
                      title="Teks Kecil"
                    >
                      <span className="text-[11px]">A</span>
                    </button>
                    <button 
                      onClick={() => setNotesFontSize('md')}
                      className={`w-9 h-9 rounded-md flex items-center justify-center font-bold transition-all ${notesFontSize === 'md' ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'}`}
                      title="Teks Sedang"
                    >
                      <span className="text-[14px]">A</span>
                    </button>
                    <button 
                      onClick={() => setNotesFontSize('lg')}
                      className={`w-9 h-9 rounded-md flex items-center justify-center font-bold transition-all ${notesFontSize === 'lg' ? 'bg-white dark:bg-emerald-500 text-emerald-600 dark:text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-white/60 dark:hover:text-white'}`}
                      title="Teks Besar"
                    >
                      <span className="text-[18px]">A</span>
                    </button>
                  </div>
                </div>
                <div className="mt-4 bg-slate-50/80 dark:bg-white/[0.03] rounded-xl p-4 sm:p-6 border border-slate-200/60 dark:border-white/10">
                  <HtmlNotes html={moduleData.notes} fontSizeClass={fontSizeStyles[notesFontSize]} />
                </div>
              </div>
            )}
          </div>

          {/* Right Column Wrapper */}
          <div className="contents lg:block lg:col-span-1 lg:space-y-6 lg:sticky lg:top-28">
            
              {/* 1. Module Progress (order-1 on mobile) */}
            <div className="order-1 lg:order-none bg-white dark:bg-[#07130e] border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-lg dark:shadow-[0_10px_35px_rgba(0,0,0,0.35)] w-full">
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-4">{t('materi.module_progress') || 'Progres Modul'}</h3>
              <div className="flex justify-between text-xs font-bold mb-2">
                <span className="text-slate-500 dark:text-white/60">{t('materi.completion') || 'Penyelesaian'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
                  {slides?.length > 1 ? Math.round((maxSlideIdx / (slides.length - 1)) * 100) : (maxSlideIdx >= 0 ? 100 : 0)}%
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden mb-4 border border-slate-200/50 dark:border-white/5 p-0.5 relative">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                  style={{ width: `${slides?.length > 1 ? (maxSlideIdx / (slides.length - 1)) * 100 : (maxSlideIdx >= 0 ? 100 : 0)}%` }}
                />
              </div>

              {/* XP Claim / Timer section */}
              {xpGained ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] border border-emerald-400/50"
                >
                  {/* Animated Background Rays/Glow */}
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                    className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(255,255,255,0.2)_360deg)] pointer-events-none"
                  />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <motion.div 
                      initial={{ rotate: -180, scale: 0 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full shadow-inner border border-white/30"
                    >
                      <Award className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_5px_rgba(253,224,71,0.8)]" />
                    </motion.div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest drop-shadow-sm">Pencapaian</span>
                      <span className="text-base font-black text-white drop-shadow-md">Modul Selesai!</span>
                    </div>
                  </div>
                  
                  <motion.div 
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    className="relative z-10 flex flex-col items-center justify-center bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/20"
                  >
                    <span className="text-xl font-black text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)]">
                      +{xpGained}
                    </span>
                    <span className="text-[9px] font-bold text-white/80 uppercase tracking-widest -mt-1">XP Points</span>
                  </motion.div>
                </motion.div>
              ) : hasCompleted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden flex items-center justify-between p-4 bg-slate-900 dark:bg-black/40 border border-emerald-500/30 rounded-xl group shadow-[0_0_15px_rgba(16,185,129,0.15)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-50" />
                  
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="flex items-center justify-center w-10 h-10 bg-emerald-500/20 rounded-full shadow-inner border border-emerald-500/30">
                      <Award className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-widest">Status</span>
                      <span className="text-base font-black text-emerald-400 drop-shadow-md">Tuntas!</span>
                    </div>
                  </div>
                  
                  <div className="relative z-10 flex items-center justify-center bg-emerald-500/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                  </div>
                </motion.div>
              ) : null}
            </div>

          </div>

        </div>
      </div>

      {/* Modal Hadiah XP Portal */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {xpGained && showModal && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto"
                onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
              >
                <motion.div 
                  initial={{ scale: 0.8, y: 30, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, y: 30, opacity: 0 }}
                  transition={{ type: "spring", damping: 14, stiffness: 220 }}
                  className="bg-white dark:bg-[#07130e] border border-emerald-500/40 rounded-[2.5rem] p-8 max-w-sm w-full shadow-[0_25px_60px_rgba(0,0,0,0.6)] flex flex-col items-center text-center relative overflow-hidden my-auto"
                >
                  {/* Confetti Particles */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(20)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 1, x: 0, y: 0, scale: 0 }}
                        animate={{ 
                          x: (Math.random() - 0.5) * 400, 
                          y: (Math.random() - 0.5) * 400, 
                          scale: Math.random() * 1.5 + 0.5,
                          opacity: 0,
                          rotate: Math.random() * 360
                        }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.1 }}
                        className={`absolute left-1/2 top-1/2 w-2 h-2 rounded-sm ${['bg-yellow-400', 'bg-emerald-400', 'bg-teal-400', 'bg-white'][i % 4]}`}
                      />
                    ))}
                  </div>

                  {/* Background Glow */}
                  <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/30 blur-[60px] rounded-full pointer-events-none" />
                  <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-teal-500/30 blur-[60px] rounded-full pointer-events-none" />

                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", delay: 0.2, damping: 10 }}
                    className="relative z-10 w-24 h-24 bg-gradient-to-br from-yellow-300 via-amber-400 to-amber-600 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(253,224,71,0.6)] mb-6 border-4 border-white dark:border-[#07130e] overflow-hidden"
                  >
                    {/* Shine effect across the medal */}
                    <motion.div 
                      animate={{ x: ['-150%', '250%'] }}
                      transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut", delay: 1 }}
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent skew-x-12 w-full"
                    />
                    <Award className="w-12 h-12 text-white drop-shadow-md relative z-10" />
                  </motion.div>
                  
                  <motion.h3 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="text-2xl font-black text-slate-800 dark:text-white mb-2 z-10 tracking-tight"
                  >
                    Pencapaian Baru!
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                    className="text-slate-500 dark:text-slate-400 text-sm mb-6 z-10 leading-relaxed"
                  >
                    Hebat! Kamu telah menyelesaikan modul pembelajaran ini dan mendapatkan hadiah.
                  </motion.p>
                  
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.6 }}
                    className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl py-3 px-8 mb-8 z-10 shadow-inner relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-emerald-400/20 w-0 group-hover:w-full transition-all duration-500 ease-out" />
                    <span className="relative text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 drop-shadow-sm">
                      +{xpGained} XP
                    </span>
                  </motion.div>
                  
                  <motion.button 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}
                    onClick={() => setShowModal(false)}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black uppercase tracking-wider text-sm rounded-xl transition-all z-10 shadow-[0_10px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_30px_rgba(16,185,129,0.4)] active:scale-95"
                  >
                    Lanjutkan Misi
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
