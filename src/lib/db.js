import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '@/db/schema';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL environment variable is not set. ' +
    'Please add it to your .env.local file.'
  );
}

// In development, cache the database client globally to prevent multiple connections on hot-reload.
// prepare: false is required when using Supabase's transaction pooler (port 6543)
let client;
let db;

const dbConfig = {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  prepare: false,
};

if (process.env.NODE_ENV === 'production') {
  client = postgres(process.env.DATABASE_URL, dbConfig);
  db = drizzle(client, { schema });
} else {
  if (!globalThis.globalDbClient) {
    globalThis.globalDbClient = postgres(process.env.DATABASE_URL, dbConfig);
  }
  client = globalThis.globalDbClient;
  
  if (!globalThis.globalDb) {
    globalThis.globalDb = drizzle(client, { schema });
  }
  db = globalThis.globalDb;
}

export { db };

