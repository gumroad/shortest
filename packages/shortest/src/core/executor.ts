import { Reporter } from './reporter';
import { TestCompiler } from './compiler';
import { TestParser } from './parser';
import { BrowserManager } from '../browser/manager';
import { BrowserTool } from '../browser/core/browser-tool';
import { AIClient } from '../ai/ai';
import { initialize, getConfig } from '../index';
import { TestContext } from '../types';
import Anthropic from '@anthropic-ai/sdk';

interface TestResult {
  result: 'pass' | 'fail';
  reason: string;
}

export class TestExecutor {
  private reporter: Reporter;
  private compiler: TestCompiler;
  private parser: TestParser;
  private browserManager: BrowserManager;

  constructor() {
    this.reporter = new Reporter();
    this.compiler = new TestCompiler();
    this.parser = new TestParser();
    this.browserManager = new BrowserManager();
  }

  async executeTest(file: string) {
    try {
      await initialize();
      const config = getConfig();
      const apiKey = config.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
      
      if (!apiKey) {
        throw new Error('Anthropic API key not found');
      }

      this.reporter.startFile(file);
      const compiledPath = await this.compiler.compileFile(file);
      const module = await import(compiledPath);
      const suites = await this.parser.parseModule(module);
      
      for (const suite of suites) {
        this.reporter.startSuite(suite.name);
        
        for (const test of suite.tests) {
          // Create test context for each test
          const testContext: TestContext = {
            currentTest: test,
            currentStepIndex: 0,
            testName: test.testName
          };

          // Launch new browser for each test
          this.reporter.reportStatus('🚀 Launching browser...');
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

          // New AI client for each test (fresh message history)
          const aiClient = new AIClient({
            apiKey,
            model: 'claude-3-5-sonnet-20241022',
            maxMessages: 10
          });

          try {
            // Generate test prompt
            const prompt = this.parser.generateTestPrompt(test, suite.name);
            // console.log("prompt", prompt);

            // Run test with AI in verbose mode
            const result = await aiClient.processAction(
              prompt,
              browserTool,
              (content: Anthropic.Beta.Messages.BetaContentBlockParam) => {
                if (content.type === 'text') {
                  // this.reporter.reportStatus(`🤖 ${(content as Anthropic.Beta.Messages.BetaTextBlock).text}`);
                }
              },
              (name: string, input: any) => {
                // this.reporter.reportStatus(`🔧 ${name}: ${JSON.stringify(input)}`);
              }
            );

            if (!result) {
              throw new Error('AI processing failed: no result returned');
            }

            // Parse final response for JSON result
            const finalMessage = result.finalResponse.content.find(block => 
              block.type === 'text' && 
              (block as Anthropic.Beta.Messages.BetaTextBlock).text.includes('"result":')
            );

            if (finalMessage && finalMessage.type === 'text') {
              const jsonMatch = (finalMessage as Anthropic.Beta.Messages.BetaTextBlock).text.match(/{[\s\S]*}/);
              if (jsonMatch) {
                const testResult = JSON.parse(jsonMatch[0]) as TestResult;
                
                if (testResult.result === 'pass') {
                  this.reporter.reportTest(test.testName, 'passed');
                } else {
                  this.reporter.reportTest(test.testName, 'failed', new Error(testResult.reason));
                  this.reporter.reportError('Test Failed', testResult.reason);
                }
              }
            } else {
              const noResultError = new Error('No test result found in AI response');
              this.reporter.reportTest(test.testName, 'failed', noResultError);
              this.reporter.reportError('Test Failed', noResultError.message);
            }

          } catch (error: unknown) {
            if (error instanceof Error) {
              this.reporter.reportTest(test.testName, 'failed', error);
              this.reporter.reportError('Test Failed', error.message);
            } else {
              const unknownError = new Error('Unknown error occurred');
              this.reporter.reportTest(test.testName, 'failed', unknownError);
              this.reporter.reportError('Test Failed', unknownError.message);
            }
          } finally {
            // Clean up browser after each test
            this.reporter.reportStatus('🧹 Cleaning up browser...');
            await this.browserManager.close();
          }
        }
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        this.reporter.reportError('Test Execution', error.message);
      } else {
        this.reporter.reportError('Test Execution', String(error));
      }
    }
  }

  getReporter(): Reporter {
    return this.reporter;
  }
}
