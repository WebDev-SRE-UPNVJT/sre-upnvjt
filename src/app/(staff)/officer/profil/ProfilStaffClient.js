"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Lock, KeyRound, CheckCircle2, X, ShieldCheck, Eye, EyeOff,
  Mail, Hash, Briefcase, Building2, Layers, Shield, Sparkles,
  Camera, Check, AlertCircle, Loader2, Save, Info, ShieldAlert,
  HelpCircle, ChevronRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/i18n/LanguageProvider";

export default function ProfilStaffClient({ user }) {
  const router = useRouter();
  const { t, language } = useLanguage();

  // Profile Information State
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    npm: user.npm || "",
    email: user.email || "",
    profilePictureUrl: user.profilePictureUrl || "",
  });

  // Password State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Password Visibility States
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Active Tab: "biodata" | "security"
  const [activeTab, setActiveTab] = useState("biodata");

  // Loading & Notification States
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Save Profile (Name & NPM)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      notify("error", t("officer_profile.err_name_empty") || "Nama lengkap tidak boleh kosong!");
      return;
    }

    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name.trim(),
          email: profileData.email,
          npm: profileData.npm.trim() || null,
          profilePictureUrl: profileData.profilePictureUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui profil.");

      notify("success", t("officer_profile.biodata_success") || "Informasi nama dan NPM berhasil disimpan!");
      router.refresh();
    } catch (err) {
      notify("error", err.message || "Terjadi kesalahan saat menyimpan profil.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Change Password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      notify("error", t("officer_profile.err_curr_pass") || "Masukkan kata sandi lama saat ini!");
      return;
    }
    if (!passwordData.newPassword) {
      notify("error", t("officer_profile.err_new_pass") || "Masukkan kata sandi baru!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      notify("error", t("officer_profile.err_pass_length") || "Kata sandi baru minimal 6 karakter!");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify("error", t("officer_profile.err_pass_match") || "Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setIsSavingPassword(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengganti kata sandi.");
      
      notify("success", t("officer_profile.password_success") || "Kata sandi akun berhasil diperbarui!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.refresh();
    } catch (err) {
      notify("error", err.message || "Terjadi kesalahan sistem saat memperbarui kata sandi.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="w-full relative space-y-8 select-none transition-colors duration-500 pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              notification.type === "success" 
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold bg-white dark:bg-[#071a12]" 
                : "bg-red-500/15 border-red-500/30 text-red-600 dark:text-red-400 font-bold bg-white dark:bg-[#1a0707]"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
            <p className="text-xs md:text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Ambience */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute top-40 left-10 w-[400px] h-[400px] bg-teal-500/5 dark:bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Profile Overview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden shadow-xl dark:shadow-2xl gap-6"
      >
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Static Avatar */}
          <div className="shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-500 border-2 border-emerald-500/30 flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-lg shadow-emerald-500/20 overflow-hidden">
              {profileData.profilePictureUrl ? (
                <img 
                  src={profileData.profilePictureUrl} 
                  alt={profileData.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                profileData.name?.charAt(0)?.toUpperCase() || "S"
              )}
            </div>
          </div>

          {/* User Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.roleName === "STAFF" || user.roleName === "Staff" ? "OFFICER" : (user.roleName || "OFFICER")}
              </span>
              {user.npm && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-600 dark:text-white/70">
                  {t("officer_profile.npm_label") || "NPM"}: {user.npm}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              {profileData.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-white/50 font-medium">
              {profileData.email}
            </p>

            {/* Position / Dept / Div Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {user.positionName && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {user.positionName}
                </span>
              )}
              {user.departmentName && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {user.departmentName}
                </span>
              )}
              {user.divisionName && (
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {user.divisionName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Summary Pill */}
        <div className="relative z-10 hidden lg:flex flex-col items-end gap-1 text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">
            {t("officer_profile.account_status") || "Status Akun"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {t("officer_profile.account_verified") || "Aktif Terverifikasi"}
          </span>
        </div>
      </motion.div>

      {/* Main 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* Left Column: Organization Credentials & Security Card (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Card 1: Org Credentials Overview */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 shadow-xl dark:shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-5 pb-3.5 border-b border-slate-100 dark:border-white/5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Briefcase className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  {t("officer_profile.card_credentials_title") || "Informasi Organisasi"}
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-white/40">
                  {t("officer_profile.card_credentials_desc") || "Data posisi & peran Anda di kepengurusan SRE."}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Position */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-xs font-semibold">
                  <Briefcase className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t("officer_profile.position") || "Posisi / Jabatan"}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {user.positionName || "-"}
                </span>
              </div>

              {/* Department */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-xs font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>{t("officer_profile.department") || "Departemen"}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {user.departmentName || "-"}
                </span>
              </div>

              {/* Division */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-xs font-semibold">
                  <Layers className="w-3.5 h-3.5 text-purple-500" />
                  <span>{t("officer_profile.division") || "Divisi"}</span>
                </div>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  {user.divisionName || "-"}
                </span>
              </div>

              {/* Role */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 text-slate-500 dark:text-white/50 text-xs font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t("officer_profile.account_role") || "Peran Akun"}</span>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">
                  {user.roleName === "STAFF" || user.roleName === "Staff" ? "OFFICER" : (user.roleName || "OFFICER")}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card 2: Security & Account Info */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  {t("officer_profile.card_security_title") || "Keamanan Akun Officer"}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-white/50 leading-relaxed">
                  {t("officer_profile.email_hint") || "Untuk mengubah email akun, silakan hubungi Tim Web Development SRE UPN Veteran Jawa Timur."}
                </p>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Right Column: Interactive Tabs & Forms (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Tabs Switcher */}
          <div className="flex items-center gap-2 bg-white/70 dark:bg-[#08120e]/70 border border-slate-200/80 dark:border-white/5 p-1.5 rounded-2xl backdrop-blur-xl w-full sm:w-fit shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("biodata")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "biodata"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t("officer_profile.tab_biodata") || "Ubah Biodata & NPM"}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("security")}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                  : "text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>{t("officer_profile.tab_security") || "Ganti Kata Sandi"}</span>
            </button>
          </div>

          {/* TAB 1: FORM BIODATA & NPM */}
          {activeTab === "biodata" && (
            <motion.div
              key="tab-biodata"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("officer_profile.biodata_title") || "Informasi Biodata & NPM"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    {t("officer_profile.biodata_desc") || "Perbarui nama tampilan dan Nomor Pokok Mahasiswa (NPM) Anda."}
                  </p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {/* Nama Lengkap */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.name_label") || "Nama Lengkap *"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      placeholder={t("officer_profile.name_placeholder") || "Contoh: Budi Prasetyo"}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                {/* NPM */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.npm_title") || "Nomor Pokok Mahasiswa (NPM)"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileData.npm}
                      onChange={(e) => setProfileData({ ...profileData, npm: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder={t("officer_profile.npm_placeholder") || "Contoh: 22081010045"}
                      className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-white/40">
                    {t("officer_profile.npm_hint") || "NPM digunakan untuk pencocokan data keanggotaan dan sertifikat kegiatan."}
                  </p>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.email_label") || "Alamat Email Akun"}
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      disabled
                      value={profileData.email}
                      className="w-full h-12 pl-11 pr-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-500 dark:text-white/40 text-xs md:text-sm font-medium cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-white/40">
                    {t("officer_profile.email_hint") || "Untuk mengubah email akun, silakan hubungi Tim Web Development SRE UPN Veteran Jawa Timur."}
                  </p>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{t("officer_profile.save_biodata_btn") || "Simpan Perubahan Biodata"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* TAB 2: FORM GANTI PASSWORD */}
          {activeTab === "security" && (
            <motion.div
              key="tab-security"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl dark:shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t("officer_profile.security_title") || "Ganti Kata Sandi"}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-white/40">
                    {t("officer_profile.security_desc") || "Perbarui kata sandi akun Anda untuk menjaga keamanan akses."}
                  </p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-5">
                {/* Password Saat Ini */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.current_password") || "Kata Sandi Lama Saat Ini *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      placeholder={t("officer_profile.current_password_ph") || "Masukkan kata sandi lama Anda"}
                      className="w-full h-12 pl-11 pr-11 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.new_password") || "Kata Sandi Baru *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder={t("officer_profile.new_password_ph") || "Masukkan kata sandi baru (min. 6 karakter)"}
                      className="w-full h-12 pl-11 pr-11 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Password Baru */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                    {t("officer_profile.confirm_password") || "Konfirmasi Kata Sandi Baru *"}
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      placeholder={t("officer_profile.confirm_password_ph") || "Ketik ulang kata sandi baru"}
                      className="w-full h-12 pl-11 pr-11 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                    />
                    <KeyRound className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSavingPassword}
                    className="w-full h-12 rounded-2xl bg-emerald-500 text-slate-950 font-black text-xs md:text-sm uppercase tracking-wider hover:bg-emerald-400 transition-all shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingPassword ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>{t("officer_profile.save_password_btn") || "Perbarui Kata Sandi"}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

        </div>

      </div>

    </div>
  );
}
