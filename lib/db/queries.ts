import { eq } from "drizzle-orm";
import { db } from "./drizzle";
import { users, User } from "./schema";

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
