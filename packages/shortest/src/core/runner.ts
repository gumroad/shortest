import { watch } from 'chokidar';
import { glob } from 'glob';
import { resolve } from 'path';
import { loadConfig } from '../config/loader';
import type { ShortestConfig } from '../config/types';
import { Reporter } from './reporter';

export class TestRunner {
  private config!: ShortestConfig;
  private cwd: string;
  private reporter: Reporter;
  private exitOnSuccess: boolean;

  constructor(cwd: string, exitOnSuccess = true) {
    this.cwd = cwd;
    this.reporter = new Reporter();
    this.exitOnSuccess = exitOnSuccess;
  }

  async initialize() {
    this.config = await loadConfig(this.cwd);
  }

  private async findTestFiles(pattern?: string): Promise<string[]> {
    const testDirs = Array.isArray(this.config.testDir) 
      ? this.config.testDir 
      : [this.config.testDir || 'tests'];

    if (pattern) {
      const files = [];
      for (const dir of testDirs) {
        const matches = await glob(`${dir}/**/*${pattern}*`, { cwd: this.cwd });
        files.push(...matches.map(f => resolve(this.cwd, f)));
      }
      return files;
    }

    const files = [];
    for (const dir of testDirs) {
      const matches = await glob(`${dir}/**/*.test.ts`, { cwd: this.cwd });
      files.push(...matches.map(f => resolve(this.cwd, f)));
    }
    return files;
  }

  private async executeTest(file: string) {
    this.reporter.startFile(file);
    this.reporter.reportTest('Sample test');
  }

  async runFile(pattern: string) {
    await this.initialize();
    const files = await this.findTestFiles(pattern);
    
    if (files.length === 0) {
      console.error(`No test files found matching: ${pattern}`);
      process.exit(1);
    }

    for (const file of files) {
      await this.executeTest(file);
    }
    
    this.reporter.summary();

    // Exit if all tests passed and exitOnSuccess is true
    if (this.exitOnSuccess && this.reporter.allTestsPassed()) {
      process.exit(0);
    }

    this.watchMode(files);
  }

  async runAll() {
    await this.initialize();
    const files = await this.findTestFiles();
    
    for (const file of files) {
      await this.executeTest(file);
    }
    
    this.reporter.summary();

    // Exit if all tests passed and exitOnSuccess is true
    if (this.exitOnSuccess && this.reporter.allTestsPassed()) {
      process.exit(0);
    }

    this.watchMode(files);
  }

  private watchMode(files: string[]) {
    this.reporter.watchMode();
    
    const watcher = watch(files, {
      ignoreInitial: true
    });

    watcher.on('change', async (file) => {
      this.reporter.fileChanged(file);
      await this.executeTest(file);
      this.reporter.summary();
    });
  }
}
