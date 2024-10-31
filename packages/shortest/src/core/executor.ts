import { Reporter } from './reporter';
import { TestCompiler } from './compiler';

export class TestExecutor {
  private reporter: Reporter;
  private compiler: TestCompiler;

  constructor() {
    this.reporter = new Reporter();
    this.compiler = new TestCompiler();
  }

  async executeTest(file: string) {
    this.reporter.startFile(file);
    this.reporter.reportTest('Sample test');
  }

  getReporter(): Reporter {
    return this.reporter;
  }
}
