import { glob } from 'glob';
import { resolve } from 'path';
import { TestCompiler } from '../compiler';
import { BrowserManager } from '../../browser/manager';
import { BrowserTool } from '../../browser/core/browser-tool';
import { AIClient } from '../../ai/client';
import { initialize, getConfig } from '../../index';
import { ShortestConfig, TestContext } from '../../types';
import { Logger } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import { UITestBuilder } from '../builder';
import { TestRegistry } from '../../index';

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

  constructor(cwd: string, exitOnSuccess = true, forceHeadless = false, targetUrl?: string, debugAI = false) {
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
      TestRegistry.clear();
      await initialize();
      const config = getConfig();
      const apiKey = config.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key not found');
      }

      this.logger.startFile(file);
      let fileHasFailures = false;
      
      const compiledPath = await this.compiler.compileFile(file);
      const module = await import(compiledPath);
      const suites = await UITestBuilder.parseModule(module);
      
      for (const suite of suites) {
        this.logger.startSuite(suite.name);
        
        for (const test of suite.tests) {
          console.log('🔍 Executing test:', test.testName, 'in suite:', test.suiteName);

          const testContext: TestContext = {
            currentTest: test,
            currentStepIndex: 0,
            testName: test.testName
          };
          
          const builder = TestRegistry.getTestBuilder(test);
          console.log('🔍 Found builder:', builder ? 'yes' : 'no');
          
          if (builder) {
            console.log('🔍 Before hooks count:', builder.getBeforeHooks().length);
            console.log('🔍 After hooks count:', builder.getAfterHooks().length);
            
            try {
              for (const hook of builder.getBeforeHooks()) {
                console.log('🔍 Executing before hook');
                await hook();
              }
            } catch (error) {
              console.log('🔍 Before hook error:', error);
              this.logger.reportError('Before Hook', error instanceof Error ? error.message : String(error));
              continue;
            }
          }

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
            maxMessages: 10,
            debug: this.debugAI
          }, this.debugAI);

          try {
            const prompt = UITestBuilder.generateTestPrompt(test, suite.name);
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
            // Execute after hooks
            if (builder) {
              try {
                for (const hook of builder.getAfterHooks()) {
                  console.log('🔍 Executing after hook');
                  await hook();
                }
              } catch (error) {
                console.log('🔍 After hook error:', error);
                this.logger.reportError('After Hook', error instanceof Error ? error.message : String(error));
              }
            }

            this.logger.reportStatus('🧹 Cleaning up browser...');
            await this.browserManager.close();
          }
        }
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
