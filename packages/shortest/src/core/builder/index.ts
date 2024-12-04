import { TestRegistry } from '../../index';
import { TestStep, BeforeAllFunction, AfterAllFunction, ActionType } from '../../types/test';
import { UITestBuilderInterface } from '../../types/ui-test-builder';
import { TestCase, TestSuite } from '../../types/test';
import { getConfig } from '../../index';
import { Page } from 'playwright';

export interface StepContext {
  page: Page;
}

export type StepCallback = (context: StepContext) => Promise<void>;

export class UITestBuilder<T = any> implements UITestBuilderInterface<T> {
  path: string;
  testName: string;
  steps: TestStep[] = [];
  private suiteName: string = '';
  private processedSuites = new Set<string>();
  private beforeHooks: StepCallback[] = [];
  private afterHooks: StepCallback[] = [];

  constructor(path: string) {
    this.path = path;
    this.testName = '';
  }

  test(name: string): this {
    this.testName = name;
    TestRegistry.registerTest(this);
    return this;
  }

  setSuiteName(name: string): this {
    this.suiteName = name;
    TestRegistry.startSuite(name);
    return this;
  }

  getSuiteName(): string {
    return this.suiteName;
  }

  private isCallbackFunction(value: any): value is StepCallback {
    return typeof value === 'function';
  }

  private createStep(
    type: TestStep['type'],
    description: string,
    callbackOrPayload?: StepCallback | T,
    callback?: StepCallback
  ): TestStep {
    const baseStep = {
      type,
      description,
      action: description
    };

    if (!callbackOrPayload) {
      return baseStep;
    }

    if (this.isCallbackFunction(callbackOrPayload)) {
      return {
        ...baseStep,
        callback: callbackOrPayload,
        hasCallback: true
      };
    }

    return {
      ...baseStep,
      payload: callbackOrPayload,
      callback,
      hasCallback: !!callback
    };
  }

  given(description: string): this;
  given(description: string, callback: () => Promise<void>): this;
  given(description: string, payload: T, callback?: () => Promise<void>): this;
  given(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('GIVEN', description, callbackOrPayload, callback));
    return this;
  }

  when(description: string): this;
  when(description: string, callback: () => Promise<void>): this;
  when(description: string, payload: T, callback?: () => Promise<void>): this;
  when(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('WHEN', description, callbackOrPayload, callback));
    return this;
  }

  expect(description: string): this;
  expect(description: string, callback: () => Promise<void>): this;
  expect(description: string, payload: T, callback?: () => Promise<void>): this;
  expect(description: string, callbackOrPayload?: (() => Promise<void>) | T, callback?: () => Promise<void>): this {
    this.steps.push(this.createStep('EXPECT', description, callbackOrPayload, callback));
    return this;
  }

  before(actionOrFn: string | BeforeAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.beforeHooks.push(actionOrFn as () => Promise<void>);
    } else {
      this.steps.push({
        type: 'BEFORE',
        description: typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE',
        action: actionOrFn,
        payload
      });
    }
    return this;
  }

  after(actionOrFn: string | AfterAllFunction, payload?: T): this {
    if (typeof actionOrFn === 'function') {
      this.afterHooks.push(actionOrFn as () => Promise<void>);
    } else {
      this.steps.push({
        type: 'AFTER',
        description: typeof actionOrFn === 'string' ? actionOrFn : 'SET_STATE',
        action: actionOrFn,
        payload
      });
    }
    return this;
  }

  getBeforeHooks(): StepCallback[] {
    return this.beforeHooks;
  }

  getAfterHooks(): StepCallback[] {
    return this.afterHooks;
  }

  private async addStep(
    type: TestStep['type'], 
    action: string, 
    payload?: any,
    callback?: () => Promise<void>
  ): Promise<void> {
    this.steps.push({ 
      type, 
      description: action,
      action,
      payload, 
      callback,
      hasCallback: !!callback
    });
    
    if (callback) {
      try {
        await callback();
      } catch (error: any) {
        throw error;
      }
    }
  }

  // Parser functionality
  async parseModule(compiledModule: any): Promise<TestSuite[]> {
    const suites: TestSuite[] = [];
    const testMap = TestRegistry.getAllTests();
    
    for (const [suiteName, builders] of testMap.entries()) {
      if (this.processedSuites.has(suiteName)) {
        continue;
      }
      
      const suite: TestSuite = {
        name: suiteName,
        tests: builders.map((builder: UITestBuilderInterface<T>) => this.parseTestBuilder(builder))
      };
      
      suite.tests.forEach(test => UITestBuilder.generateTestPrompt(test, suiteName));
      
      this.processedSuites.add(suiteName);
      suites.push(suite);
    }

    return suites;
  }

  private parseTestBuilder(builder: UITestBuilderInterface<T>): TestCase {
    const steps: TestStep[] = builder.steps.map((step: any) => ({
      type: step.type,
      description: typeof step.action === 'string' ? step.action : 'SET_STATE',
      action: step.action,
      payload: step.payload,
      hasCallback: !!step.callback,
      callback: step.callback
    }));

    return {
      suiteName: builder.getSuiteName(),
      path: builder.path,
      fullPath: this.getFullPath(builder.path),
      testName: builder.testName,
      steps
    };
  }

  private getFullPath(path: string): string {
    const config = getConfig();
    const baseUrl = config.baseUrl?.replace(/\/$/, '') || '';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  static async parseModule(compiledModule: any): Promise<TestSuite[]> {
    const parser = new UITestBuilder('/');
    return parser.parseModule(compiledModule);
  }

  static generateTestPrompt(test: TestCase, suiteName: string): string {
    const steps = test.steps.map(step => {
      const stepStr = `${step.type}: "${step.description}"`;
      const payloadInfo = step.payload ? ` with payload ${JSON.stringify(step.payload)}` : '';
      const callbackInfo = step.hasCallback ? ' [HAS_CALLBACK]' : '';
      return `${stepStr}${payloadInfo}${callbackInfo}`;
    }).join('\n');

    return [
      `Context: ${suiteName}`,
      'Steps:',
      steps,
      'Expected Results:',
      test.steps
        .filter(step => step.type === 'EXPECT')
        .map(exp => `- ${exp.description}`)
        .join('\n')
    ].join('\n');
  }
}
