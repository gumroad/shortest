import { AIConfig } from "./ai";
import { BrowserConfig } from "./browser";

export interface ShortestConfig {
  headless: boolean;
  baseUrl: string;
  testDir: string | string[];
  anthropicKey: string;
  mailosaur?: {
    apiKey: string;
    serverId: string;
  };
}
