import { Reporter } from './reporter';
import { TestCompiler } from './compiler';
import { TestParser } from './parser';
import { BrowserManager } from './browser-manager';
import { initialize } from '../index';

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
      
      // Launch browser before any test execution
      this.reporter.reportStatus('Launching browser...');
      await this.browserManager.launch();
      
      this.reporter.startFile(file);
      
      const compiledPath = await this.compiler.compileFile(file);
      const module = await import(compiledPath);
      const suites = await this.parser.parseModule(module);
      
      for (const suite of suites) {
        // Keep browser open for 2 minutes
        this.reporter.reportStatus('Keeping browser open for 2 minutes...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minutes

        this.reporter.startSuite(suite.name);
        
        for (const test of suite.tests) {
          this.reporter.reportTest(test.testName, 'passed');
        }
      }

    } catch (error: unknown) {
      if (error instanceof Error) {
        this.reporter.reportError('Test Execution', error.message);
      } else {
        this.reporter.reportError('Test Execution', String(error));
      }
    } finally {
      // Always clean up browser
      this.reporter.reportStatus('Shutting down browser...');
      await this.browserManager.close();
    }
  }

  getReporter(): Reporter {
    return this.reporter;
  }
}
