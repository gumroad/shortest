import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { users } from "./schema";

export async function getGitHubRepos() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await currentUser();
  if (!user) {
    throw new Error("User not authenticated");
  }

  const githubToken = user.publicMetadata.githubToken;
  if (!githubToken) {
    throw new Error("GitHub token not found");
  }

  const response = await fetch("https://api.github.com/user/repos", {
    headers: {
      Authorization: `token ${githubToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch GitHub repositories");
  }

  const repos = await response.json();
  return repos;
}

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
