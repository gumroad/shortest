import { glob } from 'glob';
import { resolve } from 'path';
import { TestCompiler } from '../compiler';
import { TestParser } from '../parser';
import { BrowserManager } from '../../browser/manager';
import { BrowserTool } from '../../browser/core/browser-tool';
import { AIClient } from '../../ai/ai';
import { initialize, getConfig } from '../../index';
import { ShortestConfig, TestContext } from '../../types';
import { Logger } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';

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
  private parser: TestParser;
  private browserManager: BrowserManager;
  private logger: Logger;

  constructor(cwd: string, exitOnSuccess = true, forceHeadless = false, targetUrl?: string) {
    this.cwd = cwd;
    this.exitOnSuccess = exitOnSuccess;
    this.forceHeadless = forceHeadless;
    this.targetUrl = targetUrl;
    this.compiler = new TestCompiler();
    this.parser = new TestParser();
    this.browserManager = new BrowserManager();
    this.logger = new Logger();
  }

  async initialize() {
    const configFiles = [
      'shortest.config.ts',
      'shortest.config.js',
      'shortest.config.mjs'
    ];

    // Try to load config file
    for (const file of configFiles) {
      try {
        const module = await this.compiler.loadModule(file, this.cwd);
        if (module.default) {
          this.config = module.default;
          
          // Override config with CLI flags
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

  private async executeTest(file: string) {
    try {
      await initialize();
      const config = getConfig();
      const apiKey = config.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key not found');
      }

      this.logger.startFile(file);
      const compiledPath = await this.compiler.compileFile(file);
      const module = await import(compiledPath);
      const suites = await this.parser.parseModule(module);
      
      for (const suite of suites) {
        this.logger.startSuite(suite.name);
        
        for (const test of suite.tests) {
          const testContext: TestContext = {
            currentTest: test,
            currentStepIndex: 0,
            testName: test.testName
          };

          this.logger.reportStatus(' Launching browser...');
          const context = await this.browserManager.launch();
          const page = context.pages()[0];
          
          const browserTool = new BrowserTool(
            page,
            this.browserManager,
            {
              width: 1920,
              height: 1080,
              testContext
            }
          );

          const aiClient = new AIClient({
            apiKey,
            model: 'claude-3-5-sonnet-20241022',
            maxMessages: 10
          });

          try {
            const prompt = this.parser.generateTestPrompt(test, suite.name);
            const result = await aiClient.processAction(
              prompt,
              browserTool,
              (content: Anthropic.Beta.Messages.BetaContentBlockParam) => {
                if (content.type === 'text') {
                  // this.logger.reportStatus(`🤖 ${(content as Anthropic.Beta.Messages.BetaTextBlock).text}`);
                }
              },
              (name: string, input: any) => {
                // this.logger.reportStatus(`🔧 ${name}: ${JSON.stringify(input)}`);
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
                
                if (testResult.result === 'pass') {
                  this.logger.reportTest(test.testName, 'passed');
                } else {
                  this.logger.reportTest(test.testName, 'failed', new Error(testResult.reason));
                  this.logger.reportError('Test Failed', testResult.reason);
                }
              }
            } else {
              const noResultError = new Error('No test result found in AI response');
              this.logger.reportTest(test.testName, 'failed', noResultError);
              this.logger.reportError('Test Failed', noResultError.message);
            }

          } catch (error: unknown) {
            if (error instanceof Error) {
              this.logger.reportTest(test.testName, 'failed', error);
              this.logger.reportError('Test Failed', error.message);
            } else {
              const unknownError = new Error('Unknown error occurred');
              this.logger.reportTest(test.testName, 'failed', unknownError);
              this.logger.reportError('Test Failed', unknownError.message);
            }
          } finally {
            this.logger.reportStatus('🧹 Cleaning up browser...');
            await this.browserManager.close();
          }
        }
      }

    } catch (error: unknown) {
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
      await this.executeTest(file);
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
      await this.executeTest(file);
    }
    
    this.logger.summary();

    if (this.exitOnSuccess && this.logger.allTestsPassed()) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  }
}
