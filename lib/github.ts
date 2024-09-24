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

        const branchName = pullRequestData.head.ref;

        const buildStatus = await fetchBuildStatus(
          octokit,
          owner,
          repo,
          branchName
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
          branchName,
        };
      })
    );

    return pullRequests;
  } catch (error) {
    console.error("Error fetching assigned pull requests:", error);
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
    const { data } = await octokit.rest.checks.listForRef({
      owner,
      repo,
      ref,
    });

    if (data.check_runs.length === 0) {
      return "pending";
    }

    const statuses = data.check_runs.map((run) => run.conclusion);
    if (statuses.every((status) => status === "success")) {
      return "success";
    } else if (statuses.some((status) => status === "failure")) {
      return "failure";
    } else {
      return "pending";
    }
  } catch (error) {
    console.error("Error fetching build status:", error);
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
    const [diffResponse, repoContentsResponse] = await Promise.all([
      octokit.pulls.get({
        owner,
        repo,
        pull_number: pullNumber,
        mediaType: { format: "diff" },
      }),
      octokit.rest.repos.getContent({
        owner,
        repo,
        path: "",
      }),
    ]);

    const testFiles = [];
    const queue = repoContentsResponse.data as { path: string; type: string }[];

    while (queue.length > 0) {
      const item = queue.shift();
      if (item.type === "dir") {
        const dirContents = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
        });
        queue.push(...(dirContents.data as { path: string; type: string }[]));
      } else if (
        item.type === "file" &&
        item.path.toLowerCase().includes("test.tsx")
      ) {
        const fileContent = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
          mediaType: { format: "raw" },
        });
        testFiles.push({
          name: item.path,
          content: fileContent.data as string,
        });
      }
    }

    return {
      diff: diffResponse.data,
      testFiles,
    };
  } catch (error) {
    console.error("Error fetching PR info:", error);
    throw new Error("Failed to fetch PR info");
  }
}
