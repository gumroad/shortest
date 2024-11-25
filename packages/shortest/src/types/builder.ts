import { BeforeAllFunction, AfterAllFunction, ActionType, TestStep } from './index';

export interface UITestBuilderInterface<T = any> {
  path: string;
  testName: string;
  steps: TestStep[];
  setSuiteName(name: string): this;
  getSuiteName(): string;
  test(name: string): this;
  given(action: string, payload?: T | (() => Promise<void>) | undefined, assert?: () => Promise<void>): this;
  when(action: string, payload?: T | (() => Promise<void>) | undefined, assert?: () => Promise<void>): this;
  expect(assertion: string, payload?: T | (() => Promise<void>) | undefined, assert?: () => Promise<void>): this;
  before(actionOrFn: ActionType | BeforeAllFunction, payload?: T): this;
  after(actionOrFn: ActionType | AfterAllFunction, payload?: T): this;
} 