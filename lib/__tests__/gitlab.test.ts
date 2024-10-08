import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGitlabClient } from "../gitlab";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { Gitlab } from "@gitbeaker/rest";

vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
}));
vi.mock("@gitbeaker/rest", () => ({
  Gitlab: vi.fn(),
}));

describe("getGitlabClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return a Gitlab instance when user is authenticated", async () => {
    const mockUserId = "user_123";
    const mockGitlabToken = "gitlab_token_123";
    vi.mocked(auth).mockReturnValue({ userId: mockUserId } as any);
    const mockClerkClient = {
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({
          data: [{ token: mockGitlabToken }],
        }),
      },
      sessions: { revokeSession: vi.fn() },
    };
    vi.mocked(clerkClient).mockReturnValue(mockClerkClient as any);
    const mockGitlabInstance = { Users: { showCurrentUser: vi.fn() } };
    vi.mocked(Gitlab).mockReturnValue(mockGitlabInstance as any);

    const result = await getGitlabClient();

    expect(result).toEqual(mockGitlabInstance);
    expect(Gitlab).toHaveBeenCalledWith({ oauthToken: mockGitlabToken });
    expect(mockGitlabInstance.Users.showCurrentUser).toHaveBeenCalled();
  });

  it("should throw an error when user is not authenticated", async () => {
    vi.mocked(auth).mockReturnValue({ userId: null } as any);
    await expect(getGitlabClient()).rejects.toThrow("Clerk: User not authenticated");
  });

  it("should throw an error when Clerk fails to return a GitLab token", async () => {
    const mockUserId = "user_123";
    vi.mocked(auth).mockReturnValue({ userId: mockUserId } as any);
    vi.mocked(clerkClient).mockReturnValue({
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({ data: [] }),
      },
      sessions: { revokeSession: vi.fn() },
    } as any);

    await expect(getGitlabClient()).rejects.toThrowError("GitLab token not found");
  });

  it("should revoke session and throw error when GitLab token is invalid", async () => {
    const mockUserId = "user_123";
    const mockGitlabToken = "invalid_gitlab_token";
    vi.mocked(auth).mockReturnValue({ userId: mockUserId } as any);
    const revokeSessionMock = vi.fn();
    vi.mocked(clerkClient).mockReturnValue({
      users: {
        getUserOauthAccessToken: vi.fn().mockResolvedValue({
          data: [{ token: mockGitlabToken }],
        }),
      },
      sessions: { revokeSession: revokeSessionMock },
    } as any);
    vi.mocked(Gitlab).mockReturnValue({
      Users: {
        showCurrentUser: vi.fn().mockRejectedValue({
          response: { status: 403 },
        }),
      },
    } as any);

    await expect(getGitlabClient()).rejects.toThrowError("GitLab token invalid or lacks permissions. Please re-authenticate.");
    expect(revokeSessionMock).toHaveBeenCalledWith(mockUserId);
  });
});
