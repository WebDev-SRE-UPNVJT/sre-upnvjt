import React from "react";
import ActivityPublicClient from "./ActivityPublicClient";
import { activityService } from "@/lib/services/activityService";

export const revalidate = 0; // Ensure fresh data on request
 
export const metadata = {
  title: "Kegiatan & Acara | SRE UPNVJT",
  description: "Jelajahi berbagai agenda workshop, webinar, kompetisi, dan program kerja Society of Renewable Energy (SRE) UPN Veteran Jawa Timur.",
};

export default async function ActivityPage() {
  let activities = [];
  try {
    activities = await activityService.getAllActivities();
  } catch (error) {
    console.error("Error fetching activities for public page:", error);
  }

  return <ActivityPublicClient activities={activities} />;
}
