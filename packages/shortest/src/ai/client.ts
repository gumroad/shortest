import Anthropic from "@anthropic-ai/sdk";
import pc from "picocolors";
import { BrowserTool } from "../browser/core/browser-tool";
import { AIConfig } from "../types/ai";
import { CacheAction, CacheStep } from "../types/cache";
import { SYSTEM_PROMPT } from "./prompts";
import { AITools } from "./tools";

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxMessages: number;
  private debugMode: boolean;

  constructor(config: AIConfig, debugMode: boolean = false) {
    if (!config.apiKey) {
      throw new Error(
        "Anthropic API key is required. Set it in shortest.config.ts or ANTHROPIC_API_KEY env var",
      );
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.model = "claude-3-5-sonnet-20241022";
    this.maxMessages = 10;
    this.debugMode = debugMode;
  }

  async processAction(
    prompt: string,
    browserTool: BrowserTool,
    outputCallback?: (
      content: Anthropic.Beta.Messages.BetaContentBlockParam,
    ) => void,
    toolOutputCallback?: (name: string, input: any) => void,
  ) {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await this.makeRequest(
          prompt,
          browserTool,
          outputCallback,
          toolOutputCallback,
        );
      } catch (error: any) {
        attempts++;
        if (attempts === maxRetries) throw error;

        console.log(`Retry attempt ${attempts}/${maxRetries}`);
        await new Promise((r) => setTimeout(r, 5000 * attempts));
      }
    }
  }

  async makeRequest(
    prompt: string,
    browserTool: BrowserTool,
    _outputCallback?: (
      content: Anthropic.Beta.Messages.BetaContentBlockParam,
    ) => void,
    _toolOutputCallback?: (name: string, input: any) => void,
  ) {
    const messages: Anthropic.Beta.Messages.BetaMessageParam[] = [];
    // temp cache store
    const pendingCache: Partial<{ steps?: CacheStep[] }> = {};

    // Log the conversation
    if (this.debugMode) {
      console.log(pc.cyan("\n🤖 Prompt:"), pc.dim(prompt));
    }

    messages.push({
      role: "user",
      content: prompt,
    });

    while (true) {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const response = await this.client.beta.messages.create({
          model: this.model,
          max_tokens: 1024,
          messages,
          system: SYSTEM_PROMPT,
          tools: [...AITools],
          betas: ["computer-use-2024-10-22"],
        });

        // Log AI response and tool usage
        if (this.debugMode) {
          response.content.forEach((block) => {
            if (block.type === "text") {
              console.log(pc.green("\n🤖 AI:"), pc.dim((block as any).text));
            } else if (block.type === "tool_use") {
              const toolBlock =
                block as Anthropic.Beta.Messages.BetaToolUseBlock;
              console.log(pc.yellow("\n🔧 Tool Request:"), {
                tool: toolBlock.name,
                input: toolBlock.input,
              });
            }
          });
        }

        // Add assistant's response to history
        messages.push({
          role: "assistant",
          content: response.content,
        });

        // Check for tool use
        if (response.stop_reason === "tool_use") {
          const toolBlocks: Anthropic.Beta.Messages.BetaToolUseBlock[] =
            response.content.filter((block) => block.type === "tool_use");

          const toolResults = toolBlocks.map((toolBlock) => {
            return {
              toolBlock,

              result: browserTool.execute(toolBlock.input as any),
            };
          });

          const results = await Promise.all(toolResults.map((t) => t.result));

          const getExtras = async (
            toolBlock: Anthropic.Beta.Messages.BetaToolUseBlock,
          ) => {
            let extras: any = {};

            // @ts-expect-error Incorrect interface on our side leads to this error
            // @see https://docs.anthropic.com/en/docs/build-with-claude/computer-use#computer-tool:~:text=%2C%0A%20%20%20%20%20%20%20%20%7D%2C-,%22coordinate%22,-%3A%20%7B%0A%20%20%20%20%20%20%20%20%20%20%20%20%22description
            if (toolBlock.input.coordinate) {
              // @ts-expect-error
              const [x, y] = toolBlock.input.coordinate;

              const componentStr =
                await browserTool.getNormalizedComponentStringByCoords(x, y);

              extras = { componentStr };
            }

            return extras;
          };

          const newCacheSteps = await Promise.all(
            toolBlocks.map(async (_toolBlock, i) => {
              const extras = await getExtras(toolBlocks[i]);

              return {
                action: toolBlocks[i] as CacheAction,
                reasoning: response.content.map(
                  (block) => (block as any).text,
                )[0],
                result: results[i].output || null,
                extras,
                timestamp: Date.now(),
              };
            }),
          );

          pendingCache.steps = [
            ...(pendingCache.steps || []),
            ...(newCacheSteps || []),
          ];

          // Log tool results
          if (this.debugMode) {
            results.forEach((result) => {
              const { ...logResult } = result;
              console.log(pc.blue("\n🔧 Tool Result:"), logResult);
            });
          }

          // Add tool results to message history
          messages.push({
            role: "user",
            content: results.map((result, index) => ({
              type: "tool_result" as const,
              tool_use_id: toolResults[index].toolBlock.id,
              content: result.base64_image
                ? [
                    {
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type: "image/jpeg" as const,
                        data: result.base64_image,
                      },
                    },
                  ]
                : [
                    {
                      type: "text" as const,
                      text: result.output || "",
                    },
                  ],
            })),
          });
        } else {
          return {
            messages,
            finalResponse: response,
            pendingCache,
          };
        }
      } catch (error: any) {
        if (error.message?.includes("rate_limit")) {
          console.log("⏳ Rate limited, waiting 60s...");
          await new Promise((resolve) => setTimeout(resolve, 60000));
          continue;
        }
        throw error;
      }
    }
  }
}
