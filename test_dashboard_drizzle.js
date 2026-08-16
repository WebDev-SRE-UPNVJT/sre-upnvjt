require('dotenv').config();
const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const schema = require('./src/db/schema.js');

const connectionString = process.env.DATABASE_URL;
console.log('Connecting to:', connectionString);

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client, { schema });

async function test() {
  try {
    console.log('Query 1: count users');
    const uCount = await db.select({ value: require('drizzle-orm').count() }).from(schema.user).where(require('drizzle-orm').eq(schema.user.isActive, true));
    console.log('Users count:', uCount);

    console.log('Query 2: count content');
    const cCount = await db.select({ value: require('drizzle-orm').count() }).from(schema.content).where(require('drizzle-orm').eq(schema.content.isPublished, true));
    console.log('Content count:', cCount);

    console.log('Query 3: count department');
    const dCount = await db.select({ value: require('drizzle-orm').count() }).from(schema.department);
    console.log('Department count:', dCount);

    console.log('Query 4: count event');
    const eCount = await db.select({ value: require('drizzle-orm').count() }).from(schema.event);
    console.log('Event count:', eCount);

    console.log('Query 5: findMany content');
    const recentArticles = await db.query.content.findMany({
      orderBy: [require('drizzle-orm').desc(schema.content.createdAt)],
      limit: 5,
    });
    console.log('Recent articles count:', recentArticles.length);

    console.log('Query 6: findMany taskSubmission');
    const recentSubmissions = await db.query.taskSubmission.findMany({
      orderBy: [require('drizzle-orm').desc(schema.taskSubmission.submittedAt)],
      limit: 5,
      with: {
        member: { columns: { name: true } },
        task: { columns: { title: true } },
      },
    });
    console.log('Recent submissions count:', recentSubmissions.length);

    console.log('All queries passed!');
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    await client.end();
  }
}

test();
