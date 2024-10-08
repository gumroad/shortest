import { describe, it, expect, vi, beforeEach } from "vitest";
import * as github from "../github";
import * as gitlab from "../gitlab";
import * as actions from "../gitProviderActions";
import { PullRequest } from "../../app/(dashboard)/dashboard/types";

vi.mock("../github");
vi.mock("../gitlab");

describe("commitChangesToPullRequest", () => {
  const mockPullRequest: PullRequest = {
    id: 1,
    title: "Test PR",
    number: 123,
    buildStatus: "success",
    isDraft: false,
    branchName: "main",
    source: "github",
    repository: {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      owner: { login: "owner" },
    },
  };

  const mockFilesToCommit = [
    { name: "test1.ts", content: "test content 1" },
  ];
  const mockCommitMessage = "Test commit message";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call github.commitChangesToPullRequest for GitHub PRs", async () => {
    await actions.commitChangesToPullRequest(mockPullRequest, mockFilesToCommit, mockCommitMessage);
    expect(github.commitChangesToPullRequest).toHaveBeenCalledWith(
      "owner",
      "test-repo",
      123,
      mockFilesToCommit,
      mockCommitMessage
    );
  });

  it("should call gitlab.commitChangesToMergeRequest for GitLab MRs", async () => {
    const gitlabMR = { ...mockPullRequest, source: "gitlab", repository: {id: 1234} };
    await actions.commitChangesToPullRequest(gitlabMR, mockFilesToCommit, mockCommitMessage);
    expect(gitlab.commitChangesToMergeRequest).toHaveBeenCalledWith(
      1234,
      123,
      mockFilesToCommit,
      mockCommitMessage
    );
  });

  it("should throw error for unsupported git providers", async () => {
    const unsupportedPR = { ...mockPullRequest, source: "bitbucket" as any };
    await expect(
      actions.commitChangesToPullRequest(unsupportedPR, mockFilesToCommit, mockCommitMessage)
    ).rejects.toThrowError("Unsupported git provider: bitbucket");
  });
});

describe("getPullRequestInfo", () => {
    const mockPullRequest: PullRequest = {
      id: 1,
      title: "Test PR",
      number: 123,
      buildStatus: "success",
      isDraft: false,
      branchName: "main",
      source: "github",
      repository: {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        owner: { login: "owner" },
      },
    };
  
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it('should call getPullRequestInfo with correct arguments for GitHub', async () => {
      await actions.getPullRequestInfo(mockPullRequest);
      expect(github.getPullRequestInfo).toHaveBeenCalledWith("owner", "test-repo", 123);
    });
  
    it('should call getMergeRequestInfo with correct arguments for GitLab', async () => {
      const gitlabMR = { ...mockPullRequest, source: "gitlab", repository: {id: 1234} };
      await actions.getPullRequestInfo(gitlabMR);
      expect(gitlab.getMergeRequestInfo).toHaveBeenCalledWith(1234, 123);
    });
  
    it('should throw error for unsupported provider in getPullRequestInfo', async () => {
      const unsupportedPR = { ...mockPullRequest, source: "bitbucket" as any };
      await expect(actions.getPullRequestInfo(unsupportedPR)).rejects.toThrowError("Unsupported git provider: bitbucket");
    });
  });

describe("getFailingTests", () => {
  const mockPullRequest: PullRequest = {
    id: 1,
    title: "Test PR",
    number: 123,
    buildStatus: "success",
    isDraft: false,
    branchName: "main",
    source: "github",
    repository: {
      id: 1,
      name: "test-repo",
      full_name: "owner/test-repo",
      owner: { login: "owner" },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call getFailingTests with correct arguments for GitHub', async () => {
    await actions.getFailingTests(mockPullRequest);
    expect(github.getFailingTests).toHaveBeenCalledWith("owner", "test-repo", 123);
  });

  it('should call getFailingTests with correct arguments for GitLab', async () => {
    const gitlabMR = { ...mockPullRequest, source: "gitlab", repository: {id: 1234} };
    await actions.getFailingTests(gitlabMR);
    expect(gitlab.getFailingTests).toHaveBeenCalledWith(1234, 123);
  });

  it('should throw error for unsupported provider in getFailingTests', async () => {
    const unsupportedPR = { ...mockPullRequest, source: "bitbucket" as any };
    await expect(actions.getFailingTests(unsupportedPR)).rejects.toThrowError("Unsupported git provider: bitbucket");
  });
});
