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
  fn?: (context: TestContext) => Promise<void>;
  expectations?: {
    description: string;
    payload?: any;
    fn?: (context: TestContext) => Promise<void>;
  }[];
}

export interface TestChain {
  expect(description: string): TestChain;
  expect(description: string, fn?: (context: TestContext) => Promise<void>): TestChain;
  expect(description: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain;
}

export interface TestAPI {
  (name: string): TestChain;
  (name: string, fn?: (context: TestContext) => Promise<void>): TestChain;
  (name: string, payload?: any, fn?: (context: TestContext) => Promise<void>): TestChain;
  
  beforeAll(fn: (context: TestContext) => Promise<void>): void;
  beforeAll(name: string, fn: (context: TestContext) => Promise<void>): void;
  
  afterAll(fn: (context: TestContext) => Promise<void>): void;
  afterAll(name: string, fn: (context: TestContext) => Promise<void>): void;
  
  beforeEach(fn: (context: TestContext) => Promise<void>): void;
  beforeEach(name: string, fn: (context: TestContext) => Promise<void>): void;
  
  afterEach(fn: (context: TestContext) => Promise<void>): void;
  afterEach(name: string, fn: (context: TestContext) => Promise<void>): void;
}

export type { Page } from 'playwright';

export interface TestRegistry {
  tests: Map<string, TestFunction[]>;
  currentFileTests: TestFunction[];
  beforeAllFns: TestHookFunction[];
  afterAllFns: TestHookFunction[];
  beforeEachFns: TestHookFunction[];
  afterEachFns: TestHookFunction[];
}

export class CallbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CallbackError';
  }
}
 