"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import html2canvas from "html2canvas";
import {
  Download, Share2, Copy, Check, X, ExternalLink,
  Sun, Moon
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
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [cardTheme, setCardTheme] = useState("light"); // "light" | "dark"

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

  // Generate Image from Card using html2canvas with oklab/oklch sanitization
  const generateCanvasImage = async () => {
    if (!cardRef.current) return null;
    setIsGenerating(true);

    try {
      if (typeof document !== "undefined" && document.fonts) {
        await document.fonts.ready;
      }

      const canvas = await html2canvas(cardRef.current, {
        scale: 3, // Ultra-sharp 3x resolution for Instagram stories
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardTheme === "dark" ? "#09090b" : "#ffffff",
        logging: false,
        imageTimeout: 10000,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById("tts-share-portrait-card");
          if (el) {
            el.style.transform = "none";
            el.style.maxWidth = "440px";
            el.style.width = "440px";

            // Sanitize all inline styles in cloned subtree to prevent oklab/oklch parser crashes
            const allElements = el.querySelectorAll("*");
            allElements.forEach((node) => {
              if (node instanceof HTMLElement) {
                const computed = window.getComputedStyle(node);
                if (computed.color && (computed.color.includes("okl") || computed.color.includes("var("))) {
                  node.style.color = cardTheme === "dark" ? "#fafafa" : "#18181b";
                }
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
        const file = new File([blob], `TTS-SRE.png`, { type: "image/png" });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Teka-Teki Silang: ${title}`,
            text: `Saya baru saja menyelesaikan teka-teki silang "${title}" di SRE UPN Veteran Jawa Timur! 🌿⚡`,
            files: [file],
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } else if (navigator.share) {
          await navigator.share({
            title: `Teka-Teki Silang: ${title}`,
            text: `Saya baru saja menyelesaikan teka-teki silang "${title}" di SRE UPN Veteran Jawa Timur! 🌿⚡`,
            url: window.location.href,
          });
          setShareSuccess(true);
          setTimeout(() => setShareSuccess(false), 3000);
        } else {
          handleDownloadImage();
        }
      }, "image/png");
    } catch (e) {
      console.error("Share failed:", e);
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
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (err) {
          handleDownloadImage();
        }
      }, "image/png");
    } catch (e) {
      console.error("Copy failed:", e);
    }
  };

  // WhatsApp Share Text Link
  const shareToWhatsApp = () => {
    const text = encodeURIComponent(
      `🧩 *Teka-Teki Silang SRE UPNVJT Selesai!*\n\n` +
      `*Judul:* ${title}\n` +
      `*Waktu:* ${formatTime(stats.elapsedTime)}\n` +
      `*Akurasi:* ${stats.score}%\n\n` +
      `Coba tantangan energi terbarukan di portal SRE UPN Veteran Jawa Timur: ${window.location.href}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  // Twitter/X Share
  const shareToTwitter = () => {
    const text = encodeURIComponent(
      `Menyelesaikan Teka-Teki Silang "${title}" di @SRE_UPNVJT dalam ${formatTime(stats.elapsedTime)}! 🧩⚡\n#SREUPNVJT #RenewableEnergy`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  if (!isOpen) return null;

  const isDark = cardTheme === "dark";

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl text-zinc-100 overflow-hidden my-auto flex flex-col max-h-[94vh]"
        >
          {/* MODAL HEADER */}
          <div className="flex items-center justify-between px-5 sm:px-7 py-4 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md shrink-0">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-100">
                Bagikan Hasil Teka-Teki Silang
              </h3>
              <p className="text-xs text-zinc-400">
                Format Story 9:16 untuk Instagram, WhatsApp Status, dan media sosial.
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
            <div className="lg:col-span-7 flex flex-col items-center gap-3 w-full">
              {/* THEME TOGGLE */}
              <div className="flex items-center p-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setCardTheme("light")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    !isDark
                      ? "bg-white text-zinc-900 font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Tema Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCardTheme("dark")}
                  className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all cursor-pointer ${
                    isDark
                      ? "bg-zinc-800 text-white font-bold shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Tema Gelap</span>
                </button>
              </div>

              {/* CARD PREVIEW CONTAINER */}
              <div className="w-full max-w-[400px] rounded-2xl p-2 border border-zinc-800 bg-zinc-900/50 flex justify-center shadow-lg">
                {/* 
                  =======================================================
                  EDITORIAL MINIMALIST PORTRAIT CARD (HTML2CANVAS SAFE)
                  Clean typography, authentic layout, zero AI slop
                  =======================================================
                */}
                <div
                  ref={cardRef}
                  id="tts-share-portrait-card"
                  style={{
                    backgroundColor: isDark ? "#09090b" : "#ffffff",
                    color: isDark ? "#f4f4f5" : "#18181b",
                    border: isDark ? "1px solid #27272a" : "1px solid #e4e4e7",
                    fontFamily: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
                  }}
                  className="w-full rounded-xl p-5 sm:p-6 space-y-4 text-left"
                >
                  {/* 1. TOP HEADER: LOGO & ORGANIZATION */}
                  <div
                    style={{
                      borderColor: isDark ? "#27272a" : "#f4f4f5",
                    }}
                    className="flex items-center justify-between pb-3 border-b"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Clean Logo Capsule */}
                      <div
                        style={{
                          backgroundColor: isDark ? "#18181b" : "#047857",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/logo.png"
                          alt="SRE Logo"
                          style={{
                            height: "16px",
                            width: "auto",
                            objectFit: "contain",
                            display: "block",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "/images/logo.webp";
                          }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            color: isDark ? "#f4f4f5" : "#047857",
                            letterSpacing: "0.06em",
                          }}
                          className="text-[10px] font-black uppercase tracking-wider leading-none"
                        >
                          SRE UPNVJT
                        </div>
                        <div
                          style={{
                            color: isDark ? "#a1a1aa" : "#71717a",
                            letterSpacing: "0.08em",
                          }}
                          className="text-[7.5px] uppercase font-semibold mt-0.5 tracking-wider"
                        >
                          Teka-Teki Silang
                        </div>
                      </div>
                    </div>

                    <div
                      style={{
                        color: isDark ? "#a1a1aa" : "#71717a",
                        backgroundColor: isDark ? "#18181b" : "#f4f4f5",
                        borderColor: isDark ? "#27272a" : "#e4e4e7",
                      }}
                      className="px-2.5 py-1 rounded-md border text-[8px] font-bold uppercase tracking-wider"
                    >
                      Selesai
                    </div>
                  </div>

                  {/* 2. TITLE & BYLINE */}
                  <div className="space-y-1">
                    <h2
                      style={{ color: isDark ? "#fafafa" : "#09090b" }}
                      className="text-lg font-black tracking-tight leading-tight"
                    >
                      {title}
                    </h2>
                    <p
                      style={{ color: isDark ? "#a1a1aa" : "#71717a" }}
                      className="text-[11px] font-medium"
                    >
                      Diselesaikan oleh <strong style={{ color: isDark ? "#fafafa" : "#18181b" }}>{playerName}</strong>
                    </p>
                  </div>

                  {/* 3. HERO CROSSWORD BOARD */}
                  <div
                    style={{
                      backgroundColor: isDark ? "#18181b" : "#f8fafc",
                      borderColor: isDark ? "#27272a" : "#e2e8f0",
                    }}
                    className="p-3.5 rounded-xl border flex justify-center items-center"
                  >
                    {crosswordData?.grid && crosswordData.grid.length > 0 ? (
                      <div
                        className="grid gap-[3px] select-none mx-auto"
                        style={{
                          gridTemplateColumns: `repeat(${crosswordData.cols}, minmax(0, 1fr))`,
                          width: "100%",
                          maxWidth: "260px",
                        }}
                      >
                        {crosswordData.grid.map((row, rIdx) =>
                          row.map((cell, cIdx) => {
                            const cellKey = `${rIdx},${cIdx}`;
                            const isLetterCell = Boolean(cell && cell.char);
                            const answeredChar = userInputs[cellKey] || cell?.char || "";

                            if (!isLetterCell) {
                              return (
                                <div
                                  key={cellKey}
                                  className="aspect-square w-full opacity-0 pointer-events-none"
                                />
                              );
                            }

                            return (
                              <div
                                key={cellKey}
                                style={{
                                  backgroundColor: isDark ? "#27272a" : "#ffffff",
                                  border: isDark ? "1px solid #3f3f46" : "1px solid #cbd5e1",
                                  color: isDark ? "#fafafa" : "#0f172a",
                                }}
                                className="relative aspect-square w-full rounded-[3px] flex items-center justify-center font-mono font-black text-[10px] sm:text-[11px] shadow-sm"
                              >
                                {cell.number && (
                                  <span
                                    style={{ color: isDark ? "#a1a1aa" : "#64748b" }}
                                    className="absolute top-0.5 left-0.5 text-[5px] font-bold leading-none"
                                  >
                                    {cell.number}
                                  </span>
                                )}
                                <span className="mt-0.5 font-black">
                                  {answeredChar}
                                </span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-xs text-zinc-400">Papan Teka-Teki Silang</div>
                    )}
                  </div>

                  {/* 4. CLEAN DATA METRICS STRIP */}
                  <div
                    style={{
                      borderColor: isDark ? "#27272a" : "#f4f4f5",
                    }}
                    className="pt-2 border-t"
                  >
                    <div className="grid grid-cols-3 text-center divide-x divide-zinc-200 dark:divide-zinc-800">
                      <div className="px-1">
                        <span
                          style={{ color: isDark ? "#71717a" : "#a1a1aa" }}
                          className="text-[7.5px] font-bold uppercase tracking-wider block"
                        >
                          Waktu
                        </span>
                        <span
                          style={{ color: isDark ? "#fafafa" : "#09090b" }}
                          className="text-xs font-black block mt-0.5"
                        >
                          {formatTime(stats.elapsedTime)}
                        </span>
                      </div>
                      <div className="px-1">
                        <span
                          style={{ color: isDark ? "#71717a" : "#a1a1aa" }}
                          className="text-[7.5px] font-bold uppercase tracking-wider block"
                        >
                          Akurasi
                        </span>
                        <span
                          style={{ color: isDark ? "#34d399" : "#047857" }}
                          className="text-xs font-black block mt-0.5"
                        >
                          {stats.score}%
                        </span>
                      </div>
                      <div className="px-1">
                        <span
                          style={{ color: isDark ? "#71717a" : "#a1a1aa" }}
                          className="text-[7.5px] font-bold uppercase tracking-wider block"
                        >
                          Total Kata
                        </span>
                        <span
                          style={{ color: isDark ? "#fafafa" : "#09090b" }}
                          className="text-xs font-black block mt-0.5"
                        >
                          {totalWords} Kata
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5. FOOTER */}
                  <div
                    style={{
                      borderColor: isDark ? "#27272a" : "#f4f4f5",
                    }}
                    className="pt-2.5 border-t flex items-center justify-between text-[8px]"
                  >
                    <span
                      style={{ color: isDark ? "#71717a" : "#71717a" }}
                      className="font-medium"
                    >
                      Society of Renewable Energy
                    </span>
                    <span
                      style={{ color: isDark ? "#a1a1aa" : "#047857" }}
                      className="font-mono font-bold"
                    >
                      sre-upnvjt.org
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: ACTION BUTTONS */}
            <div className="lg:col-span-5 space-y-4 text-left">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h4 className="text-sm font-bold text-zinc-100">
                  Unduh & Bagikan
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Simpan gambar kartu hasil pengerjaan teka-teki silang dalam resolusi tinggi atau bagikan langsung ke media sosial.
                </p>

                {/* PRIMARY ACTIONS */}
                <div className="space-y-2.5 pt-2">
                  {/* DOWNLOAD PNG BUTTON */}
                  <button
                    type="button"
                    onClick={handleDownloadImage}
                    disabled={isGenerating}
                    className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50 shadow-md"
                  >
                    {isGenerating ? (
                      <span>Memproses Gambar...</span>
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

                  {/* NATIVE WEB SHARE */}
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{shareSuccess ? "Berhasil Dibagikan!" : "Bagikan (Story / Status)"}</span>
                  </button>

                  {/* COPY IMAGE TO CLIPBOARD */}
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Gambar Disalin ke Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Gambar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* QUICK CHANNELS */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 space-y-2.5">
                <span className="text-[11px] font-semibold text-zinc-400 block">
                  Bagikan Tautan Cepat
                </span>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={shareToWhatsApp}
                    className="py-2.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>WhatsApp</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
                  </button>

                  <button
                    type="button"
                    onClick={shareToTwitter}
                    className="py-2.5 px-3 rounded-lg bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  >
                    <span>Twitter / X</span>
                    <ExternalLink className="w-3 h-3 text-zinc-400" />
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
