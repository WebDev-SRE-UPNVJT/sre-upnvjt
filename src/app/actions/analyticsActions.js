"use server";

import { db } from "@/lib/db";
import { pageView } from "@/db/schema";
import { count, desc, sql, gte } from "drizzle-orm";
import { unstable_cache } from "next/cache";

// 4 Stat Cards Summary (Aggregated in 1 fast query)
export const getVisitorStats = unstable_cache(
  async () => {
    try {
      const [statsResult] = await db
        .select({
          totalViews: count(),
          uniqueVisitors: sql`count(distinct ${pageView.visitorId})::int`,
          loggedInVisitors: sql`count(distinct case when ${pageView.userId} is not null then ${pageView.userId} end)::int`,
        })
        .from(pageView);

      // Most visited path
      const topPathResult = await db
        .select({
          path: pageView.path,
          visits: count(),
        })
        .from(pageView)
        .groupBy(pageView.path)
        .orderBy(desc(count()))
        .limit(1);

      return {
        success: true,
        data: {
          totalViews: Number(statsResult?.totalViews || 0),
          uniqueVisitors: Number(statsResult?.uniqueVisitors || 0),
          loggedInVisitors: Number(statsResult?.loggedInVisitors || 0),
          topPage: topPathResult[0]?.path ?? "-",
        },
      };
    } catch (err) {
      console.error("[analytics] getVisitorStats:", err.message);
      return { 
        success: true, 
        data: { totalViews: 0, uniqueVisitors: 0, loggedInVisitors: 0, topPage: "-" } 
      };
    }
  },
  ["analytics-visitor-stats"],
  { revalidate: 30, tags: ["analytics"] }
);

// Daily traffic for the last N days (WIB / Asia/Jakarta timezone)
export const getDailyTraffic = unstable_cache(
  async (days = 14) => {
    try {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      const dayExpr = sql`to_char((${pageView.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD')`;

      const rows = await db
        .select({
          date: sql`${dayExpr}`.as("date"),
          visits: count(),
        })
        .from(pageView)
        .where(gte(pageView.createdAt, since))
        .groupBy(dayExpr)
        .orderBy(dayExpr);

      // Fill missing days with 0 so chart has no gaps
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const label = d.toLocaleDateString("en-US", { timeZone: "Asia/Jakarta", month: "short", day: "numeric" });
        const isoDate = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(d);

        const found = rows.find((r) => r.date === isoDate);

        result.push({ date: label, visits: found ? Number(found.visits) : 0 });
      }

      return { success: true, data: result };
    } catch (err) {
      console.error("[analytics] getDailyTraffic:", err.message);
      return { success: true, data: [] };
    }
  },
  ["analytics-daily-traffic"],
  { revalidate: 30, tags: ["analytics"] }
);

// Hourly traffic distribution (0-23 in WIB / Asia/Jakarta timezone)
export const getHourlyTraffic = unstable_cache(
  async () => {
    try {
      const hourExpr = sql`EXTRACT(HOUR FROM (${pageView.createdAt} AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Jakarta'))::int`;

      const rows = await db
        .select({
          hour: sql`${hourExpr}`.as("hour"),
          visits: count(),
        })
        .from(pageView)
        .groupBy(hourExpr)
        .orderBy(hourExpr);

      // Ensure all 24 hours exist
      const result = Array.from({ length: 24 }, (_, i) => {
        const found = rows.find((r) => Number(r.hour) === i);
        const hourLabel = `${String(i).padStart(2, "0")}:00`;
        return { hour: hourLabel, visits: found ? Number(found.visits) : 0 };
      });

      return { success: true, data: result };
    } catch (err) {
      console.error("[analytics] getHourlyTraffic:", err.message);
      return { success: true, data: [] };
    }
  },
  ["analytics-hourly-traffic"],
  { revalidate: 30, tags: ["analytics"] }
);

// Device breakdown
export const getDeviceBreakdown = unstable_cache(
  async () => {
    try {
      const rows = await db
        .select({
          device: pageView.deviceType,
          visits: count(),
        })
        .from(pageView)
        .groupBy(pageView.deviceType)
        .orderBy(desc(count()));

      return {
        success: true,
        data: rows.map((r) => ({
          device: r.device ?? "unknown",
          visits: Number(r.visits),
        })),
      };
    } catch (err) {
      console.error("[analytics] getDeviceBreakdown:", err.message);
      return { success: true, data: [] };
    }
  },
  ["analytics-device-breakdown"],
  { revalidate: 30, tags: ["analytics"] }
);

// Top N pages by page view count
export const getTopPages = unstable_cache(
  async (limit = 5) => {
    try {
      const rows = await db
        .select({
          path: pageView.path,
          visits: count(),
        })
        .from(pageView)
        .groupBy(pageView.path)
        .orderBy(desc(count()))
        .limit(limit);

      return {
        success: true,
        data: rows.map((r) => ({ path: r.path, visits: Number(r.visits) })),
      };
    } catch (err) {
      console.error("[analytics] getTopPages:", err.message);
      return { success: true, data: [] };
    }
  },
  ["analytics-top-pages"],
  { revalidate: 30, tags: ["analytics"] }
);
