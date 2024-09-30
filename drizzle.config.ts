import type { Config } from 'drizzle-kit';
import { ENV } from "@/env.config";

export default {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: ENV.POSTGRES_URL,
  },
} satisfies Config;
