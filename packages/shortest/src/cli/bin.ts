#!/usr/bin/env node --loader ts-node/esm
import { resolve } from 'path';
import { TestRunner } from '../core/runner';

async function main() {
  const args = process.argv.slice(2);
  const pattern = args[0];
  const cwd = process.cwd();
  
  const runner = new TestRunner(cwd);
  
  if (pattern) {
    await runner.runFile(resolve(cwd, pattern));
  } else {
    await runner.runAll();
  }
}

main().catch(console.error); 