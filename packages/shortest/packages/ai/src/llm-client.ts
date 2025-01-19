import Anthropic from "@anthropic-ai/sdk";
import {
  ClaudeAdapter,
  ClaudeResponse,
  ClaudeResponseMouseMove,
  ClaudeToolsMobile,
  ClaudeToolsWeb,
  getSystemPromptForMobilePlatform,
  getSystemPromptForWebPlatform,
} from "@shortest/ai";
import { Browser } from "@shortest/browser";
import { CacheAction, CacheStep } from "@shortest/cache";
import { Platform } from "@shortest/driver";
import { sleep } from "@shortest/util";
import pc from "picocolors";

export class AIClient {
  private client: Anthropic;
  private model: string;
  private maxMessages: number;
  private debugMode: boolean;

  constructor(debugMode: boolean = false) {
    if (!__shortest__.config!.anthropicKey) {
      throw new Error(
        "Anthropic API key is required. Set it in shortest.config.ts or ANTHROPIC_API_KEY env var"
      );
    }

    this.client = new Anthropic({
      apiKey: __shortest__.config!.anthropicKey,
    });
    this.model = "claude-3-5-sonnet-20241022";
    this.maxMessages = 10;
    this.debugMode = debugMode;
  }

  async processAction(
    prompt: string,
    browser: Browser,
    outputCallback?: (
      content: Anthropic.Beta.Messages.BetaContentBlockParam
    ) => void,
    toolOutputCallback?: (name: string, input: any) => void
  ) {
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      try {
        return await this.makeRequest(
          prompt,
          browser,
          outputCallback,
          toolOutputCallback
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
    browser: Browser,
    _outputCallback?: (
      content: Anthropic.Beta.Messages.BetaContentBlockParam
    ) => void,
    _toolOutputCallback?: (name: string, input: any) => void
  ) {
    const platform = __shortest__.config?.driver.platform;
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

    const adapter = new ClaudeAdapter(browser);

    while (true) {
      try {
        await sleep(1000);

        const response = await this.client.beta.messages.create({
          model: this.model,
          max_tokens: 1024,
          messages,
          system:
            platform === Platform.Web
              ? getSystemPromptForWebPlatform()
              : getSystemPromptForMobilePlatform(),
          betas: ["computer-use-2024-10-22"],
          tools: [
            ...(platform === Platform.Web ? ClaudeToolsWeb : ClaudeToolsMobile),
          ],
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
              result: adapter.execute(toolBlock.input as ClaudeResponse),
            };
          });

          const results = await Promise.all(toolResults.map((t) => t.result));

          const getExtras = async (
            toolBlock: Anthropic.Beta.Messages.BetaToolUseBlock
          ) => {
            let extras: any = {};

            if ((toolBlock.input as ClaudeResponseMouseMove).coordinate) {
              // @ts-expect-error
              const [x, y] = toolBlock.input.coordinate;

              const componentStr = await browser.locateAt(x, y);

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
                  (block) => (block as any).text
                )[0],
                result: results[i].message || null,
                extras,
                timestamp: Date.now(),
              };
            })
          );

          pendingCache.steps = [
            ...(pendingCache.steps || []),
            ...(newCacheSteps || []),
          ];

          // Log tool results
          if (this.debugMode) {
            results.forEach((result: any) => {
              const { ...logResult } = result;
              console.log(pc.blue("\n🔧 Tool Result:"), logResult);
            });
          }

          console.log({
            pl: JSON.stringify(__shortest__.config!.driver.platform),
          });

          // Add tool results to message history
          messages.push({
            role: "user",
            content: results.map((result, index: any) => ({
              type: "tool_result" as const,
              tool_use_id: toolResults[index].toolBlock.id,
              content: result.payload?.base64Image
                ? [
                    {
                      type: "image" as const,
                      source: {
                        type: "base64" as const,
                        media_type:
                          __shortest__.config!.driver.platform === "web"
                            ? "image/jpeg"
                            : "image/png",
                        data: result.payload.base64Image,
                      },
                    },
                  ]
                : [
                    {
                      type: "text" as const,
                      text: result.message || "",
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
          await sleep(60000);
          continue;
        }
        throw error;
      }
    }
  }
}
