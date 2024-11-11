#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';

const VALID_FLAGS = ['--headless'];
const VALID_PARAMS = ['--target'];

async function main() {
  const args = process.argv.slice(2);
  
  // Parse args with values
  const params = new Map<string, string>();
  const otherArgs = args.filter(arg => {
    if (arg.includes('=')) {
      const [key, value] = arg.split('=');
      if (VALID_PARAMS.includes(key)) {
        params.set(key, value);
        return false;
      }
    }
    return true;
  });

  // Validate remaining flags
  const invalidFlags = otherArgs.filter(arg => arg.startsWith('--') && !VALID_FLAGS.includes(arg));
  
  if (invalidFlags.length > 0) {
    console.error(`Error: Invalid argument(s): ${invalidFlags.join(', ')}`);
    process.exit(1);
  }

  const headless = otherArgs.includes('--headless');
  const targetUrl = params.get('--target');
  const testPattern = otherArgs.find(arg => !arg.startsWith('--'));
  
  const runner = new TestRunner(process.cwd(), true, headless, targetUrl);
  
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