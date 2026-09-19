/**
 * Role-Based Access Control (RBAC) Module Configuration & Utilities
 */

export const DASHBOARD_MODULE_CATEGORIES = [
  {
    id: "core",
    name: "Core & Dashboard",
    modules: [
      { id: "overview", label: "Dashboard Overview", path: "/dashboard", desc: "Akses halaman ringkasan dan statistik dashboard" },
      { id: "analytics", label: "Website Analytics", path: "/dashboard/analytics", desc: "Statistik pengunjung dan metrik web portal" },
      { id: "settings", label: "System Settings", path: "/settings", desc: "Pengaturan akun dan preferensi sistem" },
    ],
  },
  {
    id: "organization",
    name: "Organization & Access",
    modules: [
      { id: "users", label: "User Management", path: "/users", desc: "Manajemen anggota, role pengguna, dan akun" },
      { id: "roles", label: "Roles & Permissions", path: "/roles", desc: "Konfigurasi hak akses modul dinamis untuk setiap role" },
      { id: "departments", label: "Departments & Divisions", path: "/departments", desc: "Struktur departemen dan divisi organisasi" },
      { id: "groups", label: "Kelompok & Mentoring", path: "/groups", desc: "Manajemen kelompok mentoring, pembagian mentor dan anggota" },
    ],
  },
  {
    id: "public_media",
    name: "Public & Media",
    modules: [
      { id: "content", label: "Articles & News", path: "/content", desc: "Manajemen artikel dan berita publik SRE" },
      { id: "shortlinks", label: "SRE Shortlinks", path: "/shortlinks", desc: "Custom shortlink management (sre-upnvjt.com/s/...)" },
      { id: "testimonials", label: "Testimonials", path: "/testimonials", desc: "Ulasan dan testimoni publik" },
      { id: "merchandise", label: "Merchandise Store", path: "/merch", desc: "Katalog produk dan penjualan merchandise" },
      { id: "partners", label: "Corporate Partners", path: "/partners", desc: "Manajemen partner industri dan sponsor" },
      { id: "featured-projects", label: "Featured Projects", path: "/featured-projects", desc: "Proyek unggulan dan highlight acara" },
    ],
  },
  {
    id: "member_ops",
    name: "Member Operations",
    modules: [
      { id: "ppt", label: "PPT Modules", path: "/ppt", desc: "Materi pembelajaran presentasi interaktif" },
      { id: "module_progress", label: "Monitoring Progres Modul", path: "/module-progress", desc: "Pantau progres membaca modul belajar (PPT) dari setiap member" },
      { id: "literature", label: "Literature Bank", path: "/literature", desc: "Bank dokumen, riset, dan literatur" },
      { id: "documents", label: "Internal Documents", path: "/documents", desc: "Arsip dokumen dan berkas internal organisasi" },
      { id: "tasks", label: "Tasks & Quests", path: "/tasks", desc: "Penugasan kurikulum, main quest, dan side quest" },
      { id: "submissions", label: "Task Submissions / Penilaian", path: "/submissions", desc: "Review, penilaian nilai/poin, dan evaluasi hasil tugas member" },
      { id: "activities", label: "Member Activities", path: "/activities", desc: "Log aktivitas dan reward XP anggota" },
      { id: "leaderboard", label: "Leaderboard", path: "/leaderboard", desc: "Peringkat level dan perolehan XP member" },
      { id: "attendance", label: "Attendance / Absensi", path: "/attendance", desc: "Sistem absensi pertemuan dan acara" },
      { id: "events", label: "Events Admin", path: "/events-admin", desc: "Manajemen pendaftaran dan data event" },
      { id: "applications", label: "Member Applications", path: "/applications", desc: "Pendaftaran dan seleksi calon anggota" },
    ],
  },
  {
    id: "interactive_games",
    name: "Interactive & Games",
    modules: [
      { id: "forms", label: "Form Builder", path: "/forms", desc: "Pembuat form kustom dinamis dan integrasi spreadsheet" },
      { id: "quiz", label: "Quiz Builder", path: "/quiz", desc: "Kuis interaktif berhadiah XP untuk anggota" },
      { id: "tts", label: "TTS (Crossword) Builder", path: "/tts", desc: "Permainan teka-teki silang interaktif" },
    ],
  },
];

// Flat list of all available modules
export const ALL_AVAILABLE_MODULES = DASHBOARD_MODULE_CATEGORIES.flatMap((c) =>
  c.modules.map((m) => m.id)
);

export const PERMISSION_ACTIONS = ["create", "read", "update", "delete"];

/**
 * Utility to check if a user has specific module permissions.
 * @param {Object} user - The user object (usually from session.user)
 * @param {string} moduleName - The module to check (e.g., 'users', 'tasks')
 * @param {string} action - The action to check ('create', 'read', 'update', 'delete'). Default is 'read'.
 * @returns {boolean} - true if the user has permission, false otherwise.
 */
export function hasAccess(user, moduleName, action = "read") {
  if (!user || !user.roleName) return false;

  // SUPER_ADMIN has full access to all modules and actions
  if (user.roleName === "SUPER_ADMIN") return true;

  const perms = user.permissions || {};

  // Wildcard all permission
  if (perms["all"] && Array.isArray(perms["all"])) {
    if (perms["all"].includes(action) || perms["all"].includes("*")) return true;
  }

  // Module specific permissions
  if (perms[moduleName] && Array.isArray(perms[moduleName])) {
    return perms[moduleName].includes(action) || perms[moduleName].includes("*");
  }

  return false;
}
