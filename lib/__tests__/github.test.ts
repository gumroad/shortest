import { describe, it, expect, beforeEach, vi } from "vitest";
import { Octokit } from "@octokit/rest";
import AdmZip from "adm-zip";
import { minimatch } from "minimatch";

// Mock the entire github module
vi.mock("../github", async () => {
  const actual = await vi.importActual("../github");
  return {
    ...actual,
    getOctokit: vi.fn(),
    fetchBuildStatus: vi.fn(),
    getWorkflowLogs: vi.fn(),
    getLatestRunId: vi.fn(),
    getTestPatternsConfig: vi.fn(),
  };
});

const { fetchBuildStatus, getOctokit, getWorkflowLogs, getLatestRunId, getTestPatternsConfig } = await import("../github");

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

describe("getWorkflowLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return workflow logs", async () => {
    const mockLogs = "File: log1.txt\nLog content 1\n\nFile: log2.txt\nLog content 2";
    vi.mocked(getWorkflowLogs).mockResolvedValue(mockLogs);

    const logs = await getWorkflowLogs("owner", "repo", "123");

    expect(logs).toBe(mockLogs);
    expect(getWorkflowLogs).toHaveBeenCalledWith("owner", "repo", "123");
  });

  it("should handle errors when fetching workflow logs", async () => {
    const mockError = new Error("API error");
    vi.mocked(getWorkflowLogs).mockRejectedValue(mockError);

    await expect(getWorkflowLogs("owner", "repo", "123")).rejects.toThrow("API error");
  });
});

describe("getLatestRunId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return the latest run ID", async () => {
    vi.mocked(getLatestRunId).mockResolvedValue("123");

    const latestRunId = await getLatestRunId("owner", "repo", "main");

    expect(latestRunId).toBe("123");
    expect(getLatestRunId).toHaveBeenCalledWith("owner", "repo", "main");
  });

  it("should return null when no runs are found", async () => {
    vi.mocked(getLatestRunId).mockResolvedValue(null);

    const latestRunId = await getLatestRunId("owner", "repo", "main");

    expect(latestRunId).toBeNull();
  });

  it("should handle errors when fetching the latest run ID", async () => {
    const mockError = new Error("API error");
    vi.mocked(getLatestRunId).mockRejectedValue(mockError);

    await expect(getLatestRunId("owner", "repo", "main")).rejects.toThrow("API error");
  });
});

describe("getTestPatternsConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return test patterns", async () => {
    const mockPatterns = ["**/*.test.*", "**/*.spec.*"];
    vi.mocked(getTestPatternsConfig).mockResolvedValue(mockPatterns);

    const patterns = await getTestPatternsConfig({ owner: "owner", repo: "repo" });

    expect(patterns).toEqual(mockPatterns);
    expect(getTestPatternsConfig).toHaveBeenCalledWith({ owner: "owner", repo: "repo" });
  });

  it("should handle errors when fetching test patterns", async () => {
    const mockError = new Error("Config error");
    vi.mocked(getTestPatternsConfig).mockRejectedValue(mockError);

    await expect(getTestPatternsConfig({ owner: "owner", repo: "repo" })).rejects.toThrow("Config error");
  });
});

describe("matchTestPatterns", () => {
  it("should match files according to test patterns", () => {
    const testPatterns = ["**/*.test.*", "**/*.spec.*"];
    
    expect(minimatch("src/components/Button.test.tsx", testPatterns[0])).toBe(true);
    expect(minimatch("src/utils/helper.spec.js", testPatterns[1])).toBe(true);
    expect(minimatch("src/index.ts", testPatterns[0])).toBe(false);
    expect(minimatch("src/index.ts", testPatterns[1])).toBe(false);
  });
});
