import { ENV } from "@/env.config";
import * as schema from "@/lib/db/schema";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const client = postgres(ENV.POSTGRES_URL);
export const db = drizzle(client, { schema });
