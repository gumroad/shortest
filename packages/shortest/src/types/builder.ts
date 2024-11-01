import { TestFunction, BeforeFunction, AfterFunction, ActionType, TestStep, ActionParams } from './index';

export interface UITestBuilderInterface {
  path: string;
  testName: string;
  steps: TestStep[];
  setSuiteName(name: string): this;
  getSuiteName(): string;
} 