import React from "react";
import { db } from "@/lib/db";
import { content, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, FileText, Image as ImageIcon } from "lucide-react";
import { resolveImageUrl } from "@/lib/imageUrl";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await db.query.content.findFirst({
    where: eq(content.slug, slug),
  });

  if (!data) return { title: "Article Not Found | SRE Portal" };

  return {
    title: `${data.title} | SRE Portal`,
    description: data.body.substring(0, 160).replace(/<[^>]*>?/gm, ''),
  };
}

export default async function ContentDetailPage({ params }) {
  const { slug } = await params;

  // Use a manual leftJoin select to safely fetch the article with its author.
  // The Drizzle relation for `content` is named `updatedBy` (not `author`),
  // but we alias the joined columns as `author` here to match the JSX below.
  const articleQuery = await db.select({
    id: content.id,
    title: content.title,
    slug: content.slug,
    body: content.body,
    imageUrl: content.imageUrl,
    isPublished: content.isPublished,
    createdAt: content.createdAt,
    author: {
      name: user.name,
      profilePictureUrl: user.profilePictureUrl
    }
  })
  .from(content)
  .leftJoin(user, eq(content.updatedById, user.id))
  .where(eq(content.slug, slug))
  .limit(1);

  const articleData = articleQuery[0];

  if (!articleData || !articleData.isPublished) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#050e0a] text-gray-900 dark:text-white font-sans selection:bg-primary/30">
      <main className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        <Link href="/articles" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Articles
        </Link>

        <header className="mb-10 text-center">
          <div className="flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-wider text-primary mb-6">
            <span className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-full"><Calendar className="w-4 h-4" /> {new Date(articleData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-8 leading-[1.1]">
            {articleData.title}
          </h1>

          <div className="flex items-center justify-center gap-4 text-gray-600 dark:text-white/60">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center text-primary font-bold shadow-sm">
                {articleData.author?.name ? articleData.author.name.charAt(0) : "A"}
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{articleData.author?.name || "Admin"}</div>
                <div className="text-xs">SRE UPNVJT</div>
              </div>
            </div>
          </div>
        </header>

        {articleData.imageUrl ? (
          <div className="w-full h-[400px] md:h-[500px] rounded-[2rem] overflow-hidden mb-12 shadow-2xl shadow-primary/5">
            <img 
              src={resolveImageUrl(articleData.imageUrl)} 
              alt={articleData.title} 
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-full h-[300px] rounded-[2rem] bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col items-center justify-center mb-12 text-gray-400 dark:text-white/20">
            <ImageIcon className="w-16 h-16 mb-4" />
            <span className="text-sm font-medium">No cover image provided</span>
          </div>
        )}

        <article className="prose prose-lg dark:prose-invert prose-emerald max-w-none prose-headings:font-black prose-p:leading-relaxed prose-img:rounded-3xl mx-auto whitespace-pre-wrap">
          {articleData.body}
        </article>
      </main>
    </div>
  );
}
