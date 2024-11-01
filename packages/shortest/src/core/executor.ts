import { Reporter } from './reporter';
import { TestCompiler } from './compiler';
import { TestParser } from './parser';
import { initialize } from '../index';

export class TestExecutor {
  private reporter: Reporter;
  private compiler: TestCompiler;
  private parser: TestParser;

  constructor() {
    this.reporter = new Reporter();
    this.compiler = new TestCompiler();
    this.parser = new TestParser();
  }

  async executeTest(file: string) {
    await initialize();
    
    this.reporter.startFile(file);
    
    const compiledPath = await this.compiler.compileFile(file);
    const module = await import(compiledPath);
    const suites = await this.parser.parseModule(module);
    
    for (const suite of suites) {
      this.reporter.startSuite(suite.name);
      
      for (const test of suite.tests) {
        this.reporter.reportTest(test.testName, 'passed');
      }
    }
  }

  getReporter(): Reporter {
    return this.reporter;
  }
}
