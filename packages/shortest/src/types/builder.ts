import { BeforeAllFunction, AfterAllFunction, ActionType, TestStep } from './index';

export interface UITestBuilderInterface<T = any> {
  path: string;
  testName: string;
  steps: TestStep[];
  setSuiteName(name: string): this;
  getSuiteName(): string;
  test(name: string): this;
  given(actionOrState: ActionType, payload?: T): this;
  when(action: ActionType, payload?: T): this;
  expect(assertion: ActionType, payload?: T): this;
  before(actionOrFn: ActionType | BeforeAllFunction, payload?: T): this;
  after(actionOrFn: ActionType | AfterAllFunction, payload?: T): this;
} 