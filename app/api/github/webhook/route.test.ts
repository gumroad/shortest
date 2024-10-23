import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { POST } from "./route";
import { getOctokit } from "@/lib/github";
import { revalidateTag } from "next/cache";
import type { Mock } from "vitest";

vi.mock("@/lib/github", () => ({
  getOctokit: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

describe("POST", () => {
  let mockRequest: NextRequest;
  let mockOctokit: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOctokit = {};
    (getOctokit as Mock).mockResolvedValue(mockOctokit);
    mockRequest = {
      json: vi.fn(),
      headers: {
        get: vi.fn(),
      },
    } as unknown as NextRequest;
  });

  it("should handle push event", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      repository: { full_name: "test/repo" },
      commits: [],
    });
    const mockGet = vi.fn().mockReturnValue("push");

    mockRequest.json = mockJson;
    mockRequest.headers.get = mockGet;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(getOctokit).toHaveBeenCalled();
    // Add more specific assertions based on the expected behavior
  });

  it("should handle pull request event", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      action: "opened",
      pull_request: { id: "123" },
      repository: { full_name: "test/repo" },
    });
    const mockGet = vi.fn().mockReturnValue("pull_request");

    mockRequest.json = mockJson;
    mockRequest.headers.get = mockGet;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(getOctokit).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith("pullRequest-123");
  });

  it("should handle check run event", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      action: "completed",
      check_run: { pull_requests: [{ id: "456" }] },
      repository: { full_name: "test/repo" },
    });
    const mockGet = vi.fn().mockReturnValue("check_run");

    mockRequest.json = mockJson;
    mockRequest.headers.get = mockGet;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(getOctokit).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith("pullRequest-456");
  });

  it("should handle check suite event", async () => {
    const mockJson = vi.fn().mockResolvedValue({
      action: "completed",
      check_suite: { pull_requests: [{ id: "789" }] },
      repository: { full_name: "test/repo" },
    });
    const mockGet = vi.fn().mockReturnValue("check_suite");

    mockRequest.json = mockJson;
    mockRequest.headers.get = mockGet;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(getOctokit).toHaveBeenCalled();
    expect(revalidateTag).toHaveBeenCalledWith("pullRequest-789");
  });

  it("should handle unhandled event types", async () => {
    const mockJson = vi.fn().mockResolvedValue({});
    const mockGet = vi.fn().mockReturnValue("unhandled_event");

    mockRequest.json = mockJson;
    mockRequest.headers.get = mockGet;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(200);
    expect(getOctokit).toHaveBeenCalled();
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("should handle errors", async () => {
    const mockJson = vi.fn().mockImplementation(() => {
      throw new Error("Test error");
    });
    mockRequest.json = mockJson;

    const response = await POST(mockRequest);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.status).toBe(500);
  });
});
