"use server";

import { auth } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";
import {
  getUserByClerkId,
  updateUserGithubToken,
  createUser,
  saveRepos,
} from "./db/queries";
import { PullRequest } from "./db/schema";

async function getOctokit() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  let user = await getUserByClerkId(userId);

  if (!user) {
    // Create a new user if they don't exist
    user = await createUser(userId);
  }

  console.log("User:", user);

  if (!user.githubAccessToken) {
    throw new Error("GitHub access token not found");
  }

  return new Octokit({ auth: user.githubAccessToken });
}

export async function exchangeCodeForAccessToken(
  code: string
): Promise<string> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/github/callback`,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("GitHub API error:", errorData);
    throw new Error(
      `Failed to exchange code for access token: ${
        errorData.error_description || response.statusText
      }`
    );
  }

  const data = await response.json();

  if (data.error) {
    console.error("GitHub OAuth error:", data);
    throw new Error(
      `GitHub OAuth error: ${data.error_description || data.error}`
    );
  }

  if (!data.access_token) {
    console.error("Unexpected response from GitHub:", data);
    throw new Error("Access token not found in GitHub response");
  }

  return data.access_token;
}

export async function saveGitHubAccessToken(accessToken: string) {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  await updateUserGithubToken(userId, accessToken);
}

export async function getAssignedPullRequests() {
  try {
    const octokit = await getOctokit();
    const { data } = await octokit.search.issuesAndPullRequests({
      q: "is:open is:pr assignee:@me",
      per_page: 100,
      sort: "updated",
      order: "desc",
    });

    console.log("GitHub API response:", data);

    const pullRequests = await Promise.all(
      data.items.map(async (item) => {
        const [owner, repo] = item.repository_url.split("/").slice(-2);
        const { data: prData } = await octokit.pulls.get({
          owner,
          repo,
          pull_number: item.number,
        });

        return {
          id: item.id,
          repoId: item.repository_url,
          githubId: item.id,
          number: item.number,
          title: item.title,
          state: item.state,
          createdAt: new Date(item.created_at),
          updatedAt: new Date(item.updated_at),
          buildStatus: "", // TODO: Fetch build status if needed
          isDraft: prData.draft || false,
          owner,
          repo,
        };
      })
    );

    console.log("Assigned Pull Requests:", pullRequests);
    console.log("Number of assigned PRs:", pullRequests.length);

    // TODO: Update database schema and queries to store pull requests instead of repos
    // await savePullRequests(pullRequests);
    return pullRequests;
  } catch (error) {
    console.error("Error fetching assigned GitHub pull requests:", error);
    return { error: "Failed to fetch assigned GitHub pull requests" };
  }
}
