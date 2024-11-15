import Anthropic from '@anthropic-ai/sdk';
import { AIConfig } from './types';
import { SYSTEM_PROMPT } from './prompts';
import { BrowserTool } from '../browser-use/browser';

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxMessages: number;

  constructor(config: AIConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxMessages = 10;
  }

  async processAction(
    prompt: string,
    browserTool: BrowserTool,
    outputCallback?: (content: Anthropic.Beta.Messages.BetaContentBlockParam) => void,
    toolOutputCallback?: (name: string, input: any) => void
  ) {
    const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [];

    // Add initial message
    messages.push({
      role: 'user',
      content: prompt
    });

    while (true) {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = await this.client.beta.messages.create({
          model: this.model,
          max_tokens: 1024,
          messages,
          system: SYSTEM_PROMPT,
          tools: [
            {
              type: "computer_20241022",
              name: "computer",
              display_width_px: 1920,
              display_height_px: 1080,
              display_number: 1
            },
            {
              name: "github_login",
              description: "Handle GitHub OAuth login with 2FA",
              input_schema: {
                type: "object",
                properties: {
                  action: {
                    type: "string",
                    enum: ["github_login"],
                    description: "The action to perform. It's always equal to 'github_login'"
                  },
                  username: {
                    type: "string",
                    description: "GitHub username or email"
                  },
                  password: {
                    type: "string",
                    description: "GitHub password"
                  }
                },
                required: ["action", "username", "password"]
              }
            }
          ],
          betas: ["computer-use-2024-10-22"]
        });

        // Log and callback for assistant's response
        if (outputCallback) {
          response.content.forEach(block => outputCallback(block as Anthropic.Beta.Messages.BetaContentBlockParam));
        }

        // Add assistant's response to history
        messages.push({
          role: 'assistant',
          content: response.content
        });

        // Check for tool use
        if (response.stop_reason === 'tool_use') {
          const toolResults = response.content
            .filter(block => block.type === 'tool_use')
            .map(block => {
              const toolBlock = block as Anthropic.Beta.Messages.BetaToolUseBlock;
              if (toolOutputCallback) {
                toolOutputCallback(toolBlock.name as string, toolBlock.input);
              }
              
              return {
                toolBlock,
                result: browserTool.execute(toolBlock.input as any)
              };
            });

          const results = await Promise.all(toolResults.map(t => t.result));
          
          // Add tool results to message history
          messages.push({
            role: 'user',
            content: results.map((result, index) => ({
              type: 'tool_result' as const,
              tool_use_id: toolResults[index].toolBlock.id,
              content: result.base64_image ? 
                [{
                  type: 'image' as const,
                  source: {
                    type: 'base64' as const,
                    media_type: 'image/jpeg' as const,
                    data: result.base64_image
                  }
                }] : 
                [{
                  type: 'text' as const,
                  text: result.output || ''
                }]
            } as Anthropic.Beta.Messages.BetaToolResultBlockParam))
          });

        } else {
          return {
            messages,
            finalResponse: response
          };
        }

      } catch (error: any) {
        if (error.message?.includes('rate_limit')) {
          console.log("⏳ Rate limited, waiting 60s...");
          await new Promise(resolve => setTimeout(resolve, 60000));
          continue;
        }
        throw error;
      }
    }
  }
}
