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

// TODO: update this to get ALL repos for an authenticated user, currently only gets first 100
export async function getGitHubRepos() {
  try {
    const octokit = await getOctokit();
    const allRepos = await octokit.paginate(
      octokit.rest.repos.listForAuthenticatedUser,
      {
        per_page: 100,
        sort: "updated",
        direction: "desc",
        affiliation: "owner,collaborator,organization_member",
      }
    );

    console.log("Repos:", allRepos);
    console.log("Length of repos:", allRepos.length);

    // Save all repos to the database
    await saveRepos(allRepos);
    return { success: true };
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { error: "Failed to fetch GitHub repositories" };
  }
}

export async function getGitHubPullRequests(
  owner: string,
  repo: string
): Promise<PullRequest[] | { error: string }> {
  if (!owner || !repo) {
    return { error: "Missing owner or repo parameter" };
  }

  try {
    const octokit = await getOctokit();
    const pullRequests = await octokit.paginate(octokit.rest.pulls.list, {
      owner,
      repo,
      state: "open",
      per_page: 100,
    });

    return pullRequests.map((pr) => ({
      id: pr.id,
      repoId: 0, // TODO: update this
      githubId: pr.id,
      number: pr.number,
      title: pr.title,
      state: pr.state,
      createdAt: new Date(pr.created_at),
      updatedAt: new Date(pr.updated_at),
      buildStatus: "", // TODO: update this
      isDraft: pr.draft || false,
    }));
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    return { error: "Failed to fetch GitHub pull requests" };
  }
}
