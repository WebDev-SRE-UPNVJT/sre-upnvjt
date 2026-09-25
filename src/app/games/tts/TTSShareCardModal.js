"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Download, Share2, Copy, Check, X,
  Link2, Sparkles
} from "lucide-react";

export default function TTSShareCardModal({
  isOpen,
  onClose,
  puzzleData,
  crosswordData,
  userInputs,
  wordStatuses,
  stats = {
    elapsedTime: 0,
    mistakeCount: 0,
    xpEarned: 10,
    score: 100,
    starsEarned: 3,
  },
  currentUser,
}) {
  const cardRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [igGuide, setIgGuide] = useState(false); // Panduan post-download IG Story

  const title = puzzleData?.title || "Teka-Teki Silang";
  const playerName = currentUser?.name || currentUser?.username || "SRE Member";

  // Format Time (mm:ss)
  const formatTime = (sec) => {
    if (sec == null) return "0:00";
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const totalWords = (crosswordData?.clues?.across?.length || 0) + (crosswordData?.clues?.down?.length || 0);

  // Generate Image from Card using html2canvas with ultra HD crisp rendering
  const generateCanvasImage = async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);

    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      // Pre-wait for overlay frame image if present
      const frameImg = cardRef.current.querySelector("img");
      if (frameImg && !frameImg.complete) {
        await new Promise((resolve) => {
          frameImg.onload = resolve;
          frameImg.onerror = resolve;
        });
      }

      // 4x scale factor generates a crisp ~1480px x 2632px Full HD+ image
      const scale = Math.max((typeof window !== "undefined" && window.devicePixelRatio) || 1, 4);

      const canvas = await html2canvas(cardRef.current, {
        scale: scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.getElementById("tts-share-portrait-card");
          if (clonedCard) {
            clonedCard.style.transform = "none";
            clonedCard.style.webkitFontSmoothing = "antialiased";
            clonedCard.style.textRendering = "optimizeLegibility";
            clonedCard.style.boxSizing = "border-box";
            
            // Remove crossorigin from local relative images in clone to prevent CORS canvas tainting
            const imgs = clonedCard.querySelectorAll("img");
            imgs.forEach((img) => {
              if (img.getAttribute("src")?.startsWith("/")) {
                img.removeAttribute("crossorigin");
              }
            });
          }
        },
      });

      return canvas;
    } catch (err) {
      console.error("Error generating share card canvas:", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  // Download Image Handler
  const handleDownloadImage = async () => {
    try {
      const canvas = await generateCanvasImage();
      if (!canvas) return;

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
      link.download = `TTS-SRE-${safeTitle}.png`;
      link.href = dataUrl;
      link.click();

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Download failed:", e);
    }
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    try {
      const canvas = await generateCanvasImage();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        const file = new File([blob], `TTS-SRE-${safeTitle}.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Teka-Teki Silang: ${title}`,
              text: `Saya baru saja menyelesaikan teka-teki silang "${title}" di SRE UPN Veteran Jawa Timur! 🌿⚡`,
              files: [file],
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
          } catch (e) {
            if (e.name !== "AbortError") handleDownloadImage();
          }
        } else if (navigator.share) {
          try {
            await navigator.share({
              title: `Teka-Teki Silang: ${title}`,
              text: `Saya baru saja menyelesaikan teka-teki silang "${title}" di SRE UPN Veteran Jawa Timur! 🌿⚡`,
              url: window.location.href,
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
          } catch (e) {
            if (e.name !== "AbortError") handleDownloadImage();
          }
        } else {
          handleDownloadImage();
        }
      }, "image/png");
    } catch (e) {
      console.error("Share failed:", e);
      handleDownloadImage();
    }
  };

  // Copy Image to Clipboard
  const handleCopyImage = async () => {
    try {
      const canvas = await generateCanvasImage();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
          } else {
            handleDownloadImage();
          }
        } catch (err) {
          handleDownloadImage();
        }
      }, "image/png");
    } catch (e) {
      console.error("Copy failed:", e);
      handleDownloadImage();
    }
  };

  // Copy Link Handler
  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    }
  };

  // Deteksi apakah user di mobile (iOS/Android)
  const isMobile = () =>
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // Direct Instagram Story Share Handler
  const shareToInstagramStory = async () => {
    try {
      const canvas = await generateCanvasImage();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const safeTitle = title.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase();
        const file = new File([blob], `TTS-SRE-${safeTitle}.png`, { type: "image/png" });

        // Mobile: gunakan Web Share API — Instagram muncul langsung di share sheet
        if (isMobile() && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `TTS SRE: ${title}`,
              text: `Saya baru saja menyelesaikan TTS "${title}" di SRE UPN Veteran Jawa Timur! 🌿⚡`,
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
            return;
          } catch (e) {
            if (e.name === "AbortError") return; // user batalkan share sheet
            // jika gagal, fallthrough ke download
          }
        }

        // Desktop / fallback: auto-download + tampilkan panduan langkah
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `TTS-SRE-${safeTitle}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
        // Tampilkan panduan cara upload ke IG Story
        setIgGuide(true);
      }, "image/png");
    } catch (err) {
      console.error("Instagram Story share error:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden my-auto flex flex-col max-h-[94vh]"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Bagikan Hasil Teka-Teki Silang</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Format Story 9:16 resmi untuk Instagram, WhatsApp Status, dan media sosial.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* MAIN MODAL BODY */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: LIVE CARD PREVIEW */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center w-full">
              {/* CARD PREVIEW CONTAINER */}
              <div className="border border-zinc-800 bg-zinc-900/60 flex justify-center shadow-2xl overflow-hidden">
                {/* 
                  =======================================================
                  OFFICIAL SRE CATALYST ACADEMY STORY 9:16 POSTER FRAME
                  Fixed 370px x 658px Canvas (100% Identical in Download)
                  =======================================================
                */}
                <div
                  ref={cardRef}
                  id="tts-share-portrait-card"
                  style={{
                    width: "370px",
                    height: "658px",
                    borderRadius: "0px",
                    fontFamily: "var(--font-montserrat), 'Montserrat', 'Inter', sans-serif",
                    color: "#064e3b",
                    boxShadow: "none",
                    paddingTop: "170px",
                    paddingBottom: "115px",
                    paddingLeft: "14px",
                    paddingRight: "14px",
                    boxSizing: "border-box",
                    backgroundColor: "#ffffff",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                  className="select-none overflow-hidden shrink-0"
                >
                  {/* FOREGROUND HIGH-RES STORY POSTER FRAME (TOP LAYER OVERLAY) */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/tts_story_frame.png"
                    alt="SRE Catalyst Story Frame"
                    className="absolute inset-0 w-full h-full object-fill pointer-events-none"
                    style={{
                      display: "block",
                      width: "100%",
                      height: "100%",
                      position: "absolute",
                      inset: 0,
                      zIndex: 30,
                      pointerEvents: "none",
                    }}
                  />

                  {/* 1. HERO CROSSWORD BOARD (EXPLICIT MARGIN-BOTTOM) */}
                  <div
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      zIndex: 10,
                      marginBottom: "10px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: "#ffffff",
                        border: "2px solid #10b981",
                        borderRadius: "12px",
                        boxShadow: "0 3px 14px rgba(6,78,59,0.12)",
                        padding: "4px",
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                        boxSizing: "border-box",
                      }}
                    >
                      {crosswordData?.grid && crosswordData.grid.length > 0 ? (
                        <div
                          style={{
                            aspectRatio: `${crosswordData.cols} / ${crosswordData.rows}`,
                            height: "175px",
                            maxWidth: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="100%"
                            height="100%"
                            viewBox={`0 0 ${crosswordData.cols * 36} ${crosswordData.rows * 36}`}
                            className="w-full h-full max-w-full max-h-full select-none"
                            preserveAspectRatio="xMidYMid meet"
                          >
                            {crosswordData.grid.map((row, rIdx) =>
                              row.map((cell, cIdx) => {
                                const cellKey = `${rIdx},${cIdx}`;
                                const isLetterCell = Boolean(cell && cell.char);
                                const answeredChar = userInputs[cellKey] || cell?.char || "";

                                if (!isLetterCell) return null;

                                // Check if cell is associated with wrong or correct word
                                let isCellWrong = false;
                                if (crosswordData?.placedWords) {
                                  const associatedWords = crosswordData.placedWords.filter(
                                    (w) =>
                                      (w.direction === "ACROSS" && w.row === rIdx && cIdx >= w.col && cIdx < w.col + w.length) ||
                                      (w.direction === "DOWN" && w.col === cIdx && rIdx >= w.row && rIdx < w.row + w.length)
                                  );
                                  if (associatedWords.length > 0) {
                                    const allCorrect = associatedWords.every(
                                      (w) => wordStatuses && wordStatuses[`${w.direction}-${w.number}`] === "CORRECT"
                                    );
                                    isCellWrong = !allCorrect;
                                  }
                                }

                                return (
                                  <g key={cellKey} transform={`translate(${cIdx * 36}, ${rIdx * 36})`}>
                                    <rect
                                      x="1.5"
                                      y="1.5"
                                      width="33"
                                      height="33"
                                      rx="4"
                                      fill={isCellWrong ? "#fee2e2" : "#dcfce7"}
                                      stroke={isCellWrong ? "#ef4444" : "#059669"}
                                      strokeWidth="1.8"
                                    />
                                    {cell.number && (
                                      <text
                                        x="4"
                                        y="9.5"
                                        fontSize="8"
                                        fontWeight="900"
                                        fontFamily="sans-serif"
                                        fill={isCellWrong ? "#dc2626" : "#047857"}
                                      >
                                        {cell.number}
                                      </text>
                                    )}
                                    <text
                                      x="18"
                                      y="24.5"
                                      textAnchor="middle"
                                      fontSize="17"
                                      fontWeight="900"
                                      fontFamily="monospace"
                                      fill={isCellWrong ? "#991b1b" : "#022c22"}
                                    >
                                      {answeredChar}
                                    </text>
                                  </g>
                                );
                              })
                            )}
                          </svg>
                        </div>
                      ) : (
                        <div style={{ textAlign: "center", padding: "8px 0", fontSize: "9px", color: "#64748b", fontWeight: 500 }}>
                          Papan Teka-Teki Silang
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. CARD HASIL & DAFTAR SOAL TTS (GABUNGAN ELEGAN PROFIL + PERTANYAAN) */}
                  <div
                    style={{
                      backgroundColor: "#ffffff",
                      border: "2px solid #10b981",
                      borderRadius: "12px",
                      boxShadow: "0 2px 8px rgba(6,78,59,0.06)",
                      padding: "7px 9px",
                      display: "flex",
                      flexDirection: "column",
                      flexShrink: 0,
                      textAlign: "left",
                      width: "100%",
                      position: "relative",
                      zIndex: 10,
                      boxSizing: "border-box",
                    }}
                  >
                    {/* TOP BAR: PROFIL PEMAIN & SKOR (PURE TYPOGRAPHY - NO SVG DISTORTION) */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: "5px",
                      }}
                    >
                      <span
                        style={{
                          color: "#022c22",
                          fontSize: "9.5px",
                          fontWeight: "900",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {playerName}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        {/* Dynamic Stars */}
                        <div style={{ display: "flex", alignItems: "center", gap: "1.5px", fontSize: "10px" }}>
                          {[1, 2, 3].map((s) => {
                            const numStars =
                              typeof stats.starsEarned === "number"
                                ? stats.starsEarned
                                : stats.score >= 80
                                ? 3
                                : stats.score >= 50
                                ? 2
                                : stats.score >= 20
                                ? 1
                                : 0;
                            const isLit = s <= numStars;
                            return (
                              <span
                                key={s}
                                style={{ color: isLit ? "#f59e0b" : "#cbd5e1" }}
                                className={isLit ? "font-black" : "opacity-40"}
                              >
                                ★
                              </span>
                            );
                          })}
                        </div>
                        <span
                          style={{
                            color: stats.score >= 80 ? "#059669" : stats.score >= 50 ? "#0d9488" : "#e11d48",
                            fontSize: "9.5px",
                            fontWeight: "900",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {stats.score}% SKOR
                        </span>
                      </div>
                    </div>

                    {/* SUB-HEADER: DAFTAR PERTANYAAN */}

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        columnGap: "8px",
                        fontSize: "6.5px",
                        lineHeight: 1.3,
                      }}
                    >
                      {/* MENDATAR */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            color: "#065f46",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            fontSize: "6.5px",
                            letterSpacing: "0.05em",
                            display: "block",
                            marginBottom: "3px",
                          }}
                        >
                          Mendatar
                        </span>
                        {crosswordData.clues?.across?.map((item) => {
                          const wordKey = `ACROSS-${item.number}`;
                          const isCorrect = Boolean(wordStatuses && wordStatuses[wordKey] === "CORRECT");

                          return (
                            <div
                              key={`across-${item.number}`}
                              style={{ display: "flex", alignItems: "flex-start", gap: "3px", marginBottom: "3px" }}
                            >
                              <span
                                style={{
                                  color: isCorrect ? "#059669" : "#e11d48",
                                  fontSize: "6.8px",
                                  fontWeight: "900",
                                  flexShrink: 0,
                                  lineHeight: "1.3",
                                }}
                              >
                                {isCorrect ? "✓" : "✗"} #{item.number}.
                              </span>
                              <span
                                style={{
                                  color: isCorrect ? "#064e3b" : "#1e293b",
                                  lineHeight: "1.3",
                                  fontWeight: "600",
                                  fontSize: "6.3px",
                                  wordBreak: "break-word",
                                  flex: 1,
                                }}
                              >
                                {item.clue}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* MENURUN */}
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            color: "#115e59",
                            fontWeight: "900",
                            textTransform: "uppercase",
                            fontSize: "6.5px",
                            letterSpacing: "0.05em",
                            display: "block",
                            marginBottom: "3px",
                          }}
                        >
                          Menurun
                        </span>
                        {crosswordData.clues?.down?.map((item) => {
                          const wordKey = `DOWN-${item.number}`;
                          const isCorrect = Boolean(wordStatuses && wordStatuses[wordKey] === "CORRECT");

                          return (
                            <div
                              key={`down-${item.number}`}
                              style={{ display: "flex", alignItems: "flex-start", gap: "3px", marginBottom: "3px" }}
                            >
                              <span
                                style={{
                                  color: isCorrect ? "#059669" : "#e11d48",
                                  fontSize: "6.8px",
                                  fontWeight: "900",
                                  flexShrink: 0,
                                  lineHeight: "1.3",
                                }}
                              >
                                {isCorrect ? "✓" : "✗"} #{item.number}.
                              </span>
                              <span
                                style={{
                                  color: isCorrect ? "#064e3b" : "#1e293b",
                                  lineHeight: "1.3",
                                  fontWeight: "600",
                                  fontSize: "6.3px",
                                  wordBreak: "break-word",
                                  flex: 1,
                                }}
                              >
                                {item.clue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTION BUTTONS */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-lg">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                    <span>Unduh & Bagikan Hasil</span>
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    Simpan gambar kartu hasil pengerjaan teka-teki silang dalam resolusi tinggi atau bagikan langsung ke media sosial.
                  </p>
                </div>

                {/* PRIMARY ACTIONS */}
                <div className="space-y-2.5">
                  {/* INSTAGRAM STORY BUTTON */}
                  <button
                    type="button"
                    onClick={shareToInstagramStory}
                    disabled={isGenerating}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-95 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 shadow-lg shadow-rose-950/40 border border-rose-300/30 tracking-wide"
                  >
                    <svg
                      className="w-4 h-4 text-white drop-shadow"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                    </svg>
                    <span>Bagikan ke Instagram Story</span>
                  </button>

                  {/* PANDUAN POST-DOWNLOAD IG STORY (desktop fallback) */}
                  {igGuide && (
                    <div className="rounded-xl border border-purple-500/30 bg-purple-950/40 p-3.5 text-left space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-purple-300">📲 Cara Upload ke Instagram Story</p>
                        <button
                          onClick={() => setIgGuide(false)}
                          className="text-purple-400 hover:text-white transition-colors text-xs"
                        >✕</button>
                      </div>
                      <ol className="text-xs text-purple-200/80 space-y-1 list-none">
                        <li className="flex gap-2"><span className="text-purple-400 font-bold">1.</span><span>Gambar sudah <strong className="text-white">terunduh otomatis</strong> ke folder Downloads kamu.</span></li>
                        <li className="flex gap-2"><span className="text-purple-400 font-bold">2.</span><span>Buka aplikasi <strong className="text-white">Instagram</strong> di HP kamu.</span></li>
                        <li className="flex gap-2"><span className="text-purple-400 font-bold">3.</span><span>Tap ikon <strong className="text-white">+</strong> → pilih <strong className="text-white">Story</strong>.</span></li>
                        <li className="flex gap-2"><span className="text-purple-400 font-bold">4.</span><span>Pilih gambar <strong className="text-white">TTS-SRE-...</strong> dari galeri, lalu posting!</span></li>
                      </ol>
                    </div>
                  )}

                  {/* DOWNLOAD PNG BUTTON */}
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/40 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50 shadow-md shadow-emerald-950/30"
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Memproses Gambar...</span>
                      </span>
                    ) : downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Gambar Berhasil Diunduh!</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 stroke-[2]" />
                        <span>Download Gambar (.PNG)</span>
                      </>
                    )}
                  </button>

                  {/* NATIVE WEB SHARE (ALL SOCIAL MEDIA) */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{shareSuccess ? "Berhasil Dibagikan!" : "Opsi Berbagi Lainnya..."}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
