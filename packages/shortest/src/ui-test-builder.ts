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
    TestRegistry.registerTest(this as unknown as UITestBuilderInterface);
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

  given(action?: string, payload?: T | (() => Promise<void>), assert?: () => Promise<void>): this {
    if (action) {
      if (payload && typeof payload === 'function') {
        const assertFn = payload as () => Promise<void>;
        this.addStep('GIVEN', action, undefined, assertFn);
      } else {
        this.addStep('GIVEN', action, payload as T, assert);
      }
    }
    return this;
  }

  when(action?: string, payload?: T | (() => Promise<void>), assert?: () => Promise<void>): this {
    if (action) {
      if (payload && typeof payload === 'function') {
        const assertFn = payload as () => Promise<void>;
        this.addStep('WHEN', action, undefined, assertFn);
      } else {
        this.addStep('WHEN', action, payload as T, assert);
      }
    }
    return this;
  }

  expect(assertion?: string, payload?: T | (() => Promise<void>), assert?: () => Promise<void>): this {
    if (assertion) {
      if (payload && typeof payload === 'function') {
        const assertFn = payload as () => Promise<void>;
        this.addStep('EXPECT', assertion, undefined, assertFn);
      } else {
        this.addStep('EXPECT', assertion, payload as T, assert);
      }
    }
    return this;
  }

  before(actionOrFn: ActionType | BeforeAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.addStep('BEFORE', 'EXECUTE_FUNCTION', actionOrFn);
    } else {
      this.addStep('BEFORE', typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE', payload);
    }
    return this;
  }

  after(actionOrFn: ActionType | AfterAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.addStep('AFTER', 'EXECUTE_FUNCTION', actionOrFn);
    } else {
      this.addStep('AFTER', typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE', payload);
    }
    return this;
  }

  private async addStep(
    type: TestStep['type'], 
    action: string, 
    payload?: any,
    assert?: () => Promise<void>
  ): Promise<void> {
    this.steps.push({ type, action, payload, assert });
    if (assert) {
      try {
        await assert();
      } catch (error: any) {
        throw error;
      }
    }
  }
}

export type { UITestBuilderInterface };
  