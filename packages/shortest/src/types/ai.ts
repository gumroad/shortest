export interface AIConfig {
  apiKey: string;
  model?: string;
  maxMessages?: number;
  debug?: boolean;
}

export interface AIResponse {
  result: 'pass' | 'fail';
  reason: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string | AIMessageContent[];
}

export interface AIMessageContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  tool_use_id?: string;
}