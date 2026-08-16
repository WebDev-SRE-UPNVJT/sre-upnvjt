"use server";

import { db } from "@/lib/db";
import { user, department, content, event, taskSubmission } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";

export async function getDashboardStats(role, departmentId, userId) {
  try {
    // Run all 7 database queries in parallel
    const [
      uCountRes,
      cCountRes,
      dCountRes,
      eCountRes,
      recentArticles,
      recentSubmissions,
      publishedList
    ] = await Promise.all([
      db.select({ value: count() }).from(user).where(eq(user.isActive, true)),
      db.select({ value: count() }).from(content).where(eq(content.isPublished, true)),
      db.select({ value: count() }).from(department),
      db.select({ value: count() }).from(event),
      db.query.content.findMany({
        orderBy: [desc(content.createdAt)],
        limit: 5,
      }),
      db.query.taskSubmission.findMany({
        orderBy: [desc(taskSubmission.submittedAt)],
        limit: 5,
        with: {
          member: { columns: { name: true } },
          task: { columns: { title: true } },
        },
      }),
      db.query.content.findMany({
        where: eq(content.isPublished, true),
        columns: { createdAt: true },
      })
    ]);

    const totalUsers = uCountRes[0]?.value || 0;
    const publishedArticles = cCountRes[0]?.value || 0;
    const totalDepartments = dCountRes[0]?.value || 0;
    const totalActivities = eCountRes[0]?.value || 0;

    // Format and combine
    const formattedArticles = recentArticles.map(art => ({
      id: `article-${art.id}`,
      title: art.title,
      desc: "Artikel baru diterbitkan ke modul publik.",
      type: "ARTICLE",
      date: art.createdAt,
    }));

    const formattedSubmissions = recentSubmissions.map(sub => ({
      id: `submission-${sub.id}`,
      title: sub.task?.title || "Penugasan Operasional",
      desc: `Laporan solusi disubmit oleh ${sub.member?.name || "anggota SRE"}.`,
      type: "SUBMISSION",
      date: sub.submittedAt,
    }));

    const recentActivities = [...formattedArticles, ...formattedSubmissions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    const chartData = Array(12).fill(0);
    publishedList.forEach(art => {
      const month = new Date(art.createdAt).getMonth();
      chartData[month]++;
    });

    const stats = {
      totalUsers,
      publishedArticles,
      totalDepartments,
      totalActivities,
      recentActivities,
      chartData,
      rawChartData: chartData,
      pendingAttendance: []
    };

    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return { success: false, error: "Failed to fetch dashboard statistics" };
  }
}

