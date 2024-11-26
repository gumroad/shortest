import { TestRegistry } from './index';
import { TestStep, BeforeAllFunction, AfterAllFunction, ActionType } from './types/test';
import { UITestBuilderInterface } from './types/ui-test-builder';

export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
  path: string;
  testName: string;
  steps: TestStep[] = [];
  private suiteName: string = '';

  constructor(path: string) {
    this.path = path;
    this.testName = '';
    TestRegistry.registerTest(this);
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

  private isAssertFunction(value: any): value is () => Promise<void> {
    return typeof value === 'function';
  }

  private createStep(
    type: TestStep['type'],
    description: string,
    assertOrPayload?: (() => Promise<void>) | T,
    assert?: () => Promise<void>
  ): TestStep {
    const baseStep = {
      type,
      description,
      action: description
    };

    if (!assertOrPayload) {
      return baseStep;
    }

    if (this.isAssertFunction(assertOrPayload)) {
      return {
        ...baseStep,
        assert: assertOrPayload
      };
    }

    return {
      ...baseStep,
      payload: assertOrPayload,
      assert
    };
  }

  given(description: string, assertOrPayload?: (() => Promise<void>) | T, assert?: () => Promise<void>): this {
    this.steps.push(this.createStep('GIVEN', description, assertOrPayload, assert));
    return this;
  }

  when(description: string, assertOrPayload?: (() => Promise<void>) | T, assert?: () => Promise<void>): this {
    this.steps.push(this.createStep('WHEN', description, assertOrPayload, assert));
    return this;
  }

  expect(description: string, assertOrPayload?: (() => Promise<void>) | T, assert?: () => Promise<void>): this {
    this.steps.push(this.createStep('EXPECT', description, assertOrPayload, assert));
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
    this.steps.push({ 
      type, 
      description: action,
      action,
      payload, 
      assert 
    });
    
    if (assert) {
      try {
        await assert();
      } catch (error: any) {
        throw error;
      }
    }
  }
}
  