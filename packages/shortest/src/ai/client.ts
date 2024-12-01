import Anthropic from '@anthropic-ai/sdk';
import { AIConfig } from '../types/ai';
import { SYSTEM_PROMPT } from './prompts';
import { BrowserTool } from '../browser/core/browser-tool';
import { AITools } from './tools';
import pc from 'picocolors';

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxMessages: number;
  private debugMode: boolean;

  constructor(config: AIConfig, debugMode: boolean = false) {
    this.client = new Anthropic({
      apiKey: config.apiKey
    });
    this.model = 'claude-3-5-sonnet-20241022';
    this.maxMessages = 10;
    this.debugMode = debugMode;
  }

  async processAction(
    prompt: string,
    browserTool: BrowserTool,
    outputCallback?: (content: Anthropic.Beta.Messages.BetaContentBlockParam) => void,
    toolOutputCallback?: (name: string, input: any) => void
  ) {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await this.makeRequest(prompt, browserTool, outputCallback, toolOutputCallback);
      } catch (error: any) {
        attempts++;
        if (attempts === maxRetries) throw error;
        
        console.log(`Retry attempt ${attempts}/${maxRetries}`);
        await new Promise(r => setTimeout(r, 5000 * attempts));
      }
    }
  }

  async makeRequest(
    prompt: string,
    browserTool: BrowserTool,
    outputCallback?: (content: Anthropic.Beta.Messages.BetaContentBlockParam) => void,
    toolOutputCallback?: (name: string, input: any) => void
  ) {
    const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [];

    // Log the conversation
    if (this.debugMode) {
      console.log(pc.cyan('\n🤖 Prompt:'), pc.dim(prompt));
    }

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
          tools: [...AITools],
          betas: ["computer-use-2024-10-22"]
        });

        // Log AI response
        if (this.debugMode) {
          response.content.forEach(block => {
            if (block.type === 'text') {
              console.log(pc.green('\n🤖 AI:'), pc.dim((block as any).text));
            }
          });
        }

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
              // console.log('🛠️ Executing tool:', toolBlock.name, 'with input:', toolBlock.input);
              
              return {
                toolBlock,
                result: browserTool.execute(toolBlock.input as any)
              };
            });

          const results = await Promise.all(toolResults.map(t => t.result));
          // console.log('🛠️ Tool execution results:', results);

          // console.log('🛠️ Sending to AI:', messages[messages.length - 1]);

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
