export interface TestContext {
  currentTest: TestCase;
  currentStepIndex: number;
  testName?: string;
}

export interface TestStep {
  type: 'GIVEN' | 'WHEN' | 'EXPECT' | 'BEFORE' | 'AFTER';
  description: string;
  action: string;
  payload?: any;
  hasCallback?: boolean;
  callback?: () => Promise<void>;
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