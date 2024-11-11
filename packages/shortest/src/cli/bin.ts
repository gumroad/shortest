#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';

async function main() {
  const runner = new TestRunner(process.cwd());
  
  const testPattern = process.argv[2];
  
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