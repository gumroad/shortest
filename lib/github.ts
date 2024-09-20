"use server";

import { auth } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";
import { getUserWithGithubToken, updateUserGithubToken } from "./db/queries";

async function getOctokit() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  const user = await getUserWithGithubToken(userId);

  if (!user || !user.githubAccessToken) {
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
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID, // Use NEXT_PUBLIC_ prefix
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/github/callback`, // Add redirect_uri
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("GitHub API error:", errorData);
    throw new Error(`Failed to exchange code for access token: ${errorData.error_description || response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    console.error("GitHub OAuth error:", data);
    throw new Error(`GitHub OAuth error: ${data.error_description || data.error}`);
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

export async function getGitHubRepos() {
  try {
    const octokit = await getOctokit();
    const { data: repos } = await octokit.repos.listForAuthenticatedUser();
    return repos;
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { error: "Failed to fetch GitHub repositories" };
  }
}

export async function getGitHubPullRequests(owner: string, repo: string) {
  if (!owner || !repo) {
    return { error: "Missing owner or repo parameter" };
  }

  try {
    const octokit = await getOctokit();
    const { data: pullRequests } = await octokit.pulls.list({
      owner,
      repo,
      state: "open",
    });
    return pullRequests;
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    return { error: "Failed to fetch GitHub pull requests" };
  }
}
