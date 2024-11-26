import type { TestStep, BeforeAllFunction, AfterAllFunction } from './test';

export interface UITestBuilderInterface<T = any> {
  path: string;
  testName: string;
  steps: TestStep[];
  setSuiteName(name: string): this;
  getSuiteName(): string;
  test(name: string): this;
  given(action: string, payload?: T, assert?: () => Promise<void>): this;
  when(action: string, payload?: T, assert?: () => Promise<void>): this;
  expect(assertion: string, payload?: T, assert?: () => Promise<void>): this;
  before(actionOrFn: string | BeforeAllFunction, payload?: T): this;
  after(actionOrFn: string | AfterAllFunction, payload?: T): this;
} 