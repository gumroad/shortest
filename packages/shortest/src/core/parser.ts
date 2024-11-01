import { ParsedTest, ParsedTestSuite, ParsedTestStep } from '../types';
import { getConfig, TestRegistry } from '../index';

export class TestParser {
  private getFullPath(path: string): string {
    const config = getConfig();
    const baseUrl = config.baseUrl?.replace(/\/$/, '') || '';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async parseModule(compiledModule: any): Promise<ParsedTestSuite[]> {
    const suites: ParsedTestSuite[] = [];
    const testMap = TestRegistry.getAllTests();
    
    for (const [suiteName, builders] of testMap.entries()) {
      const suite: ParsedTestSuite = {
        name: suiteName,
        tests: builders.map(builder => this.parseTestBuilder(builder))
      };
      
      suites.push(suite);
    }

    return suites;
  }

  private parseTestBuilder(builder: any): ParsedTest {
    const steps: ParsedTestStep[] = builder.steps.map((step: any) => ({
      type: step.type,
      description: typeof step.action === 'string' ? step.action : 'SET_STATE',
      payload: step.payload
    }));

    return {
      suiteName: builder.getSuiteName(),
      path: builder.path,
      fullPath: this.getFullPath(builder.path),
      testName: builder.testName,
      steps
    };
  }
} 