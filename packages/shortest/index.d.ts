import type { Expect } from 'expect';
import type { ShortestGlobals } from './dist/types/globals';
import type { UITestBuilderInterface } from './dist/types/ui-test-builder';
import type { TestStep, BeforeAllFunction, AfterAllFunction } from './dist/types/test';

declare global {
  const define: (name: string, fn: () => void | Promise<void>) => void;
  const expect: Expect;
  const __shortest__: ShortestGlobals;
}

// Export module types
declare module '@antiwork/shortest' {
  export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
    path: string;
    testName: string;
    steps: TestStep[];
    
    constructor(path: string);
    setSuiteName(name: string): this;
    getSuiteName(): string;
    test(name: string): this;

    given(description: string): this;
    given(description: string, callback: () => Promise<void>): this;
    given(description: string, payload: T, callback?: () => Promise<void>): this;

    when(description: string): this;
    when(description: string, callback: () => Promise<void>): this;
    when(description: string, payload: T, callback?: () => Promise<void>): this;

    expect(description: string): this;
    expect(description: string, callback: () => Promise<void>): this;
    expect(description: string, payload: T, callback?: () => Promise<void>): this;

    before(actionOrFn: string | BeforeAllFunction, payload?: T): this;
    after(actionOrFn: string | AfterAllFunction, payload?: T): this;
  }
} 