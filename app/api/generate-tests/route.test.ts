import { describe, it, expect, vi } from "vitest";
import { POST } from "./route";
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { TestFileSchema } from "./route";

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn().mockReturnValue("mocked-anthropic-model"),
}));

vi.mock("ai", () => ({
  streamObject: vi.fn(),
}));

describe("POST /api/generate-tests", () => {
  it("should handle POST requests correctly", async () => {
    const mockRequest = {
      json: vi.fn().mockResolvedValue({
        mode: "write",
        pr_diff: "mock diff",
        test_files: [],
      }),
    };

    const mockStreamObjectResult = {
      toTextStreamResponse: vi.fn().mockReturnValue(new Response()),
      object: {
        tests: [
          {
            name: "test1.ts",
            content: "// Test content",
          },
        ],
      },
    };

    vi.mocked(streamObject).mockResolvedValue(mockStreamObjectResult as any);

    const response = await POST(mockRequest as unknown as Request);

    expect(anthropic).toHaveBeenCalledWith("claude-3-5-sonnet-20240620");
    expect(streamObject).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "mocked-anthropic-model",
        output: "object",
        schema: TestFileSchema,
        prompt: expect.stringContaining("You are an expert software engineer"),
      })
    );
    expect(mockStreamObjectResult.toTextStreamResponse).toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
  });

  it("should handle errors correctly", async () => {
    const mockRequest = {
      json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
    };

    await expect(POST(mockRequest as unknown as Request)).rejects.toThrow(
      "Invalid JSON"
    );
  });
});
