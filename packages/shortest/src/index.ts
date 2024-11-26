import dotenv from 'dotenv';
import { join } from 'path';
import { expect as jestExpect } from 'expect';
import { TestCompiler } from './core/compiler';
import { UITestBuilder } from './ui-test-builder';
import { 
  UITestBuilderInterface,
  BeforeAllFunction, 
  AfterAllFunction,
  ShortestConfig,
  defaultConfig
} from './types';

// Initialize global registry
declare global {
  var __shortest_registry__: {
    suites: Map<string, UITestBuilderInterface[]>;
    currentSuite: string | null;
    beforeAllFns: BeforeAllFunction[];
    afterAllFns: AfterAllFunction[];
  };
}

if (!global.__shortest_registry__) {
  global.__shortest_registry__ = {
    suites: new Map<string, UITestBuilderInterface[]>(),
    currentSuite: null,
    beforeAllFns: [],
    afterAllFns: []
  };
}

// Config and compiler instances
let config: ShortestConfig;
const compiler = new TestCompiler();

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
    return global.__shortest_registry__.suites;
  }

  static get beforeAllFns() {
    return global.__shortest_registry__.beforeAllFns;
  }

  static get afterAllFns() {
    return global.__shortest_registry__.afterAllFns;
  }

  static getAllTests(): Map<string, UITestBuilderInterface[]> {
    return this.suites;
  }

  static getCurrentSuite(): string | null {
    return global.__shortest_registry__.currentSuite;
  }

  static startSuite(name: string) {
    global.__shortest_registry__.currentSuite = name;
    if (!this.suites.has(name)) {
      this.suites.set(name, []);
    }
  }

  static endSuite() {
    global.__shortest_registry__.currentSuite = null;
  }

  static registerTest(builder: UITestBuilderInterface): void {
    const currentSuite = this.getCurrentSuite();
    if (currentSuite) {
      const suite = this.suites.get(currentSuite) || [];
      suite.push(builder);
      this.suites.set(currentSuite, suite);
    }
  }
}

export function define(name: string, fn: () => void | Promise<void>): void {
  TestRegistry.startSuite(name);
  Promise.resolve(fn()).then(() => {
    TestRegistry.endSuite();
  });
}

export function beforeAll(fn: BeforeAllFunction): void {
  TestRegistry.beforeAllFns.push(fn);
}

export function afterAll(fn: AfterAllFunction): void {
  TestRegistry.afterAllFns.push(fn);
}

export { UITestBuilder };
export { jestExpect as expect };
export * from './types';
