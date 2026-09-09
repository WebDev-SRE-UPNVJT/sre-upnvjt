import postgres from 'postgres';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env')) {
  dotenv.config({ path: '.env' });
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function run() {
  console.log("Running migration to add 'titleId' and 'bodyId' columns to 'content' table...");
  
  await sql`
    ALTER TABLE "content"
    ADD COLUMN IF NOT EXISTS "titleId" VARCHAR(255),
    ADD COLUMN IF NOT EXISTS "bodyId" TEXT;
  `;

  console.log("Successfully added 'titleId' and 'bodyId' columns to 'content' table!");
  await sql.end();
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
