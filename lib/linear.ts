"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { LinearClient } from '@linear/sdk';


export async function getLinearClient() {
  const { userId } = auth();
  if (!userId) throw new Error("Clerk: User not authenticated");

  const clerk = clerkClient();
  const [{ token: linearToken }] = await clerk.users
    .getUserOauthAccessToken(userId, "oauth_linear")
    .then(({ data }) => data);

  return new LinearClient({ apiKey: linearToken });
}

export async function searchIssues(query: string) {
  const client = await getLinearClient();

  const issues = await client.issues({
    filter: {
      title: { contains: query }
    },
    first: 5
  })

  return issues.nodes.map(issue => ({
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    description: issue.description,
  }));
}
