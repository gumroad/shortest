// Import types
import { ShortestConfig } from './types';
import { defaultConfig } from './types';
import { TestCompiler } from './core/compiler';
import { UITestBuilder } from './ui-test-builder';
import { UITestBuilderInterface } from './types/builder';
import { BeforeAllFunction, AfterAllFunction, TestSuite } from './types';

// Define global registry type
declare global {
  var __shortest_registry__: {
    suites: Map<string, UITestBuilderInterface[]>;
    currentSuite: string | null;
    beforeAllFns: BeforeAllFunction[];
    afterAllFns: AfterAllFunction[];
  };
}

// Initialize global registry
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

  static beforeAllFns: BeforeAllFunction[] = [];
  static afterAllFns: AfterAllFunction[] = [];

  static registerTest(builder: UITestBuilderInterface): void {
    const currentSuite = this.getCurrentSuite();
    if (currentSuite) {
      const suite = this.suites.get(currentSuite) || [];
      suite.push(builder);
      this.suites.set(currentSuite, suite);
    }
  }
}

// Export test functions
export function define(name: string, fn: () => void): void {
  TestRegistry.startSuite(name);
  fn();
  TestRegistry.endSuite();
}

export function beforeAll(fn: BeforeAllFunction): void {
  const currentSuite = TestRegistry.getCurrentSuite();
  TestRegistry.beforeAllFns.push(fn);
}

export function afterAll(fn: AfterAllFunction): void {
  const currentSuite = TestRegistry.getCurrentSuite();
  TestRegistry.afterAllFns.push(fn);
}

// Export other classes/functions
export { UITestBuilder };
export type { UITestBuilderInterface };
export type { ShortestConfig };
export * from './types';
