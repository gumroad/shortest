import { resolve } from "path";
import Anthropic from "@anthropic-ai/sdk";
import { Browser } from "@shortest/browser";
import { hashData, Logger, urlSafe } from "@shortest/util";
import { glob } from "glob";
import pc from "picocolors";
import { AIClient } from "../../ai/core/llm-client";
import { BaseCache } from "../../cache/cache";
import {
  TestFunction,
  TestContext,
  ShortestConfig,
  BrowserActionEnum,
} from "../../types";
import { CacheEntry } from "../../types/cache";
import { TestCompiler } from "../compiler";

interface TestResult {
  result: "pass" | "fail";
  reason: string;
}

export interface CLIOpts extends Pick<ShortestConfig, "headless" | "baseUrl"> {
  debugAI?: boolean;
  noCache?: boolean;
}

export interface Runner {
  runFile(pattern: string): Promise<void>;
  runAll(): Promise<void>;
}

export class RunnerImpl implements Runner {
  private cwd: string;
  private CLIOpts: CLIOpts;
  private exitOnSuccess: boolean;
  private compiler: TestCompiler;
  // private browserManager!: BrowserManager;
  private logger: Logger;
  private testContext: TestContext | null = null;
  private cache: BaseCache<CacheEntry>;

  constructor(cwd: string, CLIOpts: CLIOpts, exitOnSuccess = true) {
    this.cwd = cwd;
    this.exitOnSuccess = exitOnSuccess;
    this.compiler = new TestCompiler();
    this.logger = new Logger();
    this.cache = new BaseCache();
    this.CLIOpts = CLIOpts;

    this.enforceCLIOpts(this.CLIOpts);
    this.init();
  }

  private async init() {
    // await loadGlobals();
  }

  private enforceCLIOpts(opts: CLIOpts) {
    if (opts.headless === true) {
      __shortest__.config = {
        ...__shortest__.config!,
        headless: opts.headless,
      };
    }
    if (opts.baseUrl && urlSafe(opts.baseUrl)) {
      __shortest__.config = {
        ...__shortest__.config!,
        baseUrl: opts.baseUrl,
      };
    }
  }

  private async findTestFiles(pattern?: string): Promise<string[]> {
    if (!global.__shortest__.config || !global.__shortest__.config.testDir) {
      throw new Error("No configuration found");
    }
    const testDirs = Array.isArray(global.__shortest__.config.testDir)
      ? global.__shortest__.config.testDir
      : [global.__shortest__.config.testDir || "__tests__"];

    const files = [];
    for (const dir of testDirs) {
      if (pattern) {
        const cleanPattern = pattern
          .replace(/\.ts$/, "")
          .replace(/\.test$/, "")
          .split("/")
          .pop();

        const globPattern = `${dir}/**/${cleanPattern}.test.ts`;
        const matches = await glob(globPattern, {
          cwd: this.cwd,
          absolute: true,
        });

        files.push(...matches);
      } else {
        const globPattern = `${dir}/**/*.test.ts`;
        const matches = await glob(globPattern, { cwd: this.cwd });
        files.push(...matches.map((f) => resolve(this.cwd, f)));
      }
    }

    if (files.length === 0) {
      this.logger.error(
        "Test Discovery",
        `No test files found in directories: ${testDirs.join(", ")}`
      );
      process.exit(1);
    }

    return files;
  }

  // private async createTestContext(
  //   context: BrowserContext
  // ): Promise<TestContext> {
  //   if (!this.testContext) {
  //     // Create a properly typed playwright object
  //     const playwrightObj = {
  //       ...playwright,
  //       request: {
  //         ...request,
  //         newContext: async (options?: {
  //           extraHTTPHeaders?: Record<string, string>;
  //         }) => {
  //           const requestContext = await request.newContext({
  //             baseURL: this.config.baseUrl,
  //             ...options,
  //           });
  //           return requestContext;
  //         },
  //       },
  //     } as typeof playwright & {
  //       request: APIRequest & {
  //         newContext: (options?: {
  //           extraHTTPHeaders?: Record<string, string>;
  //         }) => Promise<APIRequestContext>;
  //       };
  //     };

  //     this.testContext = {
  //       page: context.pages()[0],
  //       browser: this.browserManager.getBrowser()!,
  //       playwright: playwrightObj,
  //     };
  //   }
  //   return this.testContext;
  // }

  private async executeTest(
    test: TestFunction,
    browser: Browser,
    config: { noCache: boolean } = { noCache: false }
  ) {
    // If it's direct execution, skip AI
    if (test.directExecution) {
      try {
        await test.fn?.({ browser });
        return {
          result: "pass" as const,
          reason: "Direct execution successful",
        };
      } catch (error) {
        return {
          result: "fail" as const,
          reason:
            error instanceof Error ? error.message : "Direct execution failed",
        };
      }
    }

    // Use the shared context
    // const testContext = await this.createTestContext(context);
    // const browserTool = new BrowserTool(testContext.page, this.browserManager, {
    //   width: 1920,
    //   height: 1080,
    //   testContext: {
    //     ...testContext,
    //     currentTest: test,
    //     currentStepIndex: 0,
    //   },
    // });

    const aiClient = new AIClient(
      {
        apiKey: __shortest__.config!.anthropicKey,
        model: "claude-3-5-sonnet-20241022",
        maxMessages: 10,
        debug: this.CLIOpts.debugAI,
      },
      this.CLIOpts.debugAI
    );

    // First get page state
    const initialState = await browser.screenshot();

    // Build prompt with initial state and screenshot
    const prompt = [
      `Test: "${test.name}"`,
      test.payload ? `Context: ${JSON.stringify(test.payload)}` : "",
      `Callback function: ${test.fn ? " [HAS_CALLBACK]" : " [NO_CALLBACK]"}`,

      // Add expectations if they exist
      ...(test.expectations?.length
        ? [
            "\nExpect:",
            ...test.expectations.map(
              (exp, i) =>
                `${i + 1}. ${exp.description}${
                  exp.fn ? " [HAS_CALLBACK]" : "[NO_CALLBACK]"
                }`
            ),
          ]
        : ["\nExpect:", `1. "${test.name}" expected to be successful`]),

      "\nCurrent Page State:",
      `URL: ${initialState.metadata?.browserState?.window?.url || "unknown"}`,
      `Title: ${initialState.metadata?.browserState?.window?.title || "unknown"}`,
    ]
      .filter(Boolean)
      .join("\n");

    // check if CLI option is not specified
    if (!this.CLIOpts.noCache && !config.noCache) {
      // if test hasn't changed and is already in cache, replay steps from cache
      if (await this.cache.get(test)) {
        try {
          const result = await this.runCachedTest(test, browser);

          if (test.afterFn) {
            try {
              await test.afterFn({ browser });
            } catch (error) {
              return {
                result: "fail" as const,
                reason:
                  result?.result === "fail"
                    ? `AI: ${result.reason}, After: ${
                        error instanceof Error ? error.message : String(error)
                      }`
                    : error instanceof Error
                      ? error.message
                      : String(error),
              };
            }
          }
          return result;
        } catch {
          // delete stale cached test entry
          await this.cache.delete(test);
          // reset window state
          // const page = browser.getPage(); // todo: implement
          // await page.goto(initialState.metadata?.window_info?.url!);
          await this.executeTest(test, browser, {
            noCache: true,
          });
        }
      }
    }

    // Execute test with enhanced prompt
    const result = await aiClient.processAction(prompt, browser);

    if (!result) {
      throw new Error("AI processing failed: no result returned");
    }

    // Parse AI result first
    const finalMessage = result.finalResponse.content.find(
      (block) =>
        block.type === "text" &&
        (block as Anthropic.Beta.Messages.BetaTextBlock).text.includes(
          '"result":'
        )
    );

    if (!finalMessage || finalMessage.type !== "text") {
      throw new Error("No test result found in AI response");
    }

    const jsonMatch = (
      finalMessage as Anthropic.Beta.Messages.BetaTextBlock
    ).text.match(/{[\s\S]*}/);
    if (!jsonMatch) {
      throw new Error("Invalid test result format");
    }

    const aiResult = JSON.parse(jsonMatch[0]) as TestResult;

    // Execute after function if present
    if (test.afterFn) {
      try {
        await test.afterFn({ browser });
      } catch (error) {
        return {
          result: "fail" as const,
          reason:
            aiResult.result === "fail"
              ? `AI: ${aiResult.reason}, After: ${
                  error instanceof Error ? error.message : String(error)
                }`
              : error instanceof Error
                ? error.message
                : String(error),
        };
      }
    }

    if (aiResult.result === "pass") {
      // batch set new chache if test is successful
      await this.cache.set(test, result.pendingCache);
    }
    return aiResult;
  }

  private async executeTestFile(file: string) {
    try {
      // await initialize();
      const driver = global.__shortest__.driver!;
      const registry = global.__shortest__.registry!;

      console.log({ driver });

      registry.tests.clear();
      registry.currentFileTests = [];

      this.logger.startFile(file);
      const compiledPath = await this.compiler.compileFile(file);
      await import(compiledPath);

      await driver.launch();
      const browser = await driver.createBrowser();
      console.log({ browser });
      await browser.navigate(__shortest__.config!.baseUrl!, {
        shoultInitialize: true,
      });

      try {
        // Execute beforeAll hooks with shared context
        for (const hook of registry.beforeAllFns) {
          await (hook as TestFunction["fn"])!({ browser });
        }

        // Execute tests in order they were defined
        for (const test of registry.currentFileTests) {
          // Execute beforeEach hooks with shared context
          for (const hook of registry.beforeEachFns) {
            await (hook as TestFunction["fn"])!({ browser });
          }

          const result = await this.executeTest(test, browser);
          this.logger.reportTest(
            test.name,
            result.result === "pass" ? "passed" : "failed",
            result.result === "fail" ? new Error(result.reason) : undefined
          );

          // Execute afterEach hooks with shared context
          for (const hook of registry.afterEachFns) {
            await (hook as TestFunction["fn"])!({ browser });
          }
        }

        // Execute afterAll hooks with shared context
        for (const hook of registry.afterAllFns) {
          await (hook as TestFunction["fn"])!({ browser });
        }
      } finally {
        await __shortest__.driver!.closeBrowser(browser.getId());
        this.testContext = null; // Reset the context
        registry.beforeAllFns = [];
        registry.afterAllFns = [];
        registry.beforeEachFns = [];
        registry.afterEachFns = [];
      }
    } catch (error) {
      this.testContext = null; // Reset on error
      if (error instanceof Error) {
        console.log({ error });
        this.logger.reportError("Test Execution", error.message);
      }
    }
  }

  async runFile(pattern: string) {
    // await this.initialize();
    const files = await this.findTestFiles(pattern);

    if (files.length === 0) {
      this.logger.error(
        "Test Discovery",
        `No test files found matching: ${pattern}`
      );
      process.exit(1);
    }

    for (const file of files) {
      await this.executeTestFile(file);
    }

    this.logger.summary();

    if (this.exitOnSuccess && this.logger.allTestsPassed()) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }

  async runAll() {
    const files = await this.findTestFiles();

    for (const file of files) {
      await this.executeTestFile(file);
    }

    this.logger.summary();

    if (this.exitOnSuccess && this.logger.allTestsPassed()) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }

  private async runCachedTest(
    test: TestFunction,
    browser: Browser
  ): Promise<TestResult> {
    const cachedTest = await this.cache.get(test);

    // @ts-expect-error
    if (this.debugAI) {
      console.log(pc.green(`Executing cached test ${hashData(test)}`));
    }

    const steps = cachedTest?.data.steps
      // do not take screenshots in cached mode
      ?.filter(
        (step) =>
          step.action?.input.action !== BrowserActionEnum.Screenshot.toString()
      );

    if (!steps) {
      throw new Error("No steps to execute running test in a normal mode");
    }
    for (const step of steps) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (
        step.action?.input.action === BrowserActionEnum.MouseMove &&
        // @ts-expect-error Interface and actual values differ
        step.action.input.coordinate
      ) {
        // @ts-expect-error
        const [x, y] = step.action.input.coordinate;
        const componentStr = (await browser.locateAt(x, y)).payload?.element;

        if (componentStr !== step.extras.componentStr) {
          throw new Error(
            "Componnet UI are different, running test in a normal mode"
          );
        } else {
          // fallback
        }
      }
      if (step.action?.input) {
        try {
          // await browserTool.execute(step.action.input); todo implement this
        } catch (error) {
          console.error(
            `Failed to execute step with input ${step.action.input}`,
            error
          );
        }
      }
    }

    return {
      result: "pass",
      reason: "All actions successfully replayed from cache",
    };
  }
}
