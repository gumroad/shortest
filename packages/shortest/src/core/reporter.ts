import pc from 'picocolors';
import { ParsedTestSuite } from '../types';

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  name: string;
  status: TestStatus;
  error?: Error;
}

interface SuiteResult {
  name: string;
  tests: TestResult[];
}

export class Reporter {
  private currentFile: string = '';
  private suiteResults: SuiteResult[] = [];
  private startTime: number = Date.now();

  startFile(file: string) {
    this.currentFile = file.split('/').pop() || file;
    this.startTime = Date.now();
    console.log(pc.blue(`\n📄 ${pc.bold(this.currentFile)}`));
  }

  startSuite(name: string) {
    console.log(pc.cyan(`\n  Suite: ${name}`));
    this.suiteResults.push({ name, tests: [] });
  }

  reportTest(name: string, status: TestStatus = 'passed', error?: Error) {
    const icon = this.getStatusIcon(status);
    console.log(`    ${icon} ${name}`);
    
    const currentSuite = this.suiteResults[this.suiteResults.length - 1];
    if (currentSuite) {
      currentSuite.tests.push({ name, status, error });
    }
  }

  watchMode() {
    console.log(pc.blue('\nWatch mode enabled. Press Ctrl+C to exit.\n'));
  }

  fileChanged(file: string) {
    console.clear();
    console.log(pc.yellow(`\nFile changed: ${file}`));
  }

  private getStatusIcon(status: TestStatus): string {
    switch (status) {
      case 'pending':
        return pc.yellow('○');
      case 'running':
        return pc.blue('●');
      case 'passed':
        return pc.green('✓');
      case 'failed':
        return pc.red('✗');
    }
  }

  summary() {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.tests.length, 0);
    const failedTests = this.suiteResults.reduce(
      (sum, suite) => sum + suite.tests.filter(t => t.status === 'failed').length, 
      0
    );

    console.log(pc.dim('⎯'.repeat(50)));
    
    // Test Files summary
    console.log(pc.bold('\n Test Files '), 
      failedTests ? pc.red(`${failedTests} failed`) : '',
      failedTests && totalTests-failedTests ? ' | ' : '',
      pc.green(`${totalTests-failedTests} passed`),
      pc.dim(`(${totalTests})`)
    );

    // Duration
    console.log(pc.bold(' Duration  '), pc.dim(`${duration}s`));

    // Start time
    const startTimeStr = new Date(this.startTime).toLocaleTimeString();
    console.log(pc.bold(' Start at  '), pc.dim(startTimeStr));

    console.log(pc.dim('\n' + '⎯'.repeat(50)));
  }

  allTestsPassed(): boolean {
    return !this.suiteResults.some(suite => 
      suite.tests.some(test => test.status === 'failed')
    );
  }

  reportStatus(message: string) {
    console.log(pc.blue(`\n${message}`));
  }

  reportError(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }
}
