import { AIClient } from '../src/ai/ai';
import { BrowserManager } from '../src/core/browser-manager';
import { BrowserActionTool } from '../src/browser-use/browser';
import { initialize, getConfig } from '../src/index';

async function testAI() {
  await initialize();
  const config = getConfig();
  
  // Check for API key in config or env
  const apiKey = config.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: Anthropic API key not found in config or environment');
    process.exit(1);
  }

  const browserManager = new BrowserManager();
  const browserTool = new BrowserActionTool(browserManager);
  const client = new AIClient({
    apiKey,
    model: config.ai?.model
  });

  try {
    console.log('Launching browser...');
    await browserManager.launch();

    const testPrompt = 
      `Define: Validate login feature
      Test Case: Login with valid credentials
      URL: http://localhost:3000/login
      Steps:
      1. GIVEN: "username and password"
        {"username": "test", "password": "test"}
      2. EXPECT: "should redirect to /dashboard"`;

    console.log('Sending prompt to AI...');
    const result = await client.processTest(testPrompt);
    console.log('AI Response:', result);

    console.log('Executing browser actions...');
    await browserTool.execute({
      action: 'mouse_move',
      coordinates: [500, 300]
    });

    const screenshotResult = await browserTool.execute({
      action: 'screenshot'
    });

    console.log('Action Results:', {
      screenshot: screenshotResult.screenshot ? 'Captured' : 'Failed',
      output: screenshotResult.output
    });

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    console.log('Cleaning up...');
    await browserManager.close();
  }
}

console.log('🧪 AI Browser Integration Test');
console.log('=============================');
testAI().catch(console.error);