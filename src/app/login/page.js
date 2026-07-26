"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const router = useRouter();
  const { language, t } = useLanguage();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { data: session, status } = useSession();
  const [isPublicRegistrationEnabled, setIsPublicRegistrationEnabled] =
    useState(false);

  React.useEffect(() => {
    if (status === "authenticated") {
      const role = session?.user?.roleName;
      if (role === "MEMBER") {
        router.push("/member");
      } else if (role === "STAFF") {
        router.push("/staff");
      } else {
        router.push("/dashboard");
      }
    }
  }, [status, session, router]);

  React.useEffect(() => {
    fetch("/api/settings/system")
      .then((res) => res.json())
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

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#0a1c15] text-white overflow-hidden relative">
      {/* Back Button */}
      <div className="absolute top-8 right-8 z-50">
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-[13px] font-bold text-white/70 hover:text-white cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          {t("visitor.login.back")}
        </button>
      </div>
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between p-12 lg:p-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <video
            src="/video/hero.mp4"
            autoPlay
            loop
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-[#0a2e24] opacity-80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1c15] via-transparent to-[#0a1c15]/50" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full">
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

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 md:p-20 relative z-10">
        <div className="absolute top-8 left-8 lg:hidden">
          <Link href="/">
            <div className="inline-flex items-center cursor-pointer">
              <img
                src="/images/logo.png"
                alt="SRE Logo"
                className="h-8 w-auto object-contain"
              />
            </div>
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-12">
            <h1 className="text-[32px] md:text-[40px] font-display font-bold tracking-tight mb-2">
              {t("visitor.login.title")}
            </h1>
            <p className="text-white/50 text-[14px]">
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
                className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors"
                required
              />
              <label
                htmlFor="email"
                className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
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
                className="block w-full px-0 py-3 text-white bg-transparent border-0 border-b-2 border-white/20 appearance-none focus:outline-none focus:ring-0 focus:border-[#e8ecc4] peer transition-colors pr-10"
                required
              />
              <label
                htmlFor="password"
                className="absolute text-[15px] text-white/50 duration-300 transform -translate-y-6 scale-75 top-3 -z-10 origin-[0] peer-focus:left-0 peer-focus:text-[#e8ecc4] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-6"
              >
                {t("visitor.login.password_label")}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-3 text-white/40 hover:text-white transition-colors"
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
                    className="peer appearance-none w-4 h-4 border border-white/30 rounded-[3px] checked:bg-[#e8ecc4] checked:border-[#e8ecc4] transition-colors cursor-pointer"
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
                <span className="text-[13px] text-white/60 group-hover:text-white transition-colors select-none">
                  {t("visitor.login.remember_me")}
                </span>
              </label>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm px-4 py-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex items-center justify-center gap-3 bg-[#e8ecc4] text-[#0a1c15] text-[15px] font-bold tracking-widest uppercase rounded-full px-8 py-4 mt-4 overflow-hidden transition-transform active:scale-95 hover:bg-white disabled:opacity-70 disabled:active:scale-100"
            >
              {isLoading ? t("visitor.login.btn_logging_in") : t("visitor.login.btn_login")}
              {!isLoading && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {isPublicRegistrationEnabled && (
            <div className="mt-10 text-center text-[13px] text-white/50">
              {t("visitor.login.no_account")}{" "}
              <Link
                href="/register"
                className="text-[#e8ecc4] hover:text-white transition-colors font-bold tracking-wide"
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
