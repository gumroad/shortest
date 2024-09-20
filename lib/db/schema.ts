import { drizzle } from "drizzle-orm/vercel-postgres";
import { sql } from "@vercel/postgres";
import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

// Use this object to send drizzle queries to your DB
export const db = drizzle(sql);

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    clerkId: varchar("clerk_id", { length: 255 }).notNull(),
    stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
    stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
    stripeProductId: varchar("stripe_product_id", { length: 255 }),
    planName: varchar("plan_name", { length: 100 }),
    subscriptionStatus: varchar("subscription_status", { length: 20 }),
    name: varchar("name", { length: 100 }),
    role: varchar("role", { length: 20 }).notNull().default("member"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
    githubAccessToken: varchar("github_access_token", { length: 255 }),
  },
  (users) => ({
    uniqueClerkId: uniqueIndex("unique_clerk_id").on(users.clerkId),
  })
);

export const repos = pgTable(
  "repos",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    githubId: integer("github_id").notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    isPrivate: boolean("is_private").notNull(),
    isMonitoring: boolean("is_monitoring").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    userGithubIdIdx: uniqueIndex("user_github_id_idx").on(
      table.userId,
      table.githubId
    ),
  })
);

export const pullRequests = pgTable("pull_requests", {
  id: serial("id").primaryKey(),
  repoId: integer("repo_id").notNull(),
  githubId: integer("github_id").notNull(),
  number: integer("number").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  state: varchar("state", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Repo = typeof repos.$inferSelect;
export type NewRepo = typeof repos.$inferInsert;
export type PullRequest = typeof pullRequests.$inferSelect;
export type NewPullRequest = typeof pullRequests.$inferInsert;

export const getExampleTable = async () => {
  const selectResult = await db.select().from(users);
  console.log("Results", selectResult);
};
