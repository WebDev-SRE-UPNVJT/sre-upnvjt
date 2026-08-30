import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please add it to your .env.local file.'
  );
}

// Cache the database client globally across both dev and prod to prevent connection pool exhaustion in Next.js
let client;
let db;

const dbConfig = {
  max: process.env.NODE_ENV === 'production' ? 10 : 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
};

if (!globalThis.globalDbClient) {
  globalThis.globalDbClient = postgres(process.env.DATABASE_URL, dbConfig);
}
client = globalThis.globalDbClient;

if (!globalThis.globalDb) {
  globalThis.globalDb = drizzle(client, { schema });
}
db = globalThis.globalDb;

export { db };

