import React from "react";
import ContentPublicClient from "./ContentPublicClient";
import { getPublicContent, getContentCategories } from "@/app/actions/contentActions";

export const metadata = {
  title: "Articles & News | SRE UPNVJT",
  description: "Read the latest news, updates, and research from SRE UPN Veteran Jawa Timur.",
};

export const dynamic = "force-dynamic";

export default async function PublicContentPage() {
  const [contentResult, catResult] = await Promise.all([
    getPublicContent(),
    getContentCategories(),
  ]);

  const articles = contentResult.success ? contentResult.data : [];
  const categories = catResult.success ? catResult.data : [];

  return (
    <ContentPublicClient 
      initialArticles={articles} 
      initialCategories={categories}
    />
  );
}
