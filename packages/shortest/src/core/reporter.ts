import pc from 'picocolors';

export class Reporter {
  private testCount = 0;
  private fileCount = 0;
  private failedTests = 0;

  startFile(file: string) {
    this.fileCount++;
    console.log(pc.blue(`\nRunning tests in ${pc.bold(file)}`));
  }

  reportTest(name: string, passed = true) {
    this.testCount++;
    if (!passed) this.failedTests++;
    const icon = passed ? pc.green('✓') : pc.red('✗');
    console.log(`  ${icon} ${name}`);
  }

  summary() {
    console.log(
      pc.blue(`\nRan ${this.testCount} tests from ${this.fileCount} files`)
    );
  }

  allTestsPassed(): boolean {
    return this.failedTests === 0 && this.testCount > 0;
  }

  watchMode() {
    console.log(pc.blue('\nWatch mode enabled. Press Ctrl+C to exit.\n'));
  }

  fileChanged(file: string) {
    console.clear();
    console.log(pc.yellow(`\nFile changed: ${file}`));
  }
}
