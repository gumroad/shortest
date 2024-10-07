import { TestFile, PullRequest } from "../app/(dashboard)/dashboard/types";
import * as github from "./github";
import * as gitlab from "./gitlab";

export async function commitChangesToPullRequest(
  pullRequest: PullRequest,
  filesToCommit: TestFile[]
): Promise<string> {
  if (pullRequest.source === 'github') {
    return github.commitChangesToPullRequest(
      pullRequest.repository.owner.login,
      pullRequest.repository.name,
      pullRequest.number,
      filesToCommit
    );
  } else if (pullRequest.source === 'gitlab') {
    return gitlab.commitChangesToMergeRequest(
      pullRequest.repository.id,
      pullRequest.number,
      filesToCommit
    );
  }
  throw new Error(`Unsupported git provider: ${pullRequest.source}`);
}

export async function getPullRequestInfo(pullRequest: PullRequest) {
  if (pullRequest.source === 'github') {
    return github.getPullRequestInfo(
      pullRequest.repository.owner.login,
      pullRequest.repository.name,
      pullRequest.number
    );
  } else if (pullRequest.source === 'gitlab') {
    return gitlab.getMergeRequestInfo(
      pullRequest.repository.id,
      pullRequest.number
    );
  }
  throw new Error(`Unsupported git provider: ${pullRequest.source}`);
}

export async function getFailingTests(pullRequest: PullRequest): Promise<TestFile[]> {
  if (pullRequest.source === 'github') {
    return github.getFailingTests(
      pullRequest.repository.owner.login,
      pullRequest.repository.name,
      pullRequest.number
    );
  } else if (pullRequest.source === 'gitlab') {
    return gitlab.getFailingTests(
      pullRequest.repository.id,
      pullRequest.number
    );
  }
  throw new Error(`Unsupported git provider: ${pullRequest.source}`);
}
