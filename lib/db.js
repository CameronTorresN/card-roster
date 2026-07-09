import { neon } from '@neondatabase/serverless';

// Different Marketplace Postgres integrations name this env var differently —
// this one uses DATABASE_URL. Falling back to POSTGRES_URL/POSTGRES_PRISMA_URL
// in case you're using a different provider or a renamed variable.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!connectionString) {
  console.warn(
    'No database connection string found. Checked DATABASE_URL, POSTGRES_URL, POSTGRES_PRISMA_URL — ' +
    'connect a Postgres integration from the Vercel Marketplace (Storage tab) and check the exact env var name it created.'
  );
}

// fullResults:true makes this return { rows, rowCount, ... } like the old
// @vercel/postgres client did, so the rest of the codebase (`const { rows } = await sql\`...\`;`)
// doesn't need to change.
export const sql = neon(connectionString, { fullResults: true });
