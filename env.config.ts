import { config } from "dotenv";
import path from "path";

// This is to make sure environment variables are recognized 
// outside of Next.js runtime.
// https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#loading-environment-variables-with-nextenv

// Matches Vercel's environment priority
// https://nextjs.org/docs/app/building-your-application/configuring/environment-variables#environment-variable-load-order
const NODE_ENV = process.env.NODE_ENV || "development";
const envFiles = [
  `.env.${NODE_ENV}.local`,
  ...(NODE_ENV !== "test" ? [".env.local"] : []),
  `.env.${NODE_ENV}`,
  ".env",
].map((file) => path.resolve(process.cwd(), file));

config({
  path: envFiles,
  override: false,
});

// Add all environment variables from .env.local (or .env) here for type safety
const ENV_VARIABLES = [
  "NEXT_PUBLIC_BASE_URL",
  "BASE_URL",
  "CLERK_SIGN_IN_FALLBACK_REDIRECT_URL",

  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",

  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",

  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NO_SSL",
  "POSTGRES_URL_NON_POOLING",
  "POSTGRES_USER",
  "POSTGRES_HOST",
  "POSTGRES_PASSWORD",
  "POSTGRES_DATABASE",

  "ANTHROPIC_API_KEY",
] as const;

const getRequiredEnvVar = <T extends string>(key: string): T => {
  const value = process.env[key];
  if (value === undefined || value.trim() === "") {
    throw new Error(
      `\x1b[41m\x1b[37m ERROR \x1b[0m Environment variable "${key}" is missing or empty!`
    );
  }
  return value as T;
};

type EnvVarKey = (typeof ENV_VARIABLES)[number];

export const ENV: Record<EnvVarKey, string> = Object.fromEntries(
  ENV_VARIABLES.map((key) => [key, getRequiredEnvVar(key)])
) as Record<EnvVarKey, string>;
