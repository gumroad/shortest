#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';

async function main() {
  const args = process.argv.slice(2);
  const headless = args.includes('--headless');
  const testPattern = args.find(arg => !arg.startsWith('--'));
  
  const runner = new TestRunner(process.cwd(), true, headless);
  
  if (testPattern) {
    await runner.runFile(testPattern);
  } else {
    await runner.runAll();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 