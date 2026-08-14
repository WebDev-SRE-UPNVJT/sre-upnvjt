"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Leaf, Zap, Sun, Wind, Sprout, ShieldCheck, Globe, Star } from "lucide-react";

const InstagramIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-4 h-4"}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const LinkedinIcon = (props) => (
  <svg className={`fill-current ${props.className || "w-4 h-4"}`} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

// Floating particle dots component
const FloatingParticles = () => {
  const particles = Array.from({ length: 14 });
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
      {particles.map((_, i) => {
        const size = 3 + (i % 4) * 2;
        const left = 5 + (i * 7) % 90;
        const top = 10 + (i * 13) % 80;
        const duration = 4 + (i % 5) * 2;
        const delay = (i % 3) * 1.5;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full bg-[#34d399]/40 blur-[1px]"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: `${top}%`,
            }}
            animate={{
              y: [0, -35, 0],
              x: [0, (i % 2 === 0 ? 15 : -15), 0],
              opacity: [0.2, 0.7, 0.2],
              scale: [1, 1.3, 1],
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

export default function ComingSoonPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[999999] w-full h-full bg-[#07130e] text-white flex flex-col justify-between overflow-y-auto font-sans selection:bg-[#10b981] selection:text-[#07130e]">
      {/* Dynamic Animated Particles */}
      <FloatingParticles />

      {/* Tech Grid Pattern Background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-60 pointer-events-none -z-10" />

      {/* Multi-layered Glowing Ambient Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none opacity-45 blur-3xl -z-10 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-[#10b981]/30 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-[#e8ecc4]/20 rounded-full"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/3 w-[380px] h-[380px] bg-[#059669]/25 rounded-full"
        />
      </div>

      {/* Diagonal Texture */}
      <div className="absolute inset-0 bg-diagonal-texture opacity-40 pointer-events-none -z-10" />

      {/* ------------------------------------------------------------- */}
      {/* STANDALONE HEADER (Clean Brand Title - Single Logo in Hero) */}
      {/* ------------------------------------------------------------- */}
      <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-4 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#059669] p-[2px] shadow-lg shadow-[#10b981]/20">
            <div className="w-full h-full bg-[#07130e] rounded-[14px] flex items-center justify-center">
              <Leaf className="w-5 h-5 text-[#34d399]" />
            </div>
          </div>
          <div>
            <span className="font-display font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              SRE <span className="text-[#e8ecc4]">UPNVJT</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-[#34d399]">
              Society of Renewable Energy
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b2621]/90 border border-[#34d399]/30 text-xs font-semibold text-[#e8ecc4] backdrop-blur-md shadow-lg">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10b981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10b981]"></span>
          </span>
          <span>Official Launch Prep</span>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* MAIN HERO WITH HIGHLY ANIMATED SINGLE OFFICIAL LOGO */}
      {/* ------------------------------------------------------------- */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 flex flex-col items-center text-center z-20 my-auto">
        {/* Animated Single Official SRE Logo Showcase */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative mb-12 group"
        >
          {/* Rotating Energy Halo Ring 1 */}
          <div className="absolute -inset-6 rounded-[36px] border border-[#34d399]/30 animate-spin" style={{ animationDuration: '22s' }} />

          {/* Rotating Energy Halo Ring 2 (Reverse) */}
          <div className="absolute -inset-10 rounded-[48px] border border-dashed border-[#e8ecc4]/20 animate-spin" style={{ animationDuration: '30s', animationDirection: 'reverse' }} />

          {/* Outer Glowing Energy Glow */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-[#10b981]/30 via-[#e8ecc4]/25 to-[#34d399]/30 blur-2xl group-hover:scale-110 transition-transform duration-500" />
          
          {/* Main Logo Card */}
          <div className="relative px-8 py-6 sm:px-12 sm:py-8 rounded-3xl bg-[#1b2621]/90 border border-[#34d399]/40 backdrop-blur-2xl shadow-2xl flex flex-col items-center justify-center overflow-hidden">
            <img
              src="/images/logo.png"
              alt="SRE UPN VJT Official Logo"
              className="h-16 sm:h-24 w-auto object-contain brightness-0 invert mix-blend-screen drop-shadow-[0_0_24px_rgba(52,211,153,0.7)]"
            />
          </div>

          {/* Floating Orbiting Feature Badge Top-Left (Out of Logo Bounds) */}
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-4 -left-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b2621] border border-[#34d399]/40 text-[11px] font-semibold text-[#e8ecc4] shadow-xl backdrop-blur-md"
          >
            <Sun className="w-3.5 h-3.5 text-amber-300 animate-spin" style={{ animationDuration: '12s' }} />
            <span>Solar Innovation</span>
          </motion.div>

          {/* Floating Orbiting Feature Badge Bottom-Right (Out of Logo Bounds) */}
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-4 -right-6 z-20 hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1b2621] border border-[#34d399]/40 text-[11px] font-semibold text-[#e8ecc4] shadow-xl backdrop-blur-md"
          >
            <Wind className="w-3.5 h-3.5 text-emerald-400 animate-bounce" style={{ animationDuration: '3s' }} />
            <span>Clean Energy</span>
          </motion.div>
        </motion.div>

        {/* Pill Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#1b2621] border border-[#34d399]/30 text-[#e8ecc4] text-xs sm:text-sm font-semibold mb-8 shadow-inner backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-[#34d399] animate-spin" style={{ animationDuration: '10s' }} />
          <span>Accelerating Sustainable Energy Transition</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="font-display text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white mb-6 leading-[1.12]"
        >
          Portal Resmi <br className="hidden sm:inline" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#34d399] via-[#e8ecc4] to-[#10b981]">
            Segera Diluncurkan
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-base sm:text-lg md:text-xl text-[#b2c0b9] max-w-2xl font-normal leading-relaxed mb-6"
        >
          Website resmi <strong className="text-white font-semibold">Society of Renewable Energy UPN Veteran Jawa Timur</strong> sedang disiapkan untuk memberikan pusat informasi riset, inovasi, dan kegiatan energi terbarukan terbaik.
        </motion.p>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* STANDALONE FOOTER */}
      {/* ------------------------------------------------------------- */}
      <footer className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 border-t border-[#1b2621] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#6c8278] z-20">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#34d399]" />
          <span>© {new Date().getFullYear()} Society of Renewable Energy UPN Veteran Jawa Timur.</span>
        </div>

        <div className="flex items-center gap-6 font-medium text-[#b2c0b9]">
          <a
            href="https://www.instagram.com/sre.upnjatim/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors"
          >
            <InstagramIcon className="w-3.5 h-3.5" />
            <span>Instagram</span>
          </a>
          <a
            href="https://www.linkedin.com/company/sreupnjatim/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-[#34d399] transition-colors"
          >
            <LinkedinIcon className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
