"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, KeyRound, CheckCircle2, X, ShieldCheck, Eye, EyeOff
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilStaffClient({ user }) {
  const router = useRouter();

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const notify = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword) {
      notify("error", "Masukkan password saat ini!");
      return;
    }
    if (!passwordData.newPassword) {
      notify("error", "Masukkan password baru!");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      notify("error", "Password baru minimal 6 karakter!");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      notify("error", "Konfirmasi password baru tidak cocok!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          email: user.email,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengganti password");
      
      notify("success", "Password berhasil diperbarui!");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      router.refresh();
    } catch (err) {
      notify("error", err.message || "Terjadi kesalahan sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] mt-16 pt-8 pb-12 bg-gray-50/50 dark:bg-[#07130e] p-4 md:p-8 relative overflow-hidden font-sans">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border ${
              notification.type === "success" 
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 font-bold" 
                : "bg-red-500/15 border-red-500/30 text-red-400 font-bold"
            }`}
          >
            {notification.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <X className="w-5 h-5 shrink-0" />}
            <p className="text-xs md:text-sm">{notification.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        
        {/* User Brief Banner */}
        <div className="bg-white/40 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/10 rounded-3xl p-6 backdrop-blur-xl shadow-sm flex flex-col md:flex-row items-start md:items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 font-bold text-2xl shadow-sm">
            {user.profilePictureUrl ? (
              <img src={user.profilePictureUrl} alt={user.name} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              user.name?.charAt(0)?.toUpperCase() || "S"
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white truncate">{user.name}</h2>
              <p className="text-xs text-gray-500 dark:text-white/40 truncate">{user.email}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {user.positionName && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Posisi: {user.positionName}
                </span>
              )}
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-primary/10 text-primary border border-primary/20">
                Role: {user.roleName === "STAFF" ? "Officer" : (user.roleName || "Officer")}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Dept: {user.departmentName || "General"}
              </span>
              {user.divisionName && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Divisi: {user.divisionName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/60 dark:bg-[#091712]/80 border border-gray-200/60 dark:border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200/50 dark:border-white/10">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center text-primary shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ganti Password</h1>
              <p className="text-xs text-gray-500 dark:text-white/40">Perbarui kata sandi akun Anda untuk menjaga keamanan.</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            {/* Password Saat Ini */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                Password Saat Ini *
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  required
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="Masukkan kata sandi lama Anda"
                  className="w-full h-12 pl-4 pr-11 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Masukkan kata sandi baru (min 6 karakter)"
                  className="w-full h-12 pl-4 pr-11 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password Baru */}
            <div>
              <label className="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-white/50 uppercase mb-2">
                Konfirmasi Password Baru *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="Ketik ulang kata sandi baru"
                  className="w-full h-12 pl-4 pr-11 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/20 text-sm font-semibold focus:outline-none focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-primary text-[#050e0a] font-bold text-sm hover:bg-primary-focus transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-[#050e0a]/30 border-t-[#050e0a] rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Simpan Password Baru
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
}

