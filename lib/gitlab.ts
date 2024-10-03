"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { Gitlab } from "@gitbeaker/rest";
import { CommitAction } from '@gitbeaker/core';
import { TestFile } from "../app/(dashboard)/dashboard/types";

export async function getGitlabClient() {
  const { userId } = auth();
  if (!userId) throw new Error("Clerk: User not authenticated");

  const clerk = clerkClient();
  try {
    const [{ token: gitlabToken }] = await clerk.users
      .getUserOauthAccessToken(userId, "oauth_gitlab")
      .then(({ data }) => data);

    if (!gitlabToken) {
      throw new Error("GitLab token not found");
    }

    const gitlab = new Gitlab({
      oauthToken: gitlabToken,
    });

    // Test the token with a simple API call to get current user info
    try {
      await gitlab.Users.showCurrentUser();
    } catch (error: unknown) {
      if (error instanceof Error) {
        const gitlabError = error as { response?: { status?: number } };
        if (gitlabError.response?.status === 403) {
          console.error("GitLab token doesn't have sufficient permissions");
          await clerk.sessions.revokeSession(userId);
          throw new Error("GitLab token invalid or lacks permissions. Please re-authenticate.");
        }
      }
      throw error;
    }

    return gitlab;
  } catch (error: unknown) {
    console.error("Error creating GitLab client:", error);
    if (error instanceof Error) {
      const gitlabError = error as { response?: { status?: number } };
      if (gitlabError.response?.status === 401) {
        // Token might be expired, revoke the session
        await clerk.sessions.revokeSession(userId);
        throw new Error("GitLab authentication expired. Please re-authenticate.");
      }
    }
    throw error;
  }
}

export async function getAssignedMergeRequests() {
  try {
    const gitlab = await getGitlabClient();

    const mergeRequests = await gitlab.MergeRequests.all({
      state: "opened",
      scope: "assigned_to_me",
      order_by: "updated_at",
      sort: "desc",
      per_page: 100,
    });

    const detailedMergeRequests = await Promise.all(
      mergeRequests.map(async (mr) => {
        const [project, pipelines] = await Promise.all([
          gitlab.Projects.show(mr.project_id),
          gitlab.MergeRequests.allPipelines(mr.project_id, mr.iid),
        ]);

        const latestPipeline = pipelines[0];
        const buildStatus = latestPipeline ? latestPipeline.status : "unknown";

        return {
          id: mr.id,
          repoId: project.id,
          gitlabId: mr.iid,
          number: mr.iid,
          title: mr.title,
          state: mr.state,
          createdAt: new Date(mr.created_at),
          updatedAt: new Date(mr.updated_at),
          buildStatus,
          isDraft: mr.work_in_progress,
          owner: project.namespace.path,
          repo: project.path,
          branchName: mr.source_branch,
        };
      })
    );

    return detailedMergeRequests;
  } catch (error) {
    console.error("Error fetching assigned merge requests:", error);
    if (error instanceof Error && error.message.includes("GitLab token expired")) {
      return { error: "GitLab authentication expired. Please re-authenticate." };
    }
    return { error: "Failed to fetch assigned GitLab merge requests" };
  }
}

export async function commitChangesToMergeRequest(
  projectId: number,
  mergeRequestIid: number,
  filesToCommit: TestFile[]
): Promise<string> {
  try {
    const gitlab = await getGitlabClient();

    const mr = await gitlab.MergeRequests.show(projectId, mergeRequestIid);
    const branch = mr.source_branch;

    const actions: CommitAction[] = filesToCommit.map((file) => ({
      action: "update" as const,
      filePath: file.name,
      content: file.content,
    }));

    const commit = await gitlab.Commits.create(
      projectId,
      branch,
      "Update test files",
      actions
    );

    return `https://gitlab.com/${mr.references.full}/commit/${commit.id}`;
  } catch (error) {
    console.error("Error committing changes to merge request:", error);
    if (error instanceof Error && error.message.includes("GitLab token expired")) {
      throw new Error("GitLab authentication expired. Please re-authenticate.");
    }
    throw error;
  }
}

export async function getMergeRequestInfo(
  projectId: number,
  mergeRequestIid: number
) {
  try {
    const gitlab = await getGitlabClient();

    const [mr, diffResponse, repoFiles] = await Promise.all([
      gitlab.MergeRequests.show(projectId, mergeRequestIid),
      gitlab.MergeRequests.allDiffs(projectId, mergeRequestIid),
      gitlab.Repositories.allRepositoryTrees(projectId, { recursive: true }),
    ]);

    const testFiles = await Promise.all(
      repoFiles
        .filter((file) => file.type === "blob" && file.path.toLowerCase().includes(".test."))
        .map(async (file) => {
          const fileContent = await gitlab.RepositoryFiles.show(
            projectId,
            file.path,
            mr.source_branch
          );

          return {
            name: file.path,
            content: Buffer.from(fileContent.content, "base64").toString("utf-8"),
          };
        })
    );

    return {
      diff: diffResponse.map((change) => `${change.diff}`).join("\n"),
      testFiles,
    };
  } catch (error) {
    console.error("Error fetching MR info:", error);
    if (error instanceof Error && error.message.includes("GitLab token expired")) {
      throw new Error("GitLab authentication expired. Please re-authenticate.");
    }
    throw new Error("Failed to fetch MR info");
  }
}