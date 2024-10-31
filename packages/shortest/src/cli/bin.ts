#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';

async function main() {
  const runner = new TestRunner(process.cwd());
  await runner.runAll();
}

main().catch(console.error); 