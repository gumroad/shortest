import { TestSuite, BeforeAllFunction, AfterAllFunction } from './types';
import { UITestBuilderInterface } from './types/builder';
import { ShortestConfig, defaultConfig } from './config/types';
import { TestCompiler } from './core/compiler';
import { UITestBuilder } from './ui-test-builder';

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
    suites: new Map(),
    currentSuite: null,
    beforeAllFns: [],
    afterAllFns: []
  };
}

export class TestRegistry {
  static get suites() {
    return global.__shortest_registry__.suites;
  }

  static get currentSuite() {
    return global.__shortest_registry__.currentSuite;
  }

  static set currentSuite(name: string | null) {
    global.__shortest_registry__.currentSuite = name;
  }

  static startSuite(name: string) {
    this.currentSuite = name;
    if (!this.suites.has(name)) {
      this.suites.set(name, []);
    }
  }

  static registerTest(builder: UITestBuilderInterface) {
    if (this.currentSuite) {
      const suite = this.suites.get(this.currentSuite)!;
      suite.push(builder);
      builder.setSuiteName(this.currentSuite);
    }
  }

  static endSuite() {
    this.currentSuite = null;
  }

  static getAllTests() {
    return this.suites;
  }

  static clear() {
    this.suites.clear();
    this.currentSuite = null;
  }

  static get beforeAllFns() {
    return global.__shortest_registry__.beforeAllFns;
  }

  static get afterAllFns() {
    return global.__shortest_registry__.afterAllFns;
  }

  static getCurrentSuite(): TestSuite | null {
    const name = this.currentSuite;
    if (!name) return null;
    
    return {
      name,
      tests: [],
      beforeAll: undefined,
      afterAll: undefined
    };
  }
}

let config: ShortestConfig;
const compiler = new TestCompiler();

export async function initialize() {
  const configFiles = [
    'shortest.config.ts',
    'shortest.config.js',
    'shortest.config.mjs'
  ];

  for (const file of configFiles) {
    try {
      const module = await compiler.loadModule(file, process.cwd());
      config = { ...defaultConfig, ...module.default };
      return;
    } catch (error) {
      continue;
    }
  }

  config = defaultConfig;
}

export function getConfig(): ShortestConfig {
  return config;
}

export function define(name: string, fn: () => void): void {
  TestRegistry.startSuite(name);
  fn();
  TestRegistry.endSuite();
}

export function beforeAll(fn: BeforeAllFunction): void {
  const currentSuite = TestRegistry.getCurrentSuite();
  if (currentSuite) {
    currentSuite.beforeAll = fn;
  } else {
    TestRegistry.beforeAllFns.push(fn);
  }
}

export function afterAll(fn: AfterAllFunction): void {
  const currentSuite = TestRegistry.getCurrentSuite();
  if (currentSuite) {
    currentSuite.afterAll = fn;
  } else {
    TestRegistry.afterAllFns.push(fn);
  }
}

export { UITestBuilder } from './ui-test-builder';
export type { UITestBuilderInterface } from './types/builder';
export type { TestSuite, BeforeAllFunction, AfterAllFunction } from './types';
export type { ShortestConfig, BrowserConfig } from './config/types';