import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import DashboardPage from "./page";
import { getAssignedPullRequests } from "@/lib/github";

vi.mock("@/lib/github", () => ({
  getAssignedPullRequests: vi.fn(),
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

vi.mock("./pull-request", () => ({
  PullRequestItem: ({ pullRequest }: { pullRequest: any }) => (
    <div data-testid={`pr-${pullRequest.id}`}>{pullRequest.title}</div>
  ),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders loading state initially", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders pull requests when loaded successfully", async () => {
    const mockPullRequests = [
      { id: 1, title: "PR 1", repository: { full_name: "repo1" } },
      { id: 2, title: "PR 2", repository: { full_name: "repo2" } },
    ];
    (getAssignedPullRequests as jest.Mock).mockResolvedValue(mockPullRequests);

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Your Pull Requests")).toBeInTheDocument();
    });

    expect(screen.getByTestId("pr-1")).toBeInTheDocument();
    expect(screen.getByTestId("pr-2")).toBeInTheDocument();
  });

  it("renders error message when loading fails", async () => {
    (getAssignedPullRequests as jest.Mock).mockRejectedValue(new Error("Failed to fetch"));

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText("Error loading pull requests")).toBeInTheDocument();
    });
  });

  it("renders reconnect button when GitHub token is invalid", async () => {
    (getAssignedPullRequests as jest.Mock).mockResolvedValue({ error: "GitHub token invalid" });

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /reconnect to github/i })).toBeInTheDocument();
    });
  });
});
