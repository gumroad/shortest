import dotenv from 'dotenv';
import { join } from 'path';
import { expect as jestExpect } from 'expect';
import { TestCompiler } from './core/compiler';
import { UITestBuilder } from './core/builder';
import { 
  UITestBuilderInterface,
  ShortestConfig,
  defaultConfig
} from './types';

// Initialize config
let config: ShortestConfig = defaultConfig;
const compiler = new TestCompiler();

// Initialize shortest namespace and globals immediately
declare const global: {
  __shortest__: any;
  define: any;
  expect: any;
  beforeAll: (fn: () => void | Promise<void>) => void;
  afterAll: (fn: () => void | Promise<void>) => void;
} & typeof globalThis;

if (!global.__shortest__) {
  global.__shortest__ = {
    define: (name: string, fn: () => void | Promise<void>) => {
      TestRegistry.startSuite(name);
      Promise.resolve(fn()).then(() => {
        TestRegistry.endSuite();
      });
    },
    expect: jestExpect,
    beforeAll: (fn: () => void | Promise<void>) => {
      global.__shortest__.registry.beforeAllFns.push(fn);
    },
    afterAll: (fn: () => void | Promise<void>) => {
      global.__shortest__.registry.afterAllFns.push(fn);
    },
    registry: {
      suites: new Map<string, UITestBuilderInterface[]>(),
      currentSuite: null,
      beforeAllFns: [],
      afterAllFns: []
    }
  };

  // Attach to global scope
  global.define = global.__shortest__.define;
  global.expect = global.__shortest__.expect;
  global.beforeAll = global.__shortest__.beforeAll;
  global.afterAll = global.__shortest__.afterAll;

  dotenv.config({ path: join(process.cwd(), '.env') });
  dotenv.config({ path: join(process.cwd(), '.env.local') });
}

export async function initialize() {
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
        config = { ...defaultConfig, ...module.default };
        return;
      }
    } catch (error) {
      continue;
    }
  }

  config = defaultConfig;
}

export function getConfig(): ShortestConfig {
  return config;
}

export class TestRegistry {
  static get suites() {
    return global.__shortest__.registry.suites;
  }

  static get beforeAllFns() {
    return global.__shortest__.registry.beforeAllFns;
  }

  static get afterAllFns() {
    return global.__shortest__.registry.afterAllFns;
  }

  static getAllTests(): Map<string, UITestBuilderInterface[]> {
    return this.suites;
  }

  static getCurrentSuite(): string | null {
    return global.__shortest__.registry.currentSuite;
  }

  static startSuite(name: string) {
    global.__shortest__.registry.currentSuite = name;
    if (!this.suites.has(name)) {
      this.suites.set(name, []);
    }
  }

  static endSuite() {
    global.__shortest__.registry.currentSuite = null;
  }

  static registerTest(builder: UITestBuilderInterface): void {
    const currentSuite = this.getCurrentSuite();
    if (currentSuite) {
      const suite = this.suites.get(currentSuite) || [];
      suite.push(builder);
      this.suites.set(currentSuite, suite);
    }
  }

  static clear() {
    global.__shortest__.registry.suites.clear();
    global.__shortest__.registry.currentSuite = null;
    global.__shortest__.registry.beforeAllFns = [];
    global.__shortest__.registry.afterAllFns = [];
  }
}

export { UITestBuilder } from './core/builder';
export * from './types';
