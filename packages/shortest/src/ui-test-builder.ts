import { getConfig, TestRegistry } from './index';
import { 
  AfterFunction, 
  BeforeFunction, 
  TestFunction, 
  ActionType, 
  TestStep,
  ActionParams 
} from './types';
import { UITestBuilderInterface } from './types/builder';

export class UITestBuilder<T = void> implements UITestBuilderInterface {
    path: string;
    testName: string;
    private suiteName: string = '';
    steps: TestStep[] = [];
  
    constructor(path: string) {
      this.path = path;
      this.testName = '';
      TestRegistry.registerTest(this);
    }
  
    test(name: string): this {
      this.testName = name;
      return this;
    }
  
    private addStep(type: TestStep['type'], action: string, payload?: any): this {
      this.steps.push({ type, action, payload });
      return this;
    }

    before(actionOrFn: ActionType | BeforeFunction, payload?: ActionParams): this {
      if (typeof actionOrFn === 'function') {
        return this.addStep('BEFORE', 'EXECUTE_FUNCTION', actionOrFn);
      }
      if (typeof actionOrFn === 'string') {
        return this.addStep('BEFORE', actionOrFn, payload);
      }
      return this.addStep('BEFORE', 'SET_STATE', actionOrFn);
    }
  
    given(actionOrState: ActionType, payload?: ActionParams): this {
      if (typeof actionOrState === 'string') {
        return this.addStep('GIVEN', actionOrState, payload);
      }
      return this.addStep('GIVEN', 'SET_STATE', actionOrState);
    }

    when(action: ActionType, payload?: ActionParams): this {
      if (typeof action === 'string') {
        return this.addStep('WHEN', action, payload);
      }
      return this.addStep('WHEN', 'SET_STATE', action);
    }
  
    expect(actionOrExpectation: ActionType, payload?: ActionParams): this {
      if (typeof actionOrExpectation === 'string') {
        return this.addStep('EXPECT', actionOrExpectation, payload);
      }
      return this.addStep('EXPECT', 'ASSERT_STATE', actionOrExpectation);
    }
  
    after(actionOrFn: ActionType | AfterFunction, payload?: ActionParams): this {
      if (typeof actionOrFn === 'function') {
        return this.addStep('AFTER', 'EXECUTE_FUNCTION', actionOrFn);
      }
      if (typeof actionOrFn === 'string') {
        return this.addStep('AFTER', actionOrFn, payload);
      }
      return this.addStep('AFTER', 'SET_STATE', actionOrFn);
    }
  
    private getUrl(): string {
      const config = getConfig();
      const baseUrl = config.baseUrl?.replace(/\/$/, '') || '';
      const path = this.path.startsWith('/') ? this.path : `/${this.path}`;
      return `${baseUrl}${path}`;
    }

    setSuiteName(name: string): this {
      this.suiteName = name;
      return this;
    }

    getSuiteName(): string {
      return this.suiteName;
    }
}
  