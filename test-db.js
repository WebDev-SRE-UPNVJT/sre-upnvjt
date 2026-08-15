const postgres = require('postgres');

async function testDb() {
  const connectionString = "postgresql://postgres.gdnxxpklqztkqssjtnzo:webdevsrecuy@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres";
  const sql = postgres(connectionString);
  
  try {
    console.log("Connecting to DB...");
    const res = await sql`SELECT NOW()`;
    console.log("Query result:", res);
    await sql.end();
  } catch (err) {
    console.error("Connection error:", err);
  }
}

testDb();
