import { watch } from 'chokidar';
import { glob } from 'glob';
import { resolve } from 'path';
import type { ShortestConfig } from '../types';
import { defaultConfig } from '../types';
import { TestExecutor } from './executor';
import { TestCompiler } from './compiler';

export class TestRunner {
  private config!: ShortestConfig;
  private cwd: string;
  private exitOnSuccess: boolean;
  private forceHeadless: boolean;
  private targetUrl: string | undefined;
  private compiler: TestCompiler;
  private executor: TestExecutor;

  constructor(cwd: string, exitOnSuccess = true, forceHeadless = false, targetUrl?: string) {
    this.cwd = cwd;
    this.exitOnSuccess = exitOnSuccess;
    this.forceHeadless = forceHeadless;
    this.targetUrl = targetUrl;
    this.compiler = new TestCompiler();
    this.executor = new TestExecutor();
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

    // Use default config if no config file found
    this.config = defaultConfig;
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
      console.log(`No test files found in directories: ${testDirs.join(', ')}`);
      process.exit(1);
    }

    return files;
  }

  async runFile(pattern: string) {
    await this.initialize();
    const files = await this.findTestFiles(pattern);
    
    if (files.length === 0) {
      console.error(`No test files found matching: ${pattern}`);
      process.exit(1);
    }

    for (const file of files) {
      await this.executor.executeTest(file);
    }
    
    const reporter = this.executor.getReporter();
    reporter.summary();

    if (this.exitOnSuccess && reporter.allTestsPassed()) {
      process.exit(0);
    }

    this.watchMode(files);
  }

  async runAll() {
    await this.initialize();
    const files = await this.findTestFiles();
    
    for (const file of files) {
      await this.executor.executeTest(file);
    }
    
    const reporter = this.executor.getReporter();
    reporter.summary();

    if (this.exitOnSuccess && reporter.allTestsPassed()) {
      process.exit(0);
    }

    this.watchMode(files);
  }

  private watchMode(files: string[]) {
    const reporter = this.executor.getReporter();
    reporter.watchMode();
    
    const watcher = watch(files, {
      ignoreInitial: true
    });

    watcher.on('change', async (file) => {
      reporter.fileChanged(file);
      await this.executor.executeTest(file);
      reporter.summary();
    });
  }
}
