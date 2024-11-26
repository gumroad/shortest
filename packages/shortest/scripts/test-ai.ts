import { AIClient } from '../src/ai/ai';
import { BrowserTool } from '../src/browser/browser';
import { BrowserManager } from '../src/browser/browser-manager';
import { defaultConfig, initialize } from '../src/index';
import { TestCase } from '../src/types';
import pc from 'picocolors';

async function testAI() {
  console.log(pc.cyan('\n🧪 Testing AI Integration'));
  console.log(pc.cyan('======================='));

  const browserManager = new BrowserManager();

  try {
    await initialize();
    console.log('🚀 Launching browser...');
    const context = await browserManager.launch();
    const page = context.pages()[0];

    // Mock test data with callback
    const mockTest: TestCase = {
      suiteName: 'Test Suite',
      path: '/',
      fullPath: 'http://localhost:3000',
      testName: 'Test with callback',
      steps: [
        {
          type: 'GIVEN',
          description: 'test setup',
          action: 'test setup',
          hasCallback: true,
          callback: async () => {
            console.log('Callback executed: GIVEN step');
          }
        },
        {
          type: 'WHEN',
          description: 'action performed',
          action: 'action performed',
          hasCallback: true,
          callback: async () => {
            console.log('Callback executed: WHEN step');
          }
        }
      ]
    };

    const browserTool = new BrowserTool(page, browserManager, {
      width: 1920,
      height: 1080,
      testContext: {
        currentTest: mockTest,
        currentStepIndex: 0,
        testName: mockTest.testName
      }
    });

    // Test first callback
    console.log('\n🔍 Testing first callback:');
    const result = await browserTool.execute({ 
      action: 'run_callback' 
    });
    console.log('Result:', result);

    // Update test context for second callback
    browserTool.updateTestContext({
      currentTest: mockTest,
      currentStepIndex: 1,
      testName: mockTest.testName
    });

    // Test second callback
    console.log('\n🔍 Testing second callback:');
    const result2 = await browserTool.execute({ 
      action: 'run_callback' 
    });
    console.log('Result:', result2);

  } catch (error) {
    console.error(pc.red('❌ Test failed:'), error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

console.log('🤖 AI Integration Test');
console.log('=====================');
testAI().catch(console.error);