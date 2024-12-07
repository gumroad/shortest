import dotenv from 'dotenv';
import { join } from 'path';
import { expect as jestExpect } from 'expect';
import { TestCompiler } from './core/compiler';
import { 
  TestFunction,
  TestAPI,
  TestContext,
  TestChain,
  ShortestConfig,
  defaultConfig,
  TestHookFunction
} from './types';

// Initialize config
let globalConfig: ShortestConfig | null = null;
const compiler = new TestCompiler();

// Initialize shortest namespace and globals
declare const global: {
  __shortest__: any;
  expect: any;
} & typeof globalThis;

if (!global.__shortest__) {
  global.__shortest__ = {
    expect: jestExpect,
    registry: {
      tests: new Map<string, TestFunction[]>(),
      currentFileTests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: []
    }
  };

  // Attach to global scope
  global.expect = global.__shortest__.expect;

  dotenv.config({ path: join(process.cwd(), '.env') });
  dotenv.config({ path: join(process.cwd(), '.env.local') });
}

export async function initialize() {
  if (globalConfig) return globalConfig;

  dotenv.config({ path: join(process.cwd(), '.env') });
  dotenv.config({ path: join(process.cwd(), '.env.local') });
  
  const configFiles = [
    'shortest.config.ts',
    'shortest.config.js',
    'shortest.config.mjs'
  ];

  for (const file of configFiles) {
    try {
      const module = await compiler.loadModule(file, process.cwd());
      if (module.default) {
        globalConfig = {
          ...defaultConfig,
          ...module.default,
          // Override with env vars if present
          anthropicKey: process.env.ANTHROPIC_API_KEY || module.default.anthropicKey || defaultConfig.anthropicKey,
        };
        return globalConfig;
      }
    } catch (error) {
      continue;
    }
  }

  globalConfig = {
    ...defaultConfig,
    anthropicKey: process.env.ANTHROPIC_API_KEY || defaultConfig.anthropicKey,
  };
  return globalConfig;
}

export function getConfig(): ShortestConfig {
  if (!globalConfig) {
    throw new Error('Config not initialized. Call initialize() first');
  }
  return globalConfig;
}

// New Test API Implementation
function createTestChain(name: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain {
  const test: TestFunction = {
    name,
    payload,
    fn,
    expectations: []
  };

  global.__shortest__.registry.tests.set(name, 
    [...(global.__shortest__.registry.tests.get(name) || []), test]
  );
  
  global.__shortest__.registry.currentFileTests.push(test);

  const chain: TestChain = {
    expect(description: string, payloadOrFn?: any, fn?: (context: TestContext) => Promise<void>) {
      test.expectations = test.expectations || [];
      
      // Handle different overloads
      if (typeof payloadOrFn === 'function') {
        fn = payloadOrFn;
        payloadOrFn = undefined;
      }
      
      test.expectations.push({
        description,
        payload: payloadOrFn,
        fn
      });
      return chain;
    }
  };

  return chain;
}

export const test: TestAPI = Object.assign(
  (name: string, payload?: any, fn?: (context: TestContext) => Promise<void>) => 
    createTestChain(name, payload, fn),
  {
    beforeAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeAllFns.push(hook);
    },
    afterAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterAllFns.push(hook);
    },
    beforeEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeEachFns.push(hook);
    },
    afterEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === 'function' ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterEachFns.push(hook);
    }
  }
);

export type { ShortestConfig };
