"use client";

import React, { useState, useEffect, useRef } from "react";
import { FileText, BookOpen, Loader2 } from "lucide-react";

// Global in-memory cache for rendered thumbnails across navigation
const thumbnailCache = new Map();

// Global pdfjs loader promise to ensure pdfjs is only initialized once
let pdfjsPromise = null;

function loadPdfJs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("react-pdf").then((mod) => {
      const pdfjs = mod.pdfjs;
      const version = pdfjs.version || "4.10.38";
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export default function LiteratureCover({
  driveUrl,
  title,
  author,
  year,
  type = "PDF",
  categoryName,
  className = "",
}) {
  const [dataUrl, setDataUrl] = useState(() => (driveUrl ? thumbnailCache.get(driveUrl) || null : null));
  const [loading, setLoading] = useState(!dataUrl);
  const [error, setError] = useState(false);
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer for lazy loading PDF pages only when scrolled into view
  useEffect(() => {
    if (dataUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [dataUrl]);

  useEffect(() => {
    if (!isVisible || !driveUrl || dataUrl) return;

    let isMounted = true;
    let cancel = false;

    async function generateThumbnail() {
      try {
        setLoading(true);
        setError(false);

        // Check cache again
        if (thumbnailCache.has(driveUrl)) {
          if (isMounted) {
            setDataUrl(thumbnailCache.get(driveUrl));
            setLoading(false);
          }
          return;
        }

        const pdfjs = await loadPdfJs();
        if (cancel) return;

        const proxyUrl = `/api/proxy-pdf?url=${encodeURIComponent(driveUrl)}`;
        const loadingTask = pdfjs.getDocument({
          url: proxyUrl,
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/cmaps/`,
          cMapPacked: true,
          standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version || "4.10.38"}/standard_fonts/`,
          disableFontFace: false,
        });

        const pdf = await loadingTask.promise;
        if (cancel) return;

        const page = await pdf.getPage(1);
        if (cancel) return;

        // Render at crisp high-DPI quality for the header
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: false });
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          intent: "display",
        }).promise;

        if (cancel) return;

        // Convert canvas to webp / png data URL
        const generatedUrl = canvas.toDataURL("image/webp", 0.85);

        // Save in cache
        thumbnailCache.set(driveUrl, generatedUrl);

        if (isMounted) {
          setDataUrl(generatedUrl);
          setLoading(false);
        }
      } catch (err) {
        console.warn("Failed to generate PDF thumbnail:", err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    generateThumbnail();

    return () => {
      cancel = true;
      isMounted = false;
    };
  }, [isVisible, driveUrl, dataUrl]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-[16/10] overflow-hidden bg-slate-50 dark:bg-[#07110c] border-b border-slate-200/80 dark:border-white/10 ${className}`}
    >
      {/* 1. Loaded PDF Thumbnail (Top Kop / Header) */}
      {dataUrl && !error && (
        <div className="w-full h-full relative overflow-hidden bg-white">
          <img
            src={dataUrl}
            alt={title || "PDF Cover"}
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
          {/* Subtle paper finish sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      {/* 2. Loading State (Academic Paper Skeleton Header) */}
      {loading && !dataUrl && !error && (
        <div className="w-full h-full bg-white dark:bg-[#0b1612] p-4 flex flex-col justify-between animate-pulse">
          {/* Mock Journal Kop Bar */}
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
            <div className="h-2 w-16 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-2 w-10 bg-slate-200 dark:bg-white/10 rounded" />
          </div>
          {/* Mock Title lines */}
          <div className="space-y-2 my-auto">
            <div className="h-3 w-4/5 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-3 w-3/5 bg-slate-200 dark:bg-white/10 rounded" />
            <div className="h-2 w-2/5 bg-slate-100 dark:bg-white/5 rounded mt-3" />
          </div>
          {/* Loading indicator bottom */}
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-600/70 dark:text-emerald-400/70 font-semibold tracking-wider uppercase">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Memuat Cover Dokumen...</span>
          </div>
        </div>
      )}

      {/* 3. Fallback Header (When error or non-PDF) */}
      {error && !dataUrl && (
        <div className="w-full h-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-[#091510] dark:to-[#040907] p-4 flex flex-col justify-between border-b border-slate-200 dark:border-white/5">
          <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-white/10 pb-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              {categoryName || "Academic Journal"}
            </span>
            {year && (
              <span className="text-[9px] font-bold text-slate-400 dark:text-white/40">
                {year}
              </span>
            )}
          </div>
          <div className="my-auto py-1">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">
              {title}
            </p>
            {author && (
              <p className="text-[10px] text-slate-500 dark:text-white/40 truncate mt-1">
                {author}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-[9px] font-medium text-slate-400 dark:text-white/30">
            <span>SRE Literature Bank Archive</span>
          </div>
        </div>
      )}
    </div>
  );
}
