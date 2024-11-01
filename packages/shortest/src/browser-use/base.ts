import { BrowserManager } from '../core/browser-manager';

export interface ToolResult {
  output?: string;
  error?: string;
  screenshot?: string;  // base64 encoded screenshot
  system?: string;     // system messages
}

export interface BaseTool {
  name: string;
  execute(...args: any[]): Promise<ToolResult>;
}

export abstract class BrowserTool implements BaseTool {
  protected browserManager: BrowserManager;
  abstract name: string;

  constructor(browserManager: BrowserManager) {
    this.browserManager = browserManager;
  }

  abstract execute(...args: any[]): Promise<ToolResult>;

  protected async takeScreenshot(): Promise<string | undefined> {
    // Will implement with CDP
    return undefined;
  }
}

export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ToolError';
  }
}
