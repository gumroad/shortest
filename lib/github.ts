"use server";

import { auth } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";
import {
  getUserByClerkId,
  updateUserGithubToken,
  createUser,
} from "./db/queries";
import { PullRequest, TestFile } from "./db/schema";

async function getOctokit() {
  const { userId } = auth();
  if (!userId) {
    throw new Error("User not authenticated");
  }

  let user = await getUserByClerkId(userId);

  if (!user) {
    user = await createUser(userId);
  }

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
    throw new Error(
      `Failed to exchange code for access token: ${
        errorData.error_description || response.statusText
      }`
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(
      `GitHub OAuth error: ${data.error_description || data.error}`
    );
  }

  if (!data.access_token) {
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

    const { data } = await octokit.rest.search.issuesAndPullRequests({
      q: "is:pr is:open assignee:@me",
      sort: "updated",
      order: "desc",
      per_page: 100,
    });

    const pullRequests = await Promise.all(
      data.items.map(async (pr) => {
        const [owner, repo] = pr.repository_url.split("/").slice(-2);

        const { data: pullRequestData } = await octokit.pulls.get({
          owner,
          repo,
          pull_number: pr.number,
        });

        const latestCommitSha = pullRequestData.head.sha;

        const buildStatus = await fetchBuildStatus(
          octokit,
          owner,
          repo,
          latestCommitSha
        );

        return {
          id: pr.id,
          repoId: pr.repository_url,
          githubId: pr.id,
          number: pr.number,
          title: pr.title,
          state: pr.state,
          createdAt: new Date(pr.created_at),
          updatedAt: new Date(pr.updated_at),
          buildStatus,
          isDraft: pr.draft || false,
          owner,
          repo,
        };
      })
    );

    return pullRequests;
  } catch (error) {
    return { error: "Failed to fetch assigned GitHub pull requests" };
  }
}

async function fetchBuildStatus(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
): Promise<string> {
  try {
    const { data } = await octokit.rest.repos.getCombinedStatusForRef({
      owner,
      repo,
      ref,
    });

    return data.state;
  } catch (error) {
    return "unknown";
  }
}

export async function commitChangesToPullRequest(
  owner: string,
  repo: string,
  pullNumber: number,
  filesToCommit: TestFile[]
) {
  const octokit = await getOctokit();

  const { data: pr } = await octokit.pulls.get({
    owner,
    repo,
    pull_number: pullNumber,
  });

  const baseSha = pr.base.sha;

  const tree = await Promise.all(
    filesToCommit.map(async (file) => {
      return {
        path: file.name,
        mode: "100644" as const,
        type: "blob" as const,
        content: file.newContent,
      };
    })
  );

  const { data: newTree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree,
  });

  const { data: newCommit } = await octokit.git.createCommit({
    owner,
    repo,
    message: "Update test files",
    tree: newTree.sha,
    parents: [baseSha],
  });

  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${pr.head.ref}`,
    sha: newCommit.sha,
  });
}

export async function getPullRequestInfo(
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = await getOctokit();

  try {
    const [diffResponse, filesResponse] = await Promise.all([
      octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: { format: "diff" },
      }),
      octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: pullNumber,
      }),
    ]);

    const testFiles = filesResponse.data
      .filter(
        (file) =>
          file.filename.toLowerCase().includes("test") ||
          file.filename.toLowerCase().includes("spec")
      )
      .map((file) => ({
        name: file.filename,
        content: file.patch || "",
      }));

    return {
      diff: diffResponse.data,
      testFiles,
    };
  } catch (error) {
    throw new Error("Failed to fetch PR info");
  }
}
