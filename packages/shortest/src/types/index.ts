// Test related types
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

// Action types
export type ActionType = string | Record<string, any>;
export type ActionParams = void | ActionType;

export interface TestStep {
    type: 'GIVEN' | 'WHEN' | 'EXPECT' | 'BEFORE' | 'AFTER';
    action: string;
    payload?: any;
}

// Browser related types
export interface BrowserConfig {
    name: 'chrome' | 'firefox' | 'safari' | 'edge';
    headless?: boolean;
}

// AI related types
export interface AIConfig {
    apiKey: string;
    model?: string;
}

// Main config type
export interface ShortestConfig {
    browsers?: BrowserConfig[];
    baseUrl?: string;
    testDir?: string | string[];
    ai?: AIConfig;  // Add AI config here
}

export const defaultConfig: ShortestConfig = {
    browsers: [{ name: 'chrome', headless: true }],
    baseUrl: 'http://localhost:3000',
    testDir: '__tests__',
    ai: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: 'claude-3-sonnet-20240229'
    }
};

// Test steps and actions
export interface TestAction {
    type: string;
    payload?: any;
}

export interface ParsedTestStep {
    type: 'BEFORE' | 'GIVEN' | 'WHEN' | 'EXPECT' | 'AFTER';
    description: string;
    payload?: any;
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