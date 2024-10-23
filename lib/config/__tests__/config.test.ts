import { describe, it, expect, vi, beforeEach } from "vitest";
import { promises as fs } from "fs";
import yaml from "js-yaml";
import {
  getConfig,
  getRepoConfig,
  getTestPatternsConfig,
  _resetConfigForTesting,
} from "../index";
import { DEFAULT_REPO_CONFIG } from "../schema";

vi.mock("fs", () => ({
  promises: {
    readFile: vi.fn(),
  },
  default: {
    promises: {
      readFile: vi.fn(),
    },
  },
}));

vi.mock("js-yaml", () => ({
  default: {
    load: vi.fn(),
  },
  load: vi.fn(),
}));

describe("Config Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    _resetConfigForTesting();
  });

  describe("getConfig", () => {
    it("should return empty config when file does not exist", async () => {
      const error = new Error("File not found");
      (error as NodeJS.ErrnoException).code = "ENOENT";
      vi.mocked(fs.readFile).mockRejectedValueOnce(error);

      const config = await getConfig();
      expect(config).toEqual({});
    });

    it("should return parsed config when file exists", async () => {
      const mockConfig = {
        "owner/repo": {
          test_patterns: ["**/*.test.*"],
        },
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockReturnValueOnce(mockConfig);

      const config = await getConfig();
      expect(config).toEqual(mockConfig);
    });

    it("should throw error on invalid yaml", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockImplementationOnce(() => {
        throw new Error("Invalid YAML");
      });

      await expect(getConfig()).rejects.toThrow("Failed to load configuration");
    });
  });

  describe("getRepoConfig", () => {
    it("should return default config when repo not found", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockReturnValueOnce({});

      const config = await getRepoConfig({ owner: "owner", repo: "repo" });
      expect(config).toEqual({
        repository_name: "owner/repo",
        ...DEFAULT_REPO_CONFIG,
      });
    });

    it("should return repo specific config when found", async () => {
      const mockConfig = {
        "owner/repo": {
          test_patterns: ["**/*.spec.*"],
        },
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockReturnValueOnce(mockConfig);

      const config = await getRepoConfig({ owner: "owner", repo: "repo" });
      expect(config).toEqual({
        test_patterns: ["**/*.spec.*"],
      });
    });
  });

  describe("getTestPatternsConfig", () => {
    it("should return default test patterns when repo not found", async () => {
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockReturnValueOnce({});

      const patterns = await getTestPatternsConfig({
        owner: "owner",
        repo: "repo",
      });
      expect(patterns).toEqual(DEFAULT_REPO_CONFIG.test_patterns);
    });

    it("should return repo specific test patterns when found", async () => {
      const mockConfig = {
        "owner/repo": {
          test_patterns: ["**/*.spec.*", "**/*.test.*"],
        },
      };
      vi.mocked(fs.readFile).mockResolvedValueOnce("mock yaml content");
      vi.mocked(yaml.load).mockReturnValueOnce(mockConfig);

      const patterns = await getTestPatternsConfig({
        owner: "owner",
        repo: "repo",
      });
      expect(patterns).toEqual(["**/*.spec.*", "**/*.test.*"]);
    });
  });
});
