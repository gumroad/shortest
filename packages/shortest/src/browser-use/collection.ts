import { BaseBrowserTool, ToolError } from './base';
import { ToolResult } from '../types/browser';
import { BetaToolParams } from '../types/browser';

export class ToolCollection {
  private tools: Map<string, BaseBrowserTool>;

  constructor() {
    this.tools = new Map();
  }

  register(name: string, tool: BaseBrowserTool): void {
    this.tools.set(name, tool);
  }

  toToolParameters(): BetaToolParams[] {
    return Array.from(this.tools.values()).map(tool => tool.toToolParameters());
  }

  async execute(name: string, input: any): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        error: `Tool ${name} is invalid`,
        output: 'Tool execution failed'
      };
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      if (error instanceof ToolError) {
        return {
          error: error.message,
          output: 'Tool execution failed'
        };
      }
      return {
        error: `Tool execution failed: ${error}`,
        output: 'Tool execution failed'
      };
    }
  }
}
