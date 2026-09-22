import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";
import { parseJakartaDate } from "@/lib/dateUtils";

export async function GET() {
  try {
    const data = await db.query.event.findMany({
      orderBy: [desc(event.eventDate)],
    });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, bannerUrl, eventDate, location, category, registrationType } = body;

    if (!title || !eventDate) {
      return NextResponse.json({ error: "Judul dan tanggal event wajib diisi" }, { status: 400 });
    }

    const [result] = await db.insert(event).values({
      title,
      description: description || null,
      bannerUrl: bannerUrl || null,
      eventDate: parseJakartaDate(eventDate),
      location: location || null,
      category: category || null,
      registrationType: registrationType || "OPEN",
    }).returning();

    return NextResponse.json({ success: true, event: result }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
