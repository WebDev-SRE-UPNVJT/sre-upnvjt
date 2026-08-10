import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import {
  getVisitorStats,
  getDailyTraffic,
  getHourlyTraffic,
  getDeviceBreakdown,
  getTopPages,
} from "@/app/actions/analyticsActions";
import AnalyticsClient from "./AnalyticsClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Analytics | SRE Portal",
};

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user?.roleName;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") {
    redirect("/dashboard");
  }

  const [statsRes, dailyRes, hourlyRes, deviceRes, topPagesRes] =
    await Promise.all([
      getVisitorStats(),
      getDailyTraffic(14),
      getHourlyTraffic(),
      getDeviceBreakdown(),
      getTopPages(5),
    ]);

  return (
    <AnalyticsClient
      stats={statsRes.success ? statsRes.data : null}
      dailyTraffic={dailyRes.success ? dailyRes.data : []}
      hourlyTraffic={hourlyRes.success ? hourlyRes.data : []}
      deviceBreakdown={deviceRes.success ? deviceRes.data : []}
      topPages={topPagesRes.success ? topPagesRes.data : []}
    />
  );
}
