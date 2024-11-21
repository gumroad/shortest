#!/usr/bin/env node

import { TestRunner } from '../core/runner.js';
import { GitHubTool } from '../tools/github.js';
import pc from 'picocolors';

const VALID_FLAGS = ['--headless', '--github-code'];
const VALID_PARAMS = ['--target', '--secret'];

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

  // Handle GitHub code generation
  if (otherArgs.includes('--github-code')) {
    try {
      const secret = params.get('--secret');
      const github = new GitHubTool(secret);
      const { code, timeRemaining } = github.generateTOTPCode();
      
      console.log('\n' + pc.bgCyan(pc.black(' GitHub 2FA Code ')));
      console.log(pc.cyan('Code: ') + pc.bold(code));
      console.log(pc.cyan('Expires in: ') + pc.bold(`${timeRemaining}s`));
      console.log(pc.dim(`Using secret from: ${secret ? 'CLI flag' : '.env file'}\n`));
      
      process.exit(0);
    } catch (error) {
      console.error(pc.red('\n✖ Error:'), (error as Error).message, '\n');
      process.exit(1);
    }
  }

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