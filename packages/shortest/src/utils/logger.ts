import pc from 'picocolors';
import { AssertionError } from '../types';

export type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface TestResult {
  name: string;
  status: TestStatus;
  error?: Error;
}

export class Logger {
  private currentFile: string = '';
  private testResults: TestResult[] = [];
  private startTime: number = Date.now();

  startFile(file: string) {
    this.currentFile = file.split('/').pop() || file;
    console.log(pc.blue(`\n📄 ${pc.bold(this.currentFile)}`));
  }

  reportTest(name: string, status: TestStatus = 'passed', error?: Error) {
    const icon = this.getStatusIcon(status);
    console.log(`    ${icon} ${name}`);
    
    if (status === 'failed' && error?.message) {
      console.log(pc.red(`        Reason: ${error.message}`));
    }
    
    this.testResults.push({ name, status, error });
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
    const totalTests = this.testResults.length;
    const failedTests = this.testResults.filter(t => t.status === 'failed').length;
    const passedTests = totalTests - failedTests;

    console.log(pc.dim('⎯'.repeat(50)));
    
    console.log(pc.bold('\n Tests '), 
      failedTests ? pc.red(`${failedTests} failed`) : '',
      failedTests && passedTests ? ' | ' : '',
      pc.green(`${passedTests} passed`),
      pc.dim(`(${totalTests})`)
    );

    console.log(pc.bold(' Duration  '), pc.dim(`${duration}s`));
    console.log(pc.bold(' Start at  '), pc.dim(new Date(this.startTime).toLocaleTimeString()));
    console.log(pc.dim('\n' + '⎯'.repeat(50)));
  }

  allTestsPassed(): boolean {
    return !this.testResults.some(test => test.status === 'failed');
  }

  reportStatus(message: string) {
    console.log(pc.blue(`\n${message}`));
  }

  error(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportError(context: string, message: string) {
    console.error(pc.red(`\n${context} Error: ${message}`));
  }

  reportAssertion(
    step: string, 
    status: 'passed' | 'failed', 
    error?: AssertionError
  ): void {
    const icon = status === 'passed' ? '✓' : '✗';
    const color = status === 'passed' ? 'green' : 'red';
    
    console.log(pc[color](`${icon} ${step}`));
    
    if (error && status === 'failed') {
      console.log(pc.red(`  Expected: ${error.matcherResult?.expected}`));
      console.log(pc.red(`  Received: ${error.matcherResult?.actual}`));
      console.log(pc.red(`  Message: ${error.message}`));
    }
  }
}
