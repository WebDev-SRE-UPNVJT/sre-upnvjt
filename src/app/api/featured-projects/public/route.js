import { NextResponse } from "next/server";
import { featuredProjectService } from "@/lib/services/featuredProjectService";

export async function GET() {
  try {
    const projects = await featuredProjectService.getPublishedProjects();
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Error fetching featured projects:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
