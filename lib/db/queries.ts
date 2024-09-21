"use server";

import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { users, User, NewUser } from "./schema";
import { repos, Repo } from "./schema";
import { auth } from "@clerk/nextjs/server";
import { and, sql } from "drizzle-orm";

export async function updateUserSubscription(
  clerkId: string,
  subscriptionData: {
    stripeSubscriptionId: string | null;
    stripeProductId: string | null;
    planName: string | null;
    subscriptionStatus: string;
  }
) {
  await db
    .update(users)
    .set({
      ...subscriptionData,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, clerkId));
}

export async function getUserByClerkId(clerkId: string): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);

  return result[0] || null;
}

export async function updateUserGithubToken(
  clerkId: string,
  accessToken: string
) {
  await db
    .update(users)
    .set({ githubAccessToken: accessToken })
    .where(eq(users.clerkId, clerkId));
}

export async function createUser(clerkId: string): Promise<User> {
  const newUser: NewUser = {
    clerkId,
    role: "member",
  };

  const [createdUser] = await db.insert(users).values(newUser).returning();
  return createdUser;
}

export async function saveRepos(githubRepos: any[]) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    throw new Error("User not found");
  }

  const reposToInsert = githubRepos.map((repo) => ({
    userId: user.id,
    githubId: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    isPrivate: repo.private,
    isMonitoring: false,
  }));

  await db
    .insert(repos)
    .values(reposToInsert)
    .onConflictDoUpdate({
      target: [repos.userId, repos.githubId],
      set: {
        name: sql`EXCLUDED.name`,
        fullName: sql`EXCLUDED.full_name`,
        isPrivate: sql`EXCLUDED.is_private`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      },
    });
}

export async function updateRepoMonitoring(repoId: number, isMonitoring: boolean) {
  await db
    .update(repos)
    .set({ isMonitoring, updatedAt: new Date() })
    .where(eq(repos.id, repoId));
}

export async function getMonitoringRepos(): Promise<Repo[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return db
    .select()
    .from(repos)
    .where(and(eq(repos.userId, user.id), eq(repos.isMonitoring, true)));
}

export async function getNonMonitoringRepos(): Promise<Repo[]> {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await getUserByClerkId(userId);
  if (!user) {
    throw new Error("User not found");
  }

  return db
    .select()
    .from(repos)
    .where(and(eq(repos.userId, user.id), eq(repos.isMonitoring, false)));
}
