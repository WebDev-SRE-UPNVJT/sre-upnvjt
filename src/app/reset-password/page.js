"use client";
import React, { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  ShieldCheck,
  KeyRound,
  Check,
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageProvider";
import { useTheme } from "next-themes";

export const dynamic = "force-dynamic";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, language } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const token = searchParams.get("token");

  // States
  const [tokenStatus, setTokenStatus] = useState("checking"); // "checking" | "valid" | "invalid"
  const [tokenError, setTokenError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // null | "success" | "error"
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenStatus("invalid");
      setTokenError(
        language === "en"
          ? "No reset token found in URL."
          : "Token reset tidak ditemukan."
      );
      return;
    }

    fetch(`/api/auth/reset-password?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.valid) {
          setTokenStatus("valid");
        } else {
          setTokenStatus("invalid");
          setTokenError(data.error || (language === "en" ? "Invalid or expired link." : "Link tidak valid atau kadaluwarsa."));
        }
      })
      .catch(() => {
        setTokenStatus("invalid");
        setTokenError(language === "en" ? "Failed to validate link. Please try again." : "Gagal memvalidasi link. Silakan coba lagi.");
      });
  }, [token, language]);

  // Password strength indicator
  const getPasswordStrength = useCallback((pwd) => {
    if (!pwd) return { level: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { level: 1, label: language === "en" ? "Weak" : "Lemah", color: "#f87171" };
    if (score <= 3) return { level: 2, label: language === "en" ? "Medium" : "Sedang", color: "#facc15" };
    return { level: 3, label: language === "en" ? "Strong" : "Kuat", color: "#4ade80" };
  }, [language]);

  const strength = getPasswordStrength(newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError("");

    if (newPassword.length < 8) {
      setSubmitError(
        language === "en"
          ? "Password must be at least 8 characters."
          : "Password minimal 8 karakter."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError(
        language === "en"
          ? "Passwords do not match."
          : "Konfirmasi password tidak sesuai."
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await res.json();

      if (data.success) {
        setSubmitStatus("success");
      } else {
        setSubmitError(data.error || (language === "en" ? "An error occurred. Please try again." : "Terjadi kesalahan. Silakan coba lagi."));
        setSubmitStatus("error");
      }
    } catch {
      setSubmitError(language === "en" ? "Failed to connect to server." : "Gagal terhubung ke server.");
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex flex-col justify-between items-center bg-[#0bb37e] dark:bg-[#0a1c15] text-white transition-colors duration-500 relative select-none">
      {/* Dynamic Background Glows & Overlay */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-yellow-300/15 dark:bg-emerald-600/10 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-400/20 dark:bg-emerald-500/10 rounded-full blur-[160px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white/5 dark:bg-emerald-500/5 rounded-full blur-[180px]" />
        
        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Top Floating Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between relative z-20 shrink-0">
        <Link href="/">
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/images/logo.webp"
              alt="SRE Logo"
              className="h-9 w-auto object-contain transition-transform group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
            />
          </motion.div>
        </Link>

        <button
          onClick={() => router.push("/login")}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 dark:bg-white/5 dark:border-white/10 dark:hover:bg-white/10 transition-all duration-300 text-xs font-bold text-white hover:text-white cursor-pointer backdrop-blur-md shadow-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform text-yellow-300 dark:text-emerald-400" />
          <span>{language === "en" ? "Back to Login" : "Kembali ke Login"}</span>
        </button>
      </header>

      {/* Main Centered Content */}
      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10 min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] bg-[#099669]/75 dark:bg-[#091b15]/90 border border-white/20 dark:border-emerald-500/20 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-black/30 dark:shadow-black/60 relative overflow-hidden text-white"
        >
          {/* Top card ambient line highlight */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-yellow-300/50 dark:via-emerald-400/50 to-transparent" />

          {/* --- CHECKING STATE --- */}
          {tokenStatus === "checking" && (
            <div className="flex flex-col items-center justify-center py-10 gap-5 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-yellow-300/20 dark:bg-emerald-500/10 border border-yellow-300/40 dark:border-emerald-500/30 flex items-center justify-center">
                  <KeyRound className="w-8 h-8 text-yellow-300 dark:text-emerald-400 animate-pulse" />
                </div>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-[-4px] rounded-2xl border-2 border-yellow-300/50 dark:border-emerald-400/40 border-t-transparent pointer-events-none"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  {language === "en" ? "Validating Link..." : "Memvalidasi Link..."}
                </h3>
                <p className="text-white/70 dark:text-white/60 text-xs">
                  {language === "en"
                    ? "Please wait while we verify your password reset token."
                    : "Mohon tunggu sebentar, kami sedang memverifikasi token reset password Anda."}
                </p>
              </div>
            </div>
          )}

          {/* --- INVALID TOKEN STATE --- */}
          {tokenStatus === "invalid" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center py-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400/40 flex items-center justify-center mb-5 shadow-lg">
                <XCircle className="w-8 h-8 text-red-300" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === "en" ? "Link Expired or Invalid" : "Link Tidak Valid"}
              </h2>
              <p className="text-white/75 text-xs leading-relaxed max-w-xs mb-7">
                {tokenError}
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-yellow-300 dark:bg-[#e8ecc4] hover:bg-yellow-200 dark:hover:bg-white text-[#0a1c15] font-extrabold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg active:scale-[0.98]"
              >
                <ArrowLeft className="w-4 h-4" />
                {language === "en" ? "Return to Login" : "Kembali ke Halaman Login"}
              </Link>
            </motion.div>
          )}

          {/* --- SUCCESS STATE --- */}
          {submitStatus === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center text-center py-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 220, damping: 15 }}
                className="w-16 h-16 rounded-2xl bg-emerald-400/25 border border-emerald-300/50 flex items-center justify-center mb-5 shadow-lg"
              >
                <CheckCircle2 className="w-9 h-9 text-emerald-300" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {language === "en" ? "Password Reset Complete!" : "Password Berhasil Direset!"}
              </h2>
              <p className="text-white/75 text-xs leading-relaxed max-w-xs mb-7">
                {language === "en"
                  ? "Your account password has been updated successfully. You can now sign in with your new credentials."
                  : "Password Anda telah berhasil diperbarui. Silakan masuk menggunakan password baru Anda."}
              </p>
              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 bg-yellow-300 dark:bg-[#e8ecc4] hover:bg-yellow-200 dark:hover:bg-white text-[#0a1c15] font-extrabold px-6 py-3.5 rounded-2xl text-xs uppercase tracking-wider transition-all duration-300 shadow-lg active:scale-[0.98]"
              >
                <ShieldCheck className="w-4 h-4" />
                {language === "en" ? "Sign In Now" : "Masuk Sekarang"}
              </Link>
            </motion.div>
          )}

          {/* --- VALID TOKEN FORM --- */}
          {tokenStatus === "valid" && submitStatus !== "success" && (
            <div>
              {/* Form Icon & Header */}
              <div className="flex flex-col items-center text-center mb-9">
                <div className="w-12 h-12 rounded-2xl bg-yellow-300/20 dark:bg-emerald-500/15 border border-yellow-300/30 dark:border-emerald-400/30 flex items-center justify-center mb-3 shadow-md">
                  <Lock className="w-6 h-6 text-yellow-300 dark:text-emerald-400" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
                  {language === "en" ? "Set New Password" : "Buat Password Baru"}
                </h1>
                <p className="text-white/75 dark:text-white/60 text-xs sm:text-sm leading-relaxed max-w-xs">
                  {language === "en"
                    ? "Enter a secure new password for your SRE UPNVJT account."
                    : "Masukkan password baru yang kuat untuk akun SRE UPNVJT Anda."}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="block text-xs font-semibold text-white/90"
                  >
                    {language === "en" ? "New Password" : "Password Baru"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      id="newPassword"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={language === "en" ? "Min. 8 characters" : "Minimal 8 karakter"}
                      className="w-full px-4 py-3 bg-black/15 dark:bg-black/30 border border-white/25 dark:border-white/15 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-yellow-300 dark:focus:border-[#e8ecc4] focus:ring-1 focus:ring-yellow-300/50 dark:focus:ring-[#e8ecc4]/50 transition-all pr-11"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password strength bar */}
                  {newPassword && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="pt-1 space-y-1"
                    >
                      <div className="flex gap-1.5">
                        {[1, 2, 3].map((bar) => (
                          <div
                            key={bar}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor:
                                strength.level >= bar ? strength.color : "rgba(255,255,255,0.2)",
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-white/60">
                          {language === "en" ? "Password strength" : "Kekuatan password"}
                        </span>
                        <span className="font-semibold" style={{ color: strength.color }}>
                          {strength.label}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-white/90"
                  >
                    {language === "en" ? "Confirm Password" : "Konfirmasi Password"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === "en" ? "Re-enter new password" : "Ulangi password baru"}
                      className="w-full px-4 py-3 bg-black/15 dark:bg-black/30 border border-white/25 dark:border-white/15 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:border-yellow-300 dark:focus:border-[#e8ecc4] focus:ring-1 focus:ring-yellow-300/50 dark:focus:ring-[#e8ecc4]/50 transition-all pr-11"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password match feedback */}
                  {confirmPassword && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-1.5 pt-0.5 text-[11px]"
                    >
                      {newPassword === confirmPassword ? (
                        <span className="text-yellow-300 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          {language === "en" ? "Passwords match" : "Password sesuai"}
                        </span>
                      ) : (
                        <span className="text-red-300 flex items-center gap-1 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          {language === "en" ? "Passwords do not match" : "Password tidak sesuai"}
                        </span>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Error Banner */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs text-center font-medium"
                  >
                    {submitError}
                  </motion.div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-300 dark:bg-[#e8ecc4] hover:bg-yellow-200 dark:hover:bg-white text-[#0a1c15] font-black py-3.5 px-6 rounded-xl text-xs uppercase tracking-wider transition-all duration-300 shadow-xl shadow-yellow-500/10 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer mt-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#0a1c15]" />
                      <span>{language === "en" ? "Updating Password..." : "Memperbarui Password..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{language === "en" ? "Save New Password" : "Simpan Password Baru"}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Bottom login link */}
              <div className="mt-7 text-center text-xs text-white/70">
                {language === "en" ? "Remembered your password?" : "Sudah ingat password Anda?"}{" "}
                <Link
                  href="/login"
                  className="text-yellow-300 dark:text-[#e8ecc4] hover:text-white font-bold underline underline-offset-4 transition-colors"
                >
                  {language === "en" ? "Sign In" : "Masuk"}
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full py-4 text-center text-[11px] text-white/70 relative z-20 shrink-0">
        <p>© {new Date().getFullYear()} SRE UPN Veteran Jawa Timur. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen flex items-center justify-center bg-[#0bb37e] dark:bg-[#0a1c15] text-white">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-300" />
        </div>
      }
    >
      <ResetPasswordFormContent />
    </Suspense>
  );
}
