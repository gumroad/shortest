import { Page } from 'playwright';

export interface TestContext {
  currentTest: TestCase;
  currentStepIndex: number;
  testName?: string;
  browserTool?: any;
}

export interface StepContext {
  page: Page;
}

export type StepCallback = (context: StepContext) => Promise<void>;

export interface TestStep {
  type: 'GIVEN' | 'WHEN' | 'EXPECT' | 'BEFORE' | 'AFTER';
  description: string;
  action: string;
  payload?: any;
  hasCallback?: boolean;
  callback?: StepCallback;
}

export interface TestCase {
  suiteName: string;
  path: string;
  fullPath: string;
  testName: string;
  steps: TestStep[];
}

export interface TestSuite {
  name: string;
  tests: TestCase[];
  context?: SuiteContext;
}

export interface BeforeAllFunction {
  (): Promise<void> | void;
}

export interface AfterAllFunction {
  (): Promise<void> | void;
}

export interface AssertionError extends Error {
  matcherResult?: {
    message: string;
    pass: boolean;
    actual: any;
    expected: any;
  };
}

export type ActionType = string | Record<string, any>;

export interface SuiteContext {
  name: string;
  beforeAllFns: (() => Promise<void>)[];
  afterAllFns: (() => Promise<void>)[];
} 