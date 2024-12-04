import type { Expect } from 'expect';
import type { Page } from 'playwright';
import type { ShortestGlobals } from './dist/types/globals';
import type { UITestBuilderInterface } from './dist/types/ui-test-builder';
import type { TestStep, BeforeAllFunction, AfterAllFunction } from './dist/types/test';
import type { ShortestConfig } from './dist/types/config';

declare global {
  const define: (name: string, fn: () => void | Promise<void>) => void;
  const expect: Expect;
  const __shortest__: ShortestGlobals;
  const beforeAll: (fn: () => void | Promise<void>) => void;
  const afterAll: (fn: () => void | Promise<void>) => void;
}

declare module '@antiwork/shortest' {
  export type { ShortestConfig };
  
  export interface StepContext {
    page: Page;
  }

  export type StepCallback = (context: StepContext) => Promise<void>;
  
  export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
    path: string;
    testName: string;
    steps: TestStep[];
    
    constructor(path: string);
    setSuiteName(name: string): this;
    getSuiteName(): string;
    test(name: string): this;

    given(description: string): this;
    given(description: string, callback: StepCallback): this;
    given(description: string, payload: T, callback?: StepCallback): this;

    when(description: string): this;
    when(description: string, callback: StepCallback): this;
    when(description: string, payload: T, callback?: StepCallback): this;

    expect(description: string): this;
    expect(description: string, callback: StepCallback): this;
    expect(description: string, payload: T, callback?: StepCallback): this;

    before(actionOrFn: string | StepCallback, payload?: T): this;
    after(actionOrFn: string | StepCallback, payload?: T): this;
  }
} 