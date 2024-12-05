import { glob } from 'glob';
import { resolve } from 'path';
import { TestCompiler } from '../compiler';
import { BrowserManager } from '../../browser/manager';
import { BrowserTool } from '../../browser/core/browser-tool';
import { AIClient } from '../../ai/client';
import { initialize, getConfig } from '../../index';
import { TestFunction, TestContext, ShortestConfig } from '../../types';
import { Logger } from '../../utils/logger';
import { TestBuilder } from '../builder';
import Anthropic from '@anthropic-ai/sdk';
import { BrowserContext } from 'playwright';

interface TestResult {
  result: 'pass' | 'fail';
  reason: string;
}

export class TestRunner {
  private config!: ShortestConfig;
  private cwd: string;
  private exitOnSuccess: boolean;
  private forceHeadless: boolean;
  private targetUrl: string | undefined;
  private compiler: TestCompiler;
  private browserManager: BrowserManager;
  private logger: Logger;
  private debugAI: boolean;

  constructor(
    cwd: string, 
    exitOnSuccess = true, 
    forceHeadless = false, 
    targetUrl?: string,
    debugAI = false
  ) {
    this.cwd = cwd;
    this.exitOnSuccess = exitOnSuccess;
    this.forceHeadless = forceHeadless;
    this.targetUrl = targetUrl;
    this.debugAI = debugAI;
    this.compiler = new TestCompiler();
    this.browserManager = new BrowserManager();
    this.logger = new Logger();
  }

  async initialize() {
    const configFiles = [
      'shortest.config.ts',
      'shortest.config.js',
      'shortest.config.mjs'
    ];

    for (const file of configFiles) {
      try {
        const module = await this.compiler.loadModule(file, this.cwd);
        if (module.default) {
          this.config = module.default;
          
          if (this.forceHeadless && this.config.browsers) {
            this.config.browsers = this.config.browsers.map(browser => ({
              ...browser,
              headless: true
            }));
          }

          if (this.targetUrl) {
            this.config.baseUrl = this.targetUrl;
          }
          
          return;
        }
      } catch (error) {
        continue;
      }
    }

    this.config = getConfig();
  }

  private async findTestFiles(pattern?: string): Promise<string[]> {
    const testDirs = Array.isArray(this.config.testDir) 
      ? this.config.testDir 
      : [this.config.testDir || '__tests__'];

    const files = [];
    for (const dir of testDirs) {
      if (pattern) {
        const cleanPattern = pattern
          .replace(/\.ts$/, '')
          .replace(/\.test$/, '')
          .split('/')
          .pop();
        
        const globPattern = `${dir}/**/${cleanPattern}.test.ts`;
        const matches = await glob(globPattern, { 
          cwd: this.cwd,
          absolute: true
        });
        
        files.push(...matches);
      } else {
        const globPattern = `${dir}/**/*.test.ts`;
        const matches = await glob(globPattern, { cwd: this.cwd });
        files.push(...matches.map(f => resolve(this.cwd, f)));
      }
    }

    if (files.length === 0) {
      this.logger.error('Test Discovery', `No test files found in directories: ${testDirs.join(', ')}`);
      process.exit(1);
    }

    return files;
  }

  private async executeTest(test: TestFunction, context: BrowserContext) {
    const page = context.pages()[0];
    const browserTool = new BrowserTool(page, this.browserManager, {
      width: 1920,
      height: 1080,
      testContext: {
        page,
        currentTest: test,
        currentStepIndex: 0
      }
    });

    const apiKey = this.config.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Anthropic API key not found');
    }

    const aiClient = new AIClient({
      apiKey,
      model: 'claude-3-5-sonnet-20241022',
      maxMessages: 10,
      debug: this.debugAI
    }, this.debugAI);

    try {
      const prompt = TestBuilder.generatePrompt(test);
      const result = await aiClient.processAction(
        prompt,
        browserTool,
        (content: Anthropic.Beta.Messages.BetaContentBlockParam) => {
          if (content.type === 'text') {
            // this.logger.reportStatus(`🤖 ${(content as Anthropic.Beta.Messages.BetaTextBlock).text}`);
          }
        }
      );

      if (!result) {
        throw new Error('AI processing failed: no result returned');
      }

      const finalMessage = result.finalResponse.content.find(block => 
        block.type === 'text' && 
        (block as Anthropic.Beta.Messages.BetaTextBlock).text.includes('"result":')
      );

      if (finalMessage && finalMessage.type === 'text') {
        const jsonMatch = (finalMessage as Anthropic.Beta.Messages.BetaTextBlock).text.match(/{[\s\S]*}/);
        if (jsonMatch) {
          const testResult = JSON.parse(jsonMatch[0]) as TestResult;
          return testResult;
        }
      }

      throw new Error('No test result found in AI response');
    } catch (error) {
      return {
        result: 'fail' as const,
        reason: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeTestFile(file: string) {
    try {
      const registry = (global as any).__shortest__.registry;
      registry.tests.clear();
      
      await initialize();
      
      this.logger.startFile(file);
      const compiledPath = await this.compiler.compileFile(file);
      await import(compiledPath);
      
      const context = await this.browserManager.launch();
      const testContext: TestContext = { page: context.pages()[0] };

      try {
        // Execute beforeAll hooks
        for (const hook of registry.beforeAllFns) {
          await hook(testContext);
        }

        // Execute tests
        for (const [testName, testFns] of registry.tests) {
          for (const test of testFns) {
            // Execute beforeEach hooks
            for (const hook of registry.beforeEachFns) {
              await hook(testContext);
            }

            // Execute test
            const result = await this.executeTest(test, context);
            
            if (result.result === 'pass') {
              this.logger.reportTest(test.name, 'passed');
            } else {
              this.logger.reportTest(test.name, 'failed', new Error(result.reason));
              this.logger.reportError('Test Failed', result.reason);
            }

            // Execute afterEach hooks
            for (const hook of registry.afterEachFns) {
              await hook(testContext);
            }
          }
        }

        // Execute afterAll hooks
        for (const hook of registry.afterAllFns) {
          await hook(testContext);
        }

      } finally {
        await this.browserManager.close();
      }

    } catch (error) {
      if (error instanceof Error) {
        this.logger.reportError('Test Execution', error.message);
      } else {
        this.logger.reportError('Test Execution', String(error));
      }
    }
  }

  async runFile(pattern: string) {
    await this.initialize();
    const files = await this.findTestFiles(pattern);
    
    if (files.length === 0) {
      this.logger.error('Test Discovery', `No test files found matching: ${pattern}`);
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
    await this.initialize();
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
}
