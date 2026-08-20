"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Lock, KeyRound, CheckCircle2, X, ShieldCheck, Eye, EyeOff,
  Mail, Hash, Briefcase, Building2, Layers, Shield, Sparkles,
  Camera, Check, AlertCircle, Loader2, Save
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilStaffClient({ user }) {
  const router = useRouter();

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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle Photo Upload
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("error", "Harap unggah file gambar (JPG, PNG, atau WEBP)");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      notify("error", "Ukuran foto maksimal 3MB");
      return;
    }

    setIsUploadingPhoto(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "profiles");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengunggah foto profil");

      setProfileData(prev => ({ ...prev, profilePictureUrl: data.url }));

      // Auto save photo to database
      const saveRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          npm: profileData.npm,
          profilePictureUrl: data.url,
        }),
      });

      if (!saveRes.ok) throw new Error("Gagal menyimpan URL foto profil ke akun");

      notify("success", "Foto profil berhasil diperbarui!");
      router.refresh();
    } catch (err) {
      notify("error", err.message || "Terjadi kesalahan saat mengunggah foto.");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle Save Profile (Name & NPM)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    if (!profileData.name.trim()) {
      notify("error", "Nama lengkap tidak boleh kosong!");
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

      notify("success", "Informasi nama dan NPM berhasil disimpan!");
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
      notify("error", "Masukkan kata sandi lama saat ini!");
      return;
    }
    if (!passwordData.newPassword) {
      notify("error", "Masukkan kata sandi baru!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      notify("error", "Kata sandi baru minimal 6 karakter!");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify("error", "Konfirmasi kata sandi baru tidak cocok!");
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
      
      notify("success", "Kata sandi akun berhasil diperbarui!");
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
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-500 font-bold bg-white dark:bg-[#071a12]" 
                : "bg-red-500/15 border-red-500/30 text-red-500 font-bold bg-white dark:bg-[#1a0707]"
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

      {/* User Header Profile Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden shadow-xl dark:shadow-2xl gap-6"
      >
        <div className="absolute -left-16 -top-16 w-48 h-48 rounded-full bg-emerald-500/20 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar with Upload Trigger */}
          <div className="relative group/avatar shrink-0">
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

            {/* Change Photo Overlay */}
            <label 
              htmlFor="photo-upload-input" 
              className="absolute inset-0 bg-black/60 rounded-3xl opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white text-[10px] font-bold gap-1"
            >
              {isUploadingPhoto ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>Ubah Foto</span>
                </>
              )}
            </label>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={isUploadingPhoto}
            />
          </div>

          {/* User Details */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {user.roleName === "STAFF" ? "Staff / Officer SRE" : (user.roleName || "Officer")}
              </span>
              {user.npm && (
                <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-600 dark:text-white/70">
                  NPM: {user.npm}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight text-slate-900 dark:text-white">
              {profileData.name}
            </h1>
            <p className="text-xs md:text-sm text-slate-500 dark:text-white/50 font-medium">
              {profileData.email}
            </p>

            {/* Badges */}
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
            Status Akun
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Aktif Terverifikasi
          </span>
        </div>
      </motion.div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 bg-white/60 dark:bg-[#08120e]/60 border border-slate-200/80 dark:border-white/5 p-1.5 rounded-2xl backdrop-blur-xl w-full sm:w-fit shadow-sm">
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
          <span>Ubah Biodata & NPM</span>
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
          <span>Ganti Kata Sandi</span>
        </button>
      </div>

      {/* TAB 1: FORM BIODATA & NPM */}
      {activeTab === "biodata" && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Informasi Biodata & NPM</h2>
              <p className="text-xs text-slate-500 dark:text-white/40">Perbarui nama tampilan dan Nomor Pokok Mahasiswa (NPM) Anda.</p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {/* Nama Lengkap */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                Nama Lengkap *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  placeholder="Contoh: Budi Prasetyo"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                />
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

            {/* NPM */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                Nomor Pokok Mahasiswa (NPM)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={profileData.npm}
                  onChange={(e) => setProfileData({ ...profileData, npm: e.target.value.replace(/[^0-9]/g, '') })}
                  placeholder="Contoh: 22081010045"
                  className="w-full h-12 pl-11 pr-4 bg-slate-50 dark:bg-[#060e0a] border border-slate-200 dark:border-white/10 rounded-2xl text-slate-900 dark:text-white font-mono placeholder:text-slate-400 dark:placeholder:text-white/20 text-xs md:text-sm font-semibold focus:outline-none focus:border-emerald-500 transition-all"
                />
                <Hash className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 dark:text-white/40">
                NPM digunakan untuk pencocokan data keanggotaan dan sertifikat kegiatan.
              </p>
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                Alamat Email Akun
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
                Untuk mengubah email akun, silakan hubungi Tim Web Devlopment SRE UPN Veteran Jawa Timur.
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
                    <span>Simpan Perubahan Biodata</span>
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
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-[#08120e] border border-slate-200 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl max-w-2xl"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ganti Kata Sandi</h2>
              <p className="text-xs text-slate-500 dark:text-white/40">Perbarui kata sandi akun Anda untuk menjaga keamanan akses.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* Password Saat Ini */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold tracking-wider text-slate-600 dark:text-white/70 uppercase">
                Kata Sandi Lama Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Masukkan kata sandi lama Anda"
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
                Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Masukkan kata sandi baru (min 6 karakter)"
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
                Konfirmasi Kata Sandi Baru *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Ketik ulang kata sandi baru"
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
                    <span>Perbarui Kata Sandi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      )}

    </div>
  );
}
