import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pptModule, pptSlide } from "@/db/schema";
import { desc, count, eq } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateModuleSlug } from "@/app/actions/pptActions";

export async function GET() {
  try {
    const modules = await db
      .select({
        id: pptModule.id,
        slug: pptModule.slug,
        title: pptModule.title,
        description: pptModule.description,
        coverImageUrl: pptModule.coverImageUrl,
        isPublished: pptModule.isPublished,
        createdById: pptModule.createdById,
        createdAt: pptModule.createdAt,
        updatedAt: pptModule.updatedAt,
        slideCount: count(pptSlide.id),
      })
      .from(pptModule)
      .leftJoin(pptSlide, eq(pptSlide.moduleId, pptModule.id))
      .groupBy(pptModule.id)
      .orderBy(desc(pptModule.createdAt));

    return NextResponse.json(modules);
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
    const { title, description, coverImageUrl, isPublished } = body;

    if (!title) {
      return NextResponse.json({ error: "Judul modul wajib diisi" }, { status: 400 });
    }

    const slug = await generateModuleSlug(title);

    const [result] = await db.insert(pptModule).values({
      title,
      slug,
      description: description || null,
      coverImageUrl: coverImageUrl || null,
      isPublished: Boolean(isPublished),
      createdById: session.user.id,
    }).returning();

    return NextResponse.json({ success: true, module: { ...result, slideCount: 0 } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
