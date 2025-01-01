import { ActionInput } from "./browser";

export interface AIConfig {
  apiKey: string;
  model?: string;
  maxMessages?: number;
  debug?: boolean;
}

export interface AIResponse {
  result: "pass" | "fail";
  reason: string;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string | AIMessageContent[];
}

export interface AIMessageContent {
  type: "text" | "tool_use" | "tool_result";
  text?: string;
  tool_use_id?: string;
}

export interface LLMResponseBash {
  command: string;
}

export interface LLMResponseComputer {
  input: ActionInput;
}

export interface LLMResponse<T> {
  input: T extends LLMResponseBash ? LLMResponseBash : ActionInput;
}
