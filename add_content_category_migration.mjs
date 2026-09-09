import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';

// Prioritize .env.local if it exists; otherwise fall back to .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment variables.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function run() {
  console.log("Checking database connection and running migration for contentCategory and content.categoryId...");

  // 1. Create contentCategory table if it does not exist
  await sql`
    CREATE TABLE IF NOT EXISTS "contentCategory" (
      "id" SERIAL PRIMARY KEY,
      "name" VARCHAR(255) NOT NULL UNIQUE,
      "slug" VARCHAR(255) NOT NULL UNIQUE,
      "description" TEXT,
      "color" VARCHAR(50) DEFAULT 'emerald',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );
  `;
  console.log("Verified 'contentCategory' table.");

  // 2. Add categoryId column to content table if it does not exist
  await sql`
    ALTER TABLE "content" 
    ADD COLUMN IF NOT EXISTS "categoryId" INTEGER REFERENCES "contentCategory"("id") ON DELETE SET NULL;
  `;
  console.log("Verified 'categoryId' column on 'content' table.");

  // 3. Seed initial categories if table is empty
  const existingCats = await sql`SELECT count(*) FROM "contentCategory"`;
  if (parseInt(existingCats[0].count, 10) === 0) {
    console.log("Seeding default categories: Berita, Insight, Press Release, Artikel...");
    await sql`
      INSERT INTO "contentCategory" ("name", "slug", "description", "color") VALUES
      ('Berita', 'berita', 'Berita terbaru seputar energi terbarukan dan kegiatan SRE', 'blue'),
      ('Insight', 'insight', 'Analisis mendalam, opini, dan wawasan teknis industri energi', 'amber'),
      ('Press Release', 'press-release', 'Rilis pers resmi dan pernyataan organisasi SRE UPNVJT', 'purple'),
      ('Artikel', 'artikel', 'Artikel edukatif dan informasi umum energi berkelanjutan', 'emerald');
    `;
    console.log("Default categories seeded successfully!");
  }

  console.log("Migration completed successfully!");
  await sql.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
