import { BrowserManager } from '../src/core/browser-manager';
import { BrowserTool } from '../src/browser-use/browser';
import { defaultConfig, initialize } from '../src/index';
import { AIClient } from '../src/ai/ai';
import Anthropic from '@anthropic-ai/sdk';

async function testBrowser() {
  const browserManager = new BrowserManager();
  
  const apiKey = defaultConfig.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Error: Anthropic API key not found in config or environment');
    process.exit(1);
  }

  try {
    await initialize();
    console.log('🚀 Launching browser...');
    const context = await browserManager.launch();
    const page = context.pages()[0];
    
    const browserTool = new BrowserTool(page, {
      width: 1920, 
      height: 940
    });

    // Initialize AI client
    const aiClient = new AIClient({
      apiKey,
      model: 'claude-3-5-sonnet-20241022',
      maxMessages: 10
    });

    // Define callbacks
    const outputCallback = (content: Anthropic.Beta.Messages.BetaContentBlockParam) => {
      if (content.type === 'text') {
        console.log('🤖 Assistant:', content.text);
      }
    };

    const toolOutputCallback = (name: string, input: any) => {
      console.log('🔧 Tool Use:', name, input);
    };

    // Run test
    const testPrompt = `Validate the login functionality of the website you see
    using github login button
    for username argo.mohrad@gmail.com and password: M2@rad99308475
    `;
    
    const result = await aiClient.processAction(
      testPrompt,
      browserTool,
      outputCallback,
      toolOutputCallback
    );

    console.log('✅ Test complete');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

console.log('🧪 Browser Integration Test');
console.log('===========================');
testBrowser().catch(console.error);