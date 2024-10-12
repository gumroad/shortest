import { describe, it, expect, beforeEach, vi } from "vitest";
import { Octokit } from "@octokit/rest";

// Mock the entire github module
vi.mock("../github", async () => {
  const actual = await vi.importActual("../github");
  return {
    ...actual,
    getOctokit: vi.fn(),
    fetchBuildStatus: vi.fn(),
  };
});

const { fetchBuildStatus, getOctokit } = await import("../github");

describe("fetchBuildStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return the pull request with build status", async () => {
    const mockPullRequest = {
      id: 1,
      title: "Test PR",
      number: 123,
      draft: false,
      head: { ref: "feature-branch" },
      base: {
        repo: {
          id: 1,
          name: "test-repo",
          full_name: "owner/test-repo",
          owner: { login: "owner" },
        },
      },
    };

    const mockBuildStatus = "success";

    vi.mocked(fetchBuildStatus).mockResolvedValue({
      id: mockPullRequest.id,
      title: mockPullRequest.title,
      number: mockPullRequest.number,
      buildStatus: mockBuildStatus,
      isDraft: mockPullRequest.draft,
      branchName: mockPullRequest.head.ref,
      repository: {
        id: mockPullRequest.base.repo.id,
        name: mockPullRequest.base.repo.name,
        full_name: mockPullRequest.base.repo.full_name,
        owner: {
          login: mockPullRequest.base.repo.owner.login,
        },
      },
    });

    const result = await fetchBuildStatus("owner", "test-repo", 123);

    expect(result).toEqual({
      id: 1,
      title: "Test PR",
      number: 123,
      buildStatus: "success",
      isDraft: false,
      branchName: "feature-branch",
      repository: {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        owner: {
          login: "owner",
        },
      },
    });

    expect(fetchBuildStatus).toHaveBeenCalledWith("owner", "test-repo", 123);
  });

  it("should return 'running' build status when a check is in progress", async () => {
    vi.mocked(fetchBuildStatus).mockResolvedValue({
      id: 1,
      title: "Test PR",
      number: 123,
      buildStatus: "running",
      isDraft: false,
      branchName: "feature-branch",
      repository: {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        owner: {
          login: "owner",
        },
      },
    });

    const result = await fetchBuildStatus("owner", "test-repo", 123);

    expect(result.buildStatus).toBe("running");
  });

  it("should return 'failure' build status when a check has failed", async () => {
    vi.mocked(fetchBuildStatus).mockResolvedValue({
      id: 1,
      title: "Test PR",
      number: 123,
      buildStatus: "failure",
      isDraft: false,
      branchName: "feature-branch",
      repository: {
        id: 1,
        name: "test-repo",
        full_name: "owner/test-repo",
        owner: {
          login: "owner",
        },
      },
    });

    const result = await fetchBuildStatus("owner", "test-repo", 123);

    expect(result.buildStatus).toBe("failure");
  });

  it("should handle errors and throw them", async () => {
    const mockError = new Error("API error");
    vi.mocked(fetchBuildStatus).mockRejectedValue(mockError);

    await expect(fetchBuildStatus("owner", "test-repo", 123)).rejects.toThrow("API error");
  });
});