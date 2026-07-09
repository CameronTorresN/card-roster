import { neon } from '@neondatabase/serverless';

if (!process.env.POSTGRES_URL) {
  // Helpful error instead of a cryptic driver failure if the Neon integration
  // hasn't been connected in the Vercel dashboard yet.
  console.warn('POSTGRES_URL is not set — connect a Postgres integration from the Vercel Marketplace (Storage tab).');
}

// fullResults:true makes this return { rows, rowCount, ... } like the old
// @vercel/postgres client did, so the rest of the codebase (`const { rows } = await sql\`...\`;`)
// doesn't need to change.
export const sql = neon(process.env.POSTGRES_URL, { fullResults: true });
