import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_POSTGRES_URL) {
  throw new Error('SUPABASE_POSTGRES_URL environment variable is not set');
}

export const client = postgres(process.env.SUPABASE_POSTGRES_URL);
export const db = drizzle(client, { schema });
