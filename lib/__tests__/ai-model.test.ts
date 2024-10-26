import { describe, it, expect, vi, beforeEach } from "vitest";
import { getModelInstance, getAiModels } from "../ai-models";

describe("AI Model Utils", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getModelInstance", () => {
    it("should throw an error for unsupported models", () => {
      expect(() => getModelInstance("unsupported-model")).toThrowError("Model unsupported-model not supported");
    });
  });

  describe("getAiModels", () => {
    beforeEach(() => {
      // Reset env variables before each test
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
      delete process.env.OPENAI_API_KEY;
    });

    it("should return an empty array if no API keys are set", () => {
      const models = getAiModels();
      expect(models).toEqual([]);
    });

    it("should return Anthropic models when ANTHROPIC_API_KEY is set", () => {
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
      const models = getAiModels();
      expect(models).toContain("claude-3-5-sonnet-20240620");
      expect(models).toContain("claude-3-opus");
      expect(models).toContain("claude-3.5-sonnet");
    });

    it("should return Google models when GOOGLE_GENERATIVE_AI_API_KEY is set", () => {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
      const models = getAiModels();
      expect(models).toContain("gemini-1.5-pro");
      expect(models).toContain("gemini-1.5-flash");
      expect(models).toContain("gemini-1.5-flash-002");
      expect(models).toContain("gemini-1.5-flash-8b");
      expect(models).toContain("gemini-1.5-pro-002");
    });

    it("should return OpenAI models when OPENAI_API_KEY is set", () => {
      process.env.OPENAI_API_KEY = "test-openai-key";
      const models = getAiModels();
      expect(models).toContain("gpt-3.5-turbo");
      expect(models).toContain("gpt-4o");
      expect(models).toContain("gpt-4");
      expect(models).toContain("gpt-4o-mini");
      expect(models).toContain("o1-mini");
      expect(models).toContain("o1-preview");
    });

    it("should return models from all providers when all API keys are set", () => {
      process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-google-key";
      process.env.OPENAI_API_KEY = "test-openai-key";
      const models = getAiModels();
      expect(models).toContain("claude-3-5-sonnet-20240620");
      expect(models).toContain("gemini-1.5-pro");
      expect(models).toContain("gpt-3.5-turbo");
    });
  });
});
