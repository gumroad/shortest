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
      payload: step.payload,
      hasCallback: !!step.assert
    }));

    console.log('\n🔍 Parsed Steps:');
    steps.forEach((step, index) => {
      console.log(`Step ${index + 1}:`, {
        type: step.type,
        description: step.description,
        hasCallback: step.hasCallback
      });
    });

    return {
      suiteName: builder.getSuiteName(),
      path: builder.path,
      fullPath: this.getFullPath(builder.path),
      testName: builder.testName,
      steps
    };
  }

  generateTestPrompt(test: ParsedTest, suiteName: string): string {
    const steps = test.steps.map(step => {
      const stepStr = `${step.type}: "${step.description}"`;
      const callbackInfo = step.hasCallback ? ' [HAS_CALLBACK]' : '';
      return `${stepStr}${callbackInfo}`;
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