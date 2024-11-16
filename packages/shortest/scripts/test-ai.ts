import { BrowserManager } from '../src/core/browser-manager';
import { BrowserTool } from '../src/browser-use/browser';
import { defaultConfig, initialize } from '../src/index';
import { AIClient } from '../src/ai/ai';
import Anthropic from '@anthropic-ai/sdk';
import pc from 'picocolors';

async function testBrowser() {
  const browserManager = new BrowserManager();
  
  const apiKey = defaultConfig.ai?.apiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error(pc.red('Error: Anthropic API key not found in config or environment'));
    process.exit(1);
  }

  try {
    await initialize();
    console.log(pc.cyan('🚀 Launching browser...'));
    const context = await browserManager.launch();
    const page = context.pages()[0];
    
    const browserTool = new BrowserTool(
      page,
      browserManager,
      {
        width: 1920, 
        height: 940
      }
    );

    // Initialize AI client
    const aiClient = new AIClient({
      apiKey,
      model: 'claude-3-5-sonnet-20241022',
      maxMessages: 10
    });

    // Define callbacks with metadata logging
    const outputCallback = (content: Anthropic.Beta.Messages.BetaContentBlockParam) => {
      if (content.type === 'text') {
        console.log(pc.yellow('🤖 Assistant:'), content.text);
      }
    };

    const toolOutputCallback = (name: string, input: any) => {
      console.log(pc.yellow('🔧 Tool Use:'), name, input);
      if (input.metadata) {
        console.log(pc.yellow('Tool Metadata:'), input.metadata);
      }
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

    console.log(pc.green('✅ Test complete'));
    
  } catch (error) {
    console.error(pc.red('❌ Test failed:'), error);
  } finally {
    console.log(pc.cyan('\n🧹 Cleaning up...'));
    await browserManager.close();
  }
}

console.log(pc.cyan('🧪 Browser Integration Test'));
console.log(pc.cyan('==========================='));
testBrowser().catch(console.error);