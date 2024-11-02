export interface AIResponse {
  result: 'pass' | 'fail';
  reason: string;
  steps?: {
    action: string;
    success: boolean;
  }[];
}

export interface AIConfig {
  apiKey: string;
  model?: string;
}

export interface ToolResult {
  output?: string;
  error?: string;
  screenshot?: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string | ToolResult;
} 