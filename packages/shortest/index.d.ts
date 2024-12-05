import type { Expect } from 'expect';
import type { Page } from 'playwright';
import type { TestAPI, TestContext } from './dist/types/test';
import type { ShortestConfig } from './dist/types/config';

declare global {
  const expect: Expect;
}

declare module '@antiwork/shortest' {
  export interface TestContextProps {
    page: Page;
  }

  export interface TestChain {
    // Expect overloads - similar to test function overloads
    expect(description: string): TestChain;
    expect(description: string, fn?: (context: TestContextProps) => Promise<void>): TestChain;
    expect(description: string, payload?: any, fn?: (context: TestContextProps) => Promise<void>): TestChain;
  }

  export interface TestAPI {
    // Test function overloads - only name is required
    (name: string): TestChain;
    (name: string, fn?: (context: TestContextProps) => Promise<void>): TestChain;
    (name: string, payload?: any, fn?: (context: TestContextProps) => Promise<void>): TestChain;
    
    // Lifecycle hooks overloads
    beforeAll(fn: (context: TestContextProps) => Promise<void>): void;
    beforeAll(name: string, fn: (context: TestContextProps) => Promise<void>): void;
    
    afterAll(fn: (context: TestContextProps) => Promise<void>): void;
    afterAll(name: string, fn: (context: TestContextProps) => Promise<void>): void;
    
    beforeEach(fn: (context: TestContextProps) => Promise<void>): void;
    beforeEach(name: string, fn: (context: TestContextProps) => Promise<void>): void;
    
    afterEach(fn: (context: TestContextProps) => Promise<void>): void;
    afterEach(name: string, fn: (context: TestContextProps) => Promise<void>): void;
  }

  export const test: TestAPI;
  export { TestContext };
  export type { ShortestConfig };
} 