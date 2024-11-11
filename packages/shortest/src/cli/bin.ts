#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';

const VALID_FLAGS = ['--headless'];

async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner(process.cwd(), true, args.includes('--headless'));
  
  // Validate all args first
  const invalidFlags = args.filter(arg => arg.startsWith('--') && !VALID_FLAGS.includes(arg));
  
  if (invalidFlags.length > 0) {
    console.error(`Error: Invalid argument(s): ${invalidFlags.join(', ')}`);
    process.exit(1);
  }

  const testPattern = args.find(arg => !arg.startsWith('--'));
  
  try {
    if (testPattern) {
      await runner.runFile(testPattern);
    } else {
      await runner.runAll();
    }
  } catch (error) {
    console.error('Error: Invalid argument(s)');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}); 