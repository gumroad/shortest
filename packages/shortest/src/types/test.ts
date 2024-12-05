import type { Page } from 'playwright';

export interface AssertionError extends Error {
  matcherResult?: {
    message: string;
    pass: boolean;
    actual: any;
    expected: any;
  };
}

export interface TestContext {
  page: Page;
  currentTest?: TestFunction;
  currentStepIndex?: number;
}

export type TestHookFunction = (context: TestContext) => Promise<void>;

export interface TestFunction {
  name: string;
  payload?: any;
  fn: (context: TestContext) => Promise<void>;
  expectations?: {
    description: string;
    fn?: (context: TestContext) => Promise<void>;
  }[];
}

export interface TestChain {
  expect: (description: string, fn?: (context: TestContext) => Promise<void>) => TestChain;
}

export interface TestAPI {
  (name: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain;
  beforeAll: (nameOrFn: string | ((ctx: TestContext | { page: Page }) => Promise<void>)) => void;
  afterAll: (nameOrFn: string | ((ctx: TestContext | { page: Page }) => Promise<void>)) => void;
  beforeEach: (nameOrFn: string | ((ctx: TestContext | { page: Page }) => Promise<void>)) => void;
  afterEach: (nameOrFn: string | ((ctx: TestContext | { page: Page }) => Promise<void>)) => void;
}

export type { Page } from 'playwright';
 