"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck, Zap, Sparkles, Lock } from "lucide-react";
import { signIn, getSession, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "next-themes";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const { data: session, status } = useSession();
  const [isPublicRegistrationEnabled, setIsPublicRegistrationEnabled] =
    useState(false);

  const loginStages = [
    {
      id: "auth",
      icon: ShieldCheck,
      textId: "Memverifikasi Kredensial...",
      textEn: "Verifying Credentials...",
      badge: "01/03",
      pct: 35,
    },
    {
      id: "sync",
      icon: Zap,
      textId: "Sinkronisasi Sesi Akun...",
      textEn: "Synchronizing Session...",
      badge: "02/03",
      pct: 72,
    },
    {
      id: "portal",
      icon: Sparkles,
      textId: "Mempersiapkan Portal...",
      textEn: "Preparing Portal...",
      badge: "03/03",
      pct: 96,
    },
  ];

  React.useEffect(() => {
    let interval;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => Math.min(prev + 1, loginStages.length - 1));
      }, 1100);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && (theme === "light" || resolvedTheme === "light");

  // If already authenticated on initial page load, redirect to appropriate role dashboard
  React.useEffect(() => {
    if (status === "authenticated" && !isLoading) {
      const role = session?.user?.roleName;
      if (role === "MEMBER") {
        window.location.href = "/member";
      } else if (role === "STAFF") {
        window.location.href = "/officer";
      } else {
        window.location.href = "/dashboard";
      }
    }
  }, [status, session, isLoading]);

  React.useEffect(() => {
    fetch("/api/settings/system")
      .then((res) => {
        if (!res.ok) return null;
        const ct = res.headers.get("content-type");
        if (ct && ct.includes("application/json")) return res.json();
        return null;
      })
      .then((data) => {
        if (data && data.ENABLE_PUBLIC_REGISTRATION === "true") {
          setIsPublicRegistrationEnabled(true);
        }
      })
      .catch((err) => console.error("Failed to fetch system settings", err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error);
        setIsLoading(false);
        return;
      }

      // Fetch the updated session directly to know the exact role immediately
      const sessionData = await getSession();
      const role = sessionData?.user?.roleName;

      let destination = "/dashboard";
      if (role === "MEMBER") {
        destination = "/member";
      } else if (role === "STAFF") {
        destination = "/officer";
      }

      // Using window.location.href ensures clean cookie transfer & bypasses client router lag on Vercel
      window.location.href = destination;
    } catch (err) {
      console.error("Login redirect error:", err);
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0bb37e] dark:bg-[#0a1c15] text-white transition-colors duration-500 overflow-hidden relative">
      {/* Back Button */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-all duration-300 text-[13px] font-bold text-white/90 dark:text-white/70 hover:text-white cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("visitor.login.back")}
        </button>
      </div>
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero/gambar2.jpg"
            alt="SRE Background"
            className="w-full h-full object-cover"
          />
          {isLight ? (
            <div
              className="absolute inset-0 bg-black/45 z-0 pointer-events-none"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.45)" }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[#0a2e24] opacity-80 mix-blend-multiply" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1c15] via-transparent to-[#0a1c15]/50" />
            </>
          )}
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-flex items-center cursor-pointer"
            >
              <img
                src="/images/logo.png"
                alt="SRE Logo"
                className="h-10 w-auto object-contain"
              />
            </motion.div>
          </Link>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h2 className="text-[48px] xl:text-[64px] font-display font-black uppercase tracking-tighter leading-[0.9] mb-6">
                {t("visitor.login.welcome")} <br />
                <span className="text-[#e8ecc4] font-serif italic font-normal text-[36px] xl:text-[48px] lowercase tracking-normal">
                  {t("visitor.login.to_the")}
                </span>{" "}
                <br />
                {t("visitor.login.future")}
              </h2>
              <p className="text-white/70 max-w-sm text-[15px] leading-relaxed font-light">
                {t("visitor.login.left_desc")}
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-20 relative z-10 bg-[#0bb37e] dark:bg-[#0a1c15] transition-colors duration-500">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-yellow-300/10 dark:bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/">
            <div className="inline-flex items-center cursor-pointer">
              <img
                src="/images/logo.png"
                alt="SRE Logo"
                className="h-7 w-auto object-contain brightness-0 invert opacity-90 transition-all duration-300"
              />
            </div>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="mb-12">
            <h1 className="text-[32px] md:text-[40px] font-display font-bold tracking-tight mb-2 text-white">
              {t("visitor.login.title")}
            </h1>
            <p className="text-white/75 dark:text-white/50 text-[14px]">
              {t("visitor.login.subtitle")}
            </p>
          </div>

          <form className="flex flex-col gap-8" onSubmit={handleLogin}>
            <div className="relative group">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder=" "
                className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/30 dark:border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-300 dark:focus:border-[#e8ecc4] peer transition-colors"
                required
              />
              <label
                htmlFor="email"
                className="absolute text-[15px] text-white/70 dark:text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-300 dark:peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                {t("visitor.login.email_label")}
              </label>
            </div>

            <div className="relative group">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=" "
                className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/30 dark:border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-yellow-300 dark:focus:border-[#e8ecc4] peer transition-colors pr-10"
                required
              />
              <label
                htmlFor="password"
                className="absolute text-[15px] text-white/70 dark:text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-yellow-300 dark:peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                {t("visitor.login.password_label")}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-3 text-white/60 dark:text-white/40 hover:text-white transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center w-4 h-4">
                  <input
                    type="checkbox"
                    className="peer appearance-none w-4 h-4 border border-white/40 dark:border-white/30 rounded-[3px] checked:bg-yellow-300 dark:checked:bg-[#e8ecc4] checked:border-yellow-300 dark:checked:border-[#e8ecc4] transition-colors cursor-pointer"
                  />
                  <svg
                    className="absolute w-3 h-3 text-[#0a1c15] opacity-0 peer-checked:opacity-100 pointer-events-none"
                    viewBox="0 0 14 14"
                    fill="none"
                  >
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className="text-[13px] text-white/80 dark:text-white/60 group-hover:text-white transition-colors select-none">
                  {t("visitor.login.remember_me")}
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-500/40 text-red-700 dark:text-red-400 text-sm px-4 py-3 rounded-lg text-center font-medium shadow-md">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3.5 mt-4">
              <div className="relative group/btn">
                {/* Outer Cyber Shockwave Ring on Loading */}
                {isLoading && (
                  <motion.div
                    animate={{
                      scale: [1, 1.04, 1],
                      opacity: [0.5, 0.9, 0.5],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: "easeInOut",
                    }}
                    className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-400 opacity-70 blur-md pointer-events-none"
                  />
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex items-center justify-center text-[14px] sm:text-[15px] font-black tracking-widest uppercase rounded-full px-8 py-4 overflow-hidden transition-all duration-300 shadow-xl ${
                    isLoading
                      ? "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 text-slate-950 shadow-[0_0_35px_rgba(52,211,153,0.5)] cursor-wait"
                      : "bg-yellow-300 dark:bg-[#e8ecc4] text-[#0a1c15] hover:bg-yellow-200 dark:hover:bg-white active:scale-95 shadow-yellow-300/25 dark:shadow-none cursor-pointer"
                  }`}
                >
                  {/* Animated Continuous Laser Sweep Beam on Loading */}
                  {isLoading ? (
                    <>
                      <motion.div
                        initial={{ x: "-120%" }}
                        animate={{ x: "220%" }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12 pointer-events-none"
                      />
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                        className="absolute inset-0 rounded-full border-2 border-white/70 pointer-events-none"
                      />
                    </>
                  ) : (
                    /* Subtle Shimmer on Hover */
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                  )}

                  {isLoading ? (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      {/* Left Icon with morphing animation */}
                      <div className="w-7 h-7 rounded-full bg-slate-950/15 flex items-center justify-center shrink-0 border border-slate-950/20">
                        <AnimatePresence mode="wait">
                          {React.createElement(loginStages[loadingStep].icon, {
                            key: loginStages[loadingStep].id,
                            className: "w-3.5 h-3.5 text-slate-950 animate-bounce",
                          })}
                        </AnimatePresence>
                      </div>
                      
                      {/* Dynamic Step Text centered */}
                      <AnimatePresence mode="wait">
                        <motion.span
                          key={loadingStep}
                          initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                          exit={{ opacity: 0, y: -6, filter: "blur(2px)" }}
                          transition={{ duration: 0.2 }}
                          className="font-black text-slate-950 tracking-wider text-xs sm:text-sm text-center"
                        >
                          {language === "en" ? loginStages[loadingStep].textEn : loginStages[loadingStep].textId}
                        </motion.span>
                      </AnimatePresence>

                      {/* Small Stage Pill */}
                      <span className="px-2 py-0.5 rounded-full bg-slate-950/15 border border-slate-950/25 text-[9px] font-mono font-black text-slate-950 tracking-widest shrink-0">
                        {loginStages[loadingStep].badge}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 relative z-10">
                      <span className="tracking-widest">{t("visitor.login.btn_login")}</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                    </div>
                  )}
                </button>
              </div>

              {/* Cyberpunk 3-Segment Neon Progress Track */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="w-full flex flex-col gap-2 pt-1"
                  >
                    {/* 3 Illuminated Segment Pills */}
                    <div className="grid grid-cols-3 gap-2 w-full">
                      {loginStages.map((st, idx) => {
                        const isDone = loadingStep > idx;
                        const isCurrent = loadingStep === idx;
                        return (
                          <div
                            key={st.id}
                            className="h-2 rounded-full bg-white/15 dark:bg-white/10 overflow-hidden relative border border-white/10"
                          >
                            <motion.div
                              initial={{ width: "0%" }}
                              animate={{
                                width: isDone ? "100%" : isCurrent ? "100%" : "0%",
                              }}
                              transition={{
                                duration: isCurrent ? 1.1 : 0.3,
                                ease: "easeOut",
                              }}
                              className={`h-full rounded-full transition-colors ${
                                isCurrent
                                  ? "bg-gradient-to-r from-emerald-400 to-amber-300 shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                                  : isDone
                                  ? "bg-emerald-400"
                                  : "bg-transparent"
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>

                    {/* Status & Live Percent */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-white/80 dark:text-white/60 px-1">
                      <span className="flex items-center gap-1.5 font-sans text-xs">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                        {language === "en" ? "Establishing secure session..." : "Menyiapkan sesi aman..."}
                      </span>
                      <span className="font-black text-yellow-300 dark:text-emerald-400">
                        {loginStages[loadingStep].pct}%
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </form>

          {isPublicRegistrationEnabled && (
            <div className="mt-10 text-center text-[13px] text-white/70 dark:text-white/50">
              {t("visitor.login.no_account")}{" "}
              <Link
                href="/register"
                className="text-yellow-300 dark:text-[#e8ecc4] hover:text-white transition-colors font-bold tracking-wide"
              >
                {t("visitor.login.create_account")}
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
