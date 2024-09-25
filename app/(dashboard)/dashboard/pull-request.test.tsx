import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PullRequestItem } from "./pull-request";
import { generateTestsResponseSchema } from "@/app/api/generate-tests/schema";
import { commitChangesToPullRequest, getPullRequestInfo } from "@/lib/github";

vi.mock("@/lib/github", () => ({
  commitChangesToPullRequest: vi.fn(),
  getPullRequestInfo: vi.fn(),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockPullRequest = {
  id: 1,
  title: "Test PR",
  number: 123,
  buildStatus: "success",
  repository: {
    owner: { login: "testuser" },
    name: "testrepo",
  },
};

describe("PullRequestItem", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders pull request information", () => {
    render(<PullRequestItem pullRequest={mockPullRequest} />);
    expect(screen.getByText("Test PR")).toBeInTheDocument();
    expect(screen.getByText("#123")).toBeInTheDocument();
    expect(screen.getByText("Build: success")).toBeInTheDocument();
  });

  it("handles writing new tests", async () => {
    (getPullRequestInfo as jest.Mock).mockResolvedValue({
      diff: "mock diff",
      testFiles: [],
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(generateTestsResponseSchema.parse([{ name: "test.js", content: "test content" }])),
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    fireEvent.click(screen.getByText("Write new tests"));

    await waitFor(() => {
      expect(screen.getByText("Test files")).toBeInTheDocument();
      expect(screen.getByText("test.js")).toBeInTheDocument();
    });
  });

  it("handles updating tests", async () => {
    (getPullRequestInfo as jest.Mock).mockResolvedValue({
      diff: "mock diff",
      testFiles: [{ name: "existing.test.js", content: "existing content" }],
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(generateTestsResponseSchema.parse([{ name: "existing.test.js", content: "updated content" }])),
    });

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    fireEvent.click(screen.getByText("Update tests to fix"));

    await waitFor(() => {
      expect(screen.getByText("Test files")).toBeInTheDocument();
      expect(screen.getByText("existing.test.js")).toBeInTheDocument();
    });
  });

  it("handles committing changes", async () => {
    (getPullRequestInfo as jest.Mock).mockResolvedValue({
      diff: "mock diff",
      testFiles: [],
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(generateTestsResponseSchema.parse([{ name: "test.js", content: "test content" }])),
    });

    (commitChangesToPullRequest as jest.Mock).mockResolvedValue("https://github.com/testuser/testrepo/commit/abc123");

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    fireEvent.click(screen.getByText("Write new tests"));

    await waitFor(() => {
      expect(screen.getByText("Commit changes")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Commit changes"));

    await waitFor(() => {
      expect(commitChangesToPullRequest).toHaveBeenCalled();
    });
  });

  it("handles errors when generating tests", async () => {
    (getPullRequestInfo as jest.Mock).mockRejectedValue(new Error("Failed to fetch PR info"));

    render(<PullRequestItem pullRequest={mockPullRequest} />);

    fireEvent.click(screen.getByText("Write new tests"));

    await waitFor(() => {
      expect(screen.getByText("Failed to generate test files.")).toBeInTheDocument();
    });
  });
});
