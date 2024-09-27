import { describe, it, expect, beforeEach, vi } from "vitest";
import { getOctokit } from "@/lib/github";
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
