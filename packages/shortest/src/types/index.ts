export interface TestContext {
    testName: string;
}

export interface BeforeAllFunction {
    (): Promise<void> | void;
}

export interface AfterAllFunction {
    (): Promise<void> | void;
}

export interface TestSuite {
    name: string;
    beforeAll?: BeforeAllFunction;
    afterAll?: AfterAllFunction;
    tests: TestContext[];
}

export type ActionType = string | Record<string, any>;
export type ActionParams = void | ActionType;

export interface TestStep {
    type: 'GIVEN' | 'WHEN' | 'EXPECT' | 'BEFORE' | 'AFTER';
    action: string;
    payload?: any;
    assert?: () => Promise<void>;
}

// Browser related types
export interface BrowserConfig {
    name: 'chrome' | 'firefox' | 'safari' | 'edge';
    headless?: boolean;
}

export interface AIConfig {
    apiKey: string;
}

export interface ShortestConfig {
    browsers?: BrowserConfig[];
    baseUrl?: string;
    testDir?: string | string[];
    ai?: AIConfig;
}

export const defaultConfig: ShortestConfig = {
    browsers: [{ name: 'chrome', headless: false }],
    baseUrl: 'http://localhost:3000',
    testDir: '__tests__',
    ai: {
      apiKey: process.env.ANTHROPIC_API_KEY || ''
    }
};

export interface TestAction {
    type: string;
    payload?: any;
}

export interface ParsedTestStep {
    type: 'BEFORE' | 'GIVEN' | 'WHEN' | 'EXPECT' | 'AFTER';
    description: string;
    payload?: any;
    hasCallback?: boolean;
}

export interface ParsedTest {
    suiteName: string;
    path: string;
    fullPath: string; // with baseUrl
    testName: string;
    steps: ParsedTestStep[];
}

export interface ParsedTestSuite {
    name: string;
    tests: ParsedTest[];
}

export interface AssertionError extends Error {
  matcherResult?: {
    message: string;
    pass: boolean;
    actual: any;
    expected: any;
  };
}