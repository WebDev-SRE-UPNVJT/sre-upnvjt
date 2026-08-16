import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing from environment variables.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function run() {
  console.log("Checking database connection and running migration for isAnnouncementModal...");
  await sql`ALTER TABLE "activity" ADD COLUMN IF NOT EXISTS "isAnnouncementModal" boolean DEFAULT false NOT NULL;`;
  console.log("Successfully added 'isAnnouncementModal' column to 'activity' table!");
  await sql.end();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
