import React from "react";
import AboutClient from "./AboutClient";
import { getAllDepartments } from "@/lib/services/organizationService";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "About Us | SRE UPNVJT",
  description: "Pelajari visi, misi, dan struktur divisi Society of Renewable Energy (SRE) UPN Veteran Jawa Timur dalam mengakselerasi transisi energi hijau.",
};

export default async function AboutPage() {
  const departmentsData = await getAllDepartments();
  return <AboutClient departmentsData={departmentsData} />;
}

