import type { Expect } from 'expect';
import type { Page } from 'playwright';
import type { TestAPI, TestContext } from './dist/types/test';
import type { ShortestConfig } from './dist/types/config';

declare global {
  const expect: Expect;
}

declare module '@antiwork/shortest' {
  export const test: TestAPI;
  
  export interface TestContextProps {
    page: Page;
  }
  
  export interface TestAPI {
    (name: string, payload?: any, fn?: (context: TestContextProps) => Promise<void>): TestChain;
    beforeAll(nameOrFn?: string | ((context: TestContextProps) => Promise<void>), fn?: (context: TestContextProps) => Promise<void>): void;
    afterAll(nameOrFn?: string | ((context: TestContextProps) => Promise<void>), fn?: (context: TestContextProps) => Promise<void>): void;
    beforeEach(nameOrFn?: string | ((context: TestContextProps) => Promise<void>), fn?: (context: TestContextProps) => Promise<void>): void;
    afterEach(nameOrFn?: string | ((context: TestContextProps) => Promise<void>), fn?: (context: TestContextProps) => Promise<void>): void;
  }

  export interface TestChain {
    expect(description: string, fn?: (context: TestContextProps) => Promise<void>): TestChain;
  }
  
  export { TestContext };
  export type { ShortestConfig };
} 