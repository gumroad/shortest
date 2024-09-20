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
      client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID, // Use NEXT_PUBLIC_ prefix
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/github/callback`, // Add redirect_uri
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

export async function getGitHubRepos() {
  try {
    const octokit = await getOctokit();
    let allRepos: Awaited<
      ReturnType<typeof octokit.rest.repos.listForAuthenticatedUser>
    >["data"] = [];
    let page = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const { data: repos, headers } =
        await octokit.repos.listForAuthenticatedUser({
          per_page: 100,
          page: page,
          type: "all", // This will fetch both public and private repos
        });

      allRepos = allRepos.concat(repos);

      // Check if there's a next page
      const links = parseLinkHeader(headers.link ?? null);
      hasNextPage = !!links.next;
      page++;

      // TODO: this needs to get private and public and get all of them, not just 100

      console.log("Repos:", allRepos);
      console.log("Headers:", headers);
      console.log("Length of repos:", allRepos.length);
    }

    // Save all repos to the database
    await saveRepos(allRepos);
    return { success: true };
  } catch (error) {
    console.error("Error fetching GitHub repos:", error);
    return { error: "Failed to fetch GitHub repositories" };
  }
}

// Helper function to parse the Link header
function parseLinkHeader(header: string | null): { [key: string]: string } {
  if (!header) return {};
  const links = header.split(",");
  const parsed: { [key: string]: string } = {};
  links.forEach((link) => {
    const match = link.match(/<(.+)>;\s*rel="(\w+)"/);
    if (match) parsed[match[2]] = match[1];
  });
  return parsed;
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
    const { data: pullRequests } = await octokit.pulls.list({
      owner,
      repo,
      state: "open",
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
      isDraft: false, // TODO: update this
    }));
  } catch (error) {
    console.error("Error fetching GitHub pull requests:", error);
    return { error: "Failed to fetch GitHub pull requests" };
  }
}
