import { ClaudeResponse } from "@shortest/ai";
import { BrowserAction } from "@shortest/browser";

export interface CacheAction {
  type: "tool_use" | "text";
  name: BrowserAction;
  input: ClaudeResponse;
}

export interface CacheStep {
  reasoning: string; // WHY I DID
  action: CacheAction | null; // WHAT I DID
  timestamp: number; // WHEN I DID
  result: string | null; // OUTCOME
  extras?: any;
}

export interface CacheEntry {
  data: {
    steps?: CacheStep[];
  };
  timestamp: number;
}

export interface CacheStore {
  [key: string]: CacheEntry | undefined;
}
