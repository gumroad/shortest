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

  given(description: string, payload?: any, assert?: () => Promise<void>): this {
    this.steps.push({
      type: 'GIVEN',
      action: description,
      payload,
      assert
    });
    return this;
  }

  when(description: string, assert?: () => Promise<void>): this {
    this.steps.push({
      type: 'WHEN',
      action: description,
      assert
    });
    return this;
  }

  expect(description: string, assert?: () => Promise<void>): this {
    this.steps.push({
      type: 'EXPECT',
      action: description,
      assert
    });
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
  