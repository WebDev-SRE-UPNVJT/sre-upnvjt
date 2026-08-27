"use server";

import { db } from "@/lib/db";
import { user, department, content, activity, event, task, taskSubmission, attendance, attendanceSession, announcement, literatureItem } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function getDashboardStats(role, departmentId, userId) {
  try {
    const currentYear = new Date().getFullYear();

    // Run database queries in parallel
    const [
      uCountRes,
      litCountRes,
      dCountRes,
      actCountRes,
      recentArticles,
      recentAnnouncements,
      recentTasks,
      recentSubmissions,
      recentSessions,
      recentActivitiesList,
      publishedList,
      submissionsList,
      attendancesList,
    ] = await Promise.all([
      db.select({ value: count() }).from(user).where(eq(user.isActive, true)),
      db.select({ value: count() }).from(literatureItem),
      db.select({ value: count() }).from(department),
      db.select({ value: count() }).from(activity),
      db.query.content.findMany({
        orderBy: [desc(content.createdAt)],
        limit: 5,
        with: {
          updatedBy: { columns: { name: true } },
        },
      }),
      db.query.announcement.findMany({
        orderBy: [desc(announcement.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.task.findMany({
        orderBy: [desc(task.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.taskSubmission.findMany({
        orderBy: [desc(taskSubmission.submittedAt)],
        limit: 5,
        with: {
          member: { columns: { name: true } },
          task: { columns: { title: true } },
          reviewer: { columns: { name: true } },
        },
      }),
      db.query.attendanceSession.findMany({
        orderBy: [desc(attendanceSession.createdAt)],
        limit: 5,
        with: {
          createdBy: { columns: { name: true } },
        },
      }),
      db.query.activity.findMany({
        orderBy: [desc(activity.createdAt)],
        limit: 5,
      }),
      db.query.content.findMany({
        where: eq(content.isPublished, true),
        columns: { createdAt: true },
      }),
      db.query.taskSubmission.findMany({
        columns: { submittedAt: true },
      }),
      db.query.attendance.findMany({
        columns: { createdAt: true },
      }),
    ]);

    const totalUsers = uCountRes[0]?.value || 0;
    const totalLiterature = litCountRes[0]?.value || 0;
    const totalDepartments = dCountRes[0]?.value || 0;
    const totalActivities = actCountRes[0]?.value || 0;

    // 1. Articles
    const formattedArticles = recentArticles.map((art) => ({
      id: `article-${art.id}`,
      title: art.title,
      desc: art.updatedBy?.name
        ? `Artikel diterbitkan oleh ${art.updatedBy.name} ke modul publik.`
        : "Artikel baru diterbitkan ke modul publik.",
      type: "ARTICLE",
      actor: art.updatedBy?.name || "Admin / Editor",
      date: art.createdAt,
    }));

    // 2. Announcements
    const formattedAnnouncements = recentAnnouncements.map((ann) => ({
      id: `announcement-${ann.id}`,
      title: ann.title,
      desc: ann.createdBy?.name
        ? `Pengumuman dirilis oleh ${ann.createdBy.name}${ann.targetAudience ? ` (Target: ${ann.targetAudience})` : ""}.`
        : "Pengumuman baru dirilis ke beranda sistem.",
      type: "ANNOUNCEMENT",
      actor: ann.createdBy?.name || "Admin",
      date: ann.createdAt,
    }));

    // 3. Tasks
    const formattedTasks = recentTasks.map((t) => ({
      id: `task-${t.id}`,
      title: t.title,
      desc: t.createdBy?.name
        ? `Penugasan baru dibuat oleh ${t.createdBy.name} (Reward: ${t.rewardXp || 0} XP).`
        : `Penugasan operasional baru (Reward: ${t.rewardXp || 0} XP).`,
      type: "TASK",
      actor: t.createdBy?.name || "Admin Divisi",
      date: t.createdAt,
    }));

    // 4. Submissions & Reviews
    const formattedSubmissions = recentSubmissions.map((sub) => {
      const isReviewed = sub.status === "APPROVED" || sub.status === "REJECTED";
      if (isReviewed && sub.reviewer?.name) {
        return {
          id: `review-${sub.id}`,
          title: `Review Tugas: ${sub.task?.title || "Tugas"}`,
          desc: `${sub.reviewer.name} ${sub.status === "APPROVED" ? "menyetujui" : "menolak"} laporan milik ${sub.member?.name || "Anggota"}.`,
          type: "REVIEW",
          actor: sub.reviewer.name,
          date: sub.submittedAt,
        };
      }
      return {
        id: `submission-${sub.id}`,
        title: sub.task?.title || "Penugasan Operasional",
        desc: `Laporan solusi disubmit oleh ${sub.member?.name || "Anggota SRE"}.`,
        type: "SUBMISSION",
        actor: sub.member?.name || "Anggota",
        date: sub.submittedAt,
      };
    });

    // 5. Attendance Sessions
    const formattedSessions = recentSessions.map((sess) => ({
      id: `session-${sess.id}`,
      title: sess.title,
      desc: sess.createdBy?.name
        ? `Sesi absensi dibuka oleh ${sess.createdBy.name}.`
        : "Sesi presensi kegiatan dibuka.",
      type: "ATTENDANCE",
      actor: sess.createdBy?.name || "Admin",
      date: sess.createdAt,
    }));

    // 6. Activities (/activities)
    const formattedActivitiesList = recentActivitiesList.map((act) => ({
      id: `activity-${act.id}`,
      title: act.name,
      desc: `Aktivitas / kegiatan baru ditambahkan ke halaman Activities SRE.`,
      type: "EVENT",
      actor: "Admin Event",
      date: act.createdAt,
    }));

    // Merge and sort newest first (up to 10 latest activities)
    const recentActivities = [
      ...formattedArticles,
      ...formattedAnnouncements,
      ...formattedTasks,
      ...formattedSubmissions,
      ...formattedSessions,
      ...formattedActivitiesList,
    ]
      .filter((item) => item.date)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10);

    // Build 12-month trend data
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const monthlyTrends = monthNames.map((name) => ({
      name,
      articles: 0,
      submissions: 0,
      attendances: 0,
    }));

    publishedList.forEach((art) => {
      if (art.createdAt) {
        const d = new Date(art.createdAt);
        if (d.getFullYear() === currentYear) {
          monthlyTrends[d.getMonth()].articles++;
        }
      }
    });

    submissionsList.forEach((sub) => {
      if (sub.submittedAt) {
        const d = new Date(sub.submittedAt);
        if (d.getFullYear() === currentYear) {
          monthlyTrends[d.getMonth()].submissions++;
        }
      }
    });

    attendancesList.forEach((att) => {
      if (att.createdAt) {
        const d = new Date(att.createdAt);
        if (d.getFullYear() === currentYear) {
          monthlyTrends[d.getMonth()].attendances++;
        }
      }
    });

    // Fallback legacy array for backward compatibility
    const chartData = monthlyTrends.map((m) => m.articles);

    const stats = {
      totalUsers,
      totalLiterature,
      publishedArticles: totalLiterature,
      totalDepartments,
      totalActivities,
      recentActivities,
      monthlyTrends,
      currentYear,
      chartData,
      rawChartData: chartData,
      pendingAttendance: [],
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics" };
  }
}

