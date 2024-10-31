import { TestSuite, BeforeAllFunction, AfterAllFunction } from './types';
import { ShortestConfig, defaultConfig } from './config/types';
import { TestCompiler } from './core/compiler';

export let currentSuite: TestSuite | null = null;
export const beforeAllFns: BeforeAllFunction[] = [];
export const afterAllFns: AfterAllFunction[] = [];

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

  // If no config file is found, use default config
  config = defaultConfig;
}

export function getConfig(): ShortestConfig {
  return config;
}

export function define(name: string, fn: () => void): void {
  currentSuite = {
    name,
    tests: []
  };

  fn();
  currentSuite = null;
}

export function beforeAll(fn: BeforeAllFunction): void {
  if (currentSuite) {
    currentSuite.beforeAll = fn;
  } else {
    beforeAllFns.push(fn);
  }
}

export function afterAll(fn: AfterAllFunction): void {
  if (currentSuite) {
    currentSuite.afterAll = fn;
  } else {
    afterAllFns.push(fn);
  }
}

export { UITestBuilder } from './ui-test-builder';
export type { TestSuite, BeforeAllFunction, AfterAllFunction } from './types';
export type { ShortestConfig, BrowserConfig } from './config/types';