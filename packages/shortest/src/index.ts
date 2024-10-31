import { TestSuite, BeforeAllFunction, AfterAllFunction } from './types';
import { ShortestConfig } from './config/types';
import { loadConfig } from './config/loader';

export let currentSuite: TestSuite | null = null;
export const beforeAllFns: BeforeAllFunction[] = [];
export const afterAllFns: AfterAllFunction[] = [];

let config: ShortestConfig;

export async function initialize() {
  config = await loadConfig();
  // TODO: use config values in test setup
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

  // Reset suite after execution
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
export * from './types';
export * from './config/types';