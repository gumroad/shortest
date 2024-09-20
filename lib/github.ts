"use server";

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Octokit } from "@octokit/rest";

async function getOctokit() {
  const { getToken } = auth();
  const token = await getToken({ template: "github" });
  return new Octokit({ auth: token });
}

export async function getGitHubRepos() {
  const { userId } = auth();

  if (!userId) {
    return { error: "User not authenticated" };
  }

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
  const { userId } = auth();

  if (!userId) {
    return { error: "User not authenticated" };
  }

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
