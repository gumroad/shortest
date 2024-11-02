import { getConfig, TestRegistry } from './index';
import { BeforeAllFunction, AfterAllFunction, ActionType, TestStep } from './types';
import { UITestBuilderInterface } from './types/builder';

export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
  path: string;
  testName: string;
  steps: TestStep[] = [];
  private suiteName: string = '';

  constructor(path: string) {
    this.path = path;
    this.testName = '';
    TestRegistry.registerTest(this as UITestBuilderInterface);
  }

  test(name: string): this {
    this.testName = name;
    return this;
  }

  setSuiteName(name: string): this {
    this.suiteName = name;
    return this;
  }

  getSuiteName(): string {
    return this.suiteName;
  }

  given(actionOrState: ActionType, payload?: T): this {
    if (typeof actionOrState === 'string') {
      return this.addStep('GIVEN', actionOrState, payload);
    }
    return this.addStep('GIVEN', 'SET_STATE', actionOrState);
  }

  when(action: ActionType, payload?: T): this {
    if (typeof action === 'string') {
      return this.addStep('WHEN', action, payload);
    }
    return this.addStep('WHEN', 'SET_STATE', action);
  }

  expect(assertion: ActionType, payload?: T): this {
    if (typeof assertion === 'string') {
      return this.addStep('EXPECT', assertion, payload);
    }
    return this.addStep('EXPECT', 'ASSERT_STATE', assertion);
  }

  before(actionOrFn: ActionType | BeforeAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      return this.addStep('BEFORE', 'EXECUTE_FUNCTION', actionOrFn);
    }
    if (typeof actionOrFn === 'string') {
      return this.addStep('BEFORE', actionOrFn, payload);
    }
    return this.addStep('BEFORE', 'SET_STATE', actionOrFn);
  }

  after(actionOrFn: ActionType | AfterAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      return this.addStep('AFTER', 'EXECUTE_FUNCTION', actionOrFn);
    }
    if (typeof actionOrFn === 'string') {
      return this.addStep('AFTER', actionOrFn, payload);
    }
    return this.addStep('AFTER', 'SET_STATE', actionOrFn);
  }

  private addStep(type: TestStep['type'], action: string, payload?: any): this {
    this.steps.push({ type, action, payload });
    return this;
  }
}

export type { UITestBuilderInterface };
  