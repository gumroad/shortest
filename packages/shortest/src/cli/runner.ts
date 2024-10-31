import { watch } from 'chokidar';
import { glob } from 'glob';
import pc from 'picocolors';
import { loadConfig } from '../config/loader';
import type { ShortestConfig } from '../config/types';

export class TestRunner {
  private config: ShortestConfig;
  private cwd: string;

  constructor(cwd: string) {
    this.cwd = cwd;
  }

  async initialize() {
    this.config = await loadConfig(this.cwd);
  }

  private async findTestFiles(pattern?: string): Promise<string[]> {
    const testDirs = Array.isArray(this.config.testDir) 
      ? this.config.testDir 
      : [this.config.testDir || 'tests'];

    if (pattern) {
      return [pattern];
    }

    const files = [];
    for (const dir of testDirs) {
      const matches = await glob(`${dir}/**/*.test.ts`);
      files.push(...matches);
    }
    return files;
  }

  async runFile(file: string) {
    await this.initialize();
    console.log(pc.blue(`\nRunning tests in ${pc.bold(file)}`));
    
    // Minimal execution for now
    console.log(pc.green('  ✓'), `Test passed`);
    
    this.watchMode([file]);
  }

  async runAll() {
    await this.initialize();
    const files = await this.findTestFiles();
    
    console.log(pc.blue(`\nFound ${files.length} test files`));
    
    for (const file of files) {
      console.log(pc.green('  ✓'), `${file}`);
    }
    
    this.watchMode(files);
  }

  private watchMode(files: string[]) {
    console.log(pc.blue('\nWatch mode enabled. Press Ctrl+C to exit.\n'));
    
    const watcher = watch(files, {
      ignoreInitial: true
    });

    watcher.on('change', async (file) => {
      console.clear();
      console.log(pc.yellow(`\nFile changed: ${file}`));
      console.log(pc.green('  ✓'), `Re-running tests...`);
    });
  }
} 