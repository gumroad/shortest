import { ParsedTest, ParsedTestSuite, ParsedTestStep } from '../types';
import { getConfig, TestRegistry } from '../index';
import { UITestBuilderInterface } from '../types/builder';

export class TestParser {
  private processedSuites = new Set<string>();

  private getFullPath(path: string): string {
    const config = getConfig();
    const baseUrl = config.baseUrl?.replace(/\/$/, '') || '';
    return `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async parseModule(compiledModule: any): Promise<ParsedTestSuite[]> {
    const suites: ParsedTestSuite[] = [];
    const testMap = TestRegistry.getAllTests();
    
    for (const [suiteName, builders] of testMap.entries()) {
      if (this.processedSuites.has(suiteName)) {
        continue;
      }
      
      const suite: ParsedTestSuite = {
        name: suiteName,
        tests: builders.map((builder: UITestBuilderInterface) => this.parseTestBuilder(builder))
      };
      
      console.log(`Test Suite: ${suiteName}`);
      suite.tests.forEach(test => this.generateTestPrompt(test, suiteName));
      
      this.processedSuites.add(suiteName);
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

  generateTestPrompt(test: ParsedTest, defineDescription: string): string {
    return [
      `Define: ${defineDescription}`,
      `Test Case: ${test.testName}`,
      `URL: ${test.fullPath}`,
      `Context: ${test.suiteName}`,
      'Steps:',
      ...test.steps.map((step, index) => {
        let stepStr = `${index + 1}. ${step.type}: "${step.description}"`;
        if (step.payload) {
          stepStr += `\n   ${JSON.stringify(step.payload)}`;
        }
        return stepStr;
      }),
      'Expected Results:',
      ...test.steps
        .filter(step => step.type === 'EXPECT')
        .map(exp => `- ${exp.description}`)
    ].join('\n');
  }
} 