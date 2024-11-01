import { BaseTool, ToolResult } from './base';

export class ToolCollection {
  private tools: Map<string, BaseTool>;

  constructor(tools: BaseTool[]) {
    this.tools = new Map(tools.map(tool => [tool.name, tool]));
  }

  async execute(name: string, ...args: any[]): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        error: `Tool ${name} not found`,
        system: 'Tool execution failed'
      };
    }

    try {
      return await tool.execute(...args);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        system: 'Tool execution failed'
      };
    }
  }

  getTools(): string[] {
    return Array.from(this.tools.keys());
  }
} 