"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";
import { TestFile, PullRequest } from "../app/(dashboard)/dashboard/types";

export async function getOctokit() {
  const { userId } = auth();
  if (!userId) throw new Error("Clerk: User not authenticated");

  const clerk = clerkClient();
  const [{ token: githubToken }] = await clerk.users
    .getUserOauthAccessToken(userId, "oauth_github")
    .then(({ data }) => data);

  return new Octokit({ auth: githubToken });
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

        const buildStatus = await fetchBuildStatusForRef(
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

export async function fetchBuildStatus(owner: string, repo: string, pullNumber: number): Promise<PullRequest> {
  const octokit = await getOctokit();

  try {
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const buildStatus = await fetchBuildStatusForRef(octokit, owner, repo, pr.head.ref);

    return {
      id: pr.id,
      title: pr.title,
      number: pr.number,
      buildStatus,
      isDraft: pr.draft || false,
      branchName: pr.head.ref,
      repository: {
        id: pr.base.repo.id,
        name: pr.base.repo.name,
        full_name: pr.base.repo.full_name,
        owner: {
          login: pr.base.repo.owner.login,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching build status:", error);
    throw error;
  }
}

async function fetchBuildStatusForRef(
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

    const statuses = data.check_runs.map((run) => run.status);
    if (statuses.some((status) => status === "in_progress")) {
      return "running";
    }

    const conclusions = data.check_runs.map((run) => run.conclusion);
    if (conclusions.every((conclusion) => conclusion === "success")) {
      return "success";
    } else if (conclusions.some((conclusion) => conclusion === "failure")) {
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
  filesToCommit: TestFile[],
  commitMessage: string
): Promise<string> {
  const octokit = await getOctokit();

  try {
    const { data: pr } = await octokit.pulls.get({
      owner,
      repo,
      pull_number: pullNumber,
    });

    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${pr.head.ref}`,
    });

    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: ref.object.sha,
    });

    const { data: currentTree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commit.tree.sha,
      recursive: "true",
    });

    const updatedTree = currentTree.tree.map((item) => ({
      path: item.path,
      mode: item.mode,
      type: item.type,
      sha: item.sha,
    }));

    for (const file of filesToCommit) {
      const { data: blob } = await octokit.git.createBlob({
        owner,
        repo,
        content: file.content,
        encoding: "utf-8",
      });

      const existingFileIndex = updatedTree.findIndex(
        (item) => item.path === file.name
      );
      if (existingFileIndex !== -1) {
        updatedTree[existingFileIndex] = {
          path: file.name,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        };
      } else {
        updatedTree.push({
          path: file.name,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
      }
    }

    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      tree: updatedTree as any,
      base_tree: commit.tree.sha,
    });

    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage,
      tree: newTree.sha,
      parents: [commit.sha],
    });

    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${pr.head.ref}`,
      sha: newCommit.sha,
    });

    return `https://github.com/${owner}/${repo}/commit/${newCommit.sha}`;
  } catch (error) {
    console.error("Error committing changes to pull request:", error);
    throw error;
  }
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
      if (item && item.type === "dir") {
        const dirContents = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
        });
        queue.push(...(dirContents.data as { path: string; type: string }[]));
      } else if (
        item &&
        item.type === "file" &&
        item.path.toLowerCase().includes(".test.")
      ) {
        const fileContent = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: item.path,
        });

        if (
          "content" in fileContent.data &&
          typeof fileContent.data.content === "string"
        ) {
          const decodedContent = Buffer.from(
            fileContent.data.content,
            "base64"
          ).toString("utf-8");
          testFiles.push({
            name: item.path,
            content: decodedContent,
          });
        }
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

export async function getFailingTests(
  owner: string,
  repo: string,
  pullNumber: number
): Promise<TestFile[]> {
  const octokit = await getOctokit();

  try {
    const { data: checkRuns } = await octokit.checks.listForRef({
      owner,
      repo,
      ref: `refs/pull/${pullNumber}/head`,
      status: 'completed',
      filter: 'latest',
    });

    const failedChecks = checkRuns.check_runs.filter(
      (run) => run.conclusion === 'failure'
    );

    const failingTestFiles: TestFile[] = [];
    for (const check of failedChecks) {
      if (check.output.annotations_count > 0) {
        const { data: annotations } = await octokit.checks.listAnnotations({
          owner,
          repo,
          check_run_id: check.id,
        });

        for (const annotation of annotations) {
          if (annotation.path.includes('test') || annotation.path.includes('spec')) {
            const { data: fileContent } = await octokit.repos.getContent({
              owner,
              repo,
              path: annotation.path,
              ref: `refs/pull/${pullNumber}/head`,
            });

            if ('content' in fileContent) {
              failingTestFiles.push({
                name: annotation.path,
                content: Buffer.from(fileContent.content, 'base64').toString('utf-8'),
              });
            }
          }
        }
      }
    }

    return failingTestFiles;
  } catch (error) {
    console.error('Error fetching failing tests:', error);
    throw error;
  }
}