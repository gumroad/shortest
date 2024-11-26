import type { TestStep, BeforeAllFunction, AfterAllFunction } from './test';

export interface UITestBuilderInterface<T = any> {
  path: string;
  testName: string;
  steps: TestStep[];
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