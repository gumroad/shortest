import { describe, it, expect, beforeEach, vi } from "vitest";
import { getOctokit, fetchBuildStatus } from "@/lib/github";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Octokit } from "@octokit/rest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));

vi.mock("@octokit/rest", () => ({
  Octokit: vi.fn(),
}));

describe("getOctokit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return an Octokit instance when user is authenticated", async () => {
    const mockUserId = "user_123";
    const mockGithubToken = "github_token_123";
    vi.mocked(auth).mockReturnValue({ userId: mockUserId } as any);
    vi.mocked(clerkClient).mockReturnValue({
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({
          data: [{ token: mockGithubToken }],
        }),
      },
    } as any);

    const result = await getOctokit();

    expect(result).toBeInstanceOf(Octokit);
    expect(Octokit).toHaveBeenCalledWith({ auth: mockGithubToken });
  });

  it("should throw an error when user is not authenticated", async () => {
    vi.mocked(auth).mockReturnValue({ userId: null } as any);

    await expect(getOctokit()).rejects.toThrow("Clerk: User not authenticated");
  });

  it("should throw an error when Clerk fails to return a GitHub token", async () => {
    const mockUserId = "user_123";
    vi.mocked(auth).mockReturnValue({ userId: mockUserId } as any);
    vi.mocked(clerkClient).mockReturnValue({
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({
          data: [],
        }),
      },
    } as any);

    await expect(getOctokit()).rejects.toThrow();
  });
});

describe("fetchBuildStatus", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch and return the pull request with build status", async () => {
    const mockOctokit = {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: {
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
          },
        }),
      },
      checks: {
        listForRef: vi.fn().mockResolvedValue({
          data: {
            check_runs: [
              { status: "completed", conclusion: "success" },
              { status: "completed", conclusion: "success" },
            ],
          },
        }),
      },
    };

    vi.mocked(getOctokit).mockResolvedValue(mockOctokit as any);

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

    expect(mockOctokit.pulls.get).toHaveBeenCalledWith({
      owner: "owner",
      repo: "test-repo",
      pull_number: 123,
    });

    expect(mockOctokit.checks.listForRef).toHaveBeenCalledWith({
      owner: "owner",
      repo: "test-repo",
      ref: "feature-branch",
    });
  });

  it("should return 'running' build status when a check is in progress", async () => {
    const mockOctokit = {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: {
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
          },
        }),
      },
      checks: {
        listForRef: vi.fn().mockResolvedValue({
          data: {
            check_runs: [
              { status: "in_progress", conclusion: null },
              { status: "completed", conclusion: "success" },
            ],
          },
        }),
      },
    };

    vi.mocked(getOctokit).mockResolvedValue(mockOctokit as any);

    const result = await fetchBuildStatus("owner", "test-repo", 123);

    expect(result.buildStatus).toBe("running");
  });

  it("should return 'failure' build status when a check has failed", async () => {
    const mockOctokit = {
      pulls: {
        get: vi.fn().mockResolvedValue({
          data: {
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
          },
        }),
      },
      checks: {
        listForRef: vi.fn().mockResolvedValue({
          data: {
            check_runs: [
              { status: "completed", conclusion: "failure" },
              { status: "completed", conclusion: "success" },
            ],
          },
        }),
      },
    };

    vi.mocked(getOctokit).mockResolvedValue(mockOctokit as any);

    const result = await fetchBuildStatus("owner", "test-repo", 123);

    expect(result.buildStatus).toBe("failure");
  });

  it("should handle errors and throw them", async () => {
    const mockError = new Error("API error");
    const mockOctokit = {
      pulls: {
        get: vi.fn().mockRejectedValue(mockError),
      },
    };

    vi.mocked(getOctokit).mockResolvedValue(mockOctokit as any);

    await expect(fetchBuildStatus("owner", "test-repo", 123)).rejects.toThrow("API error");
  });
});
