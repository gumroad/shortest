import { BrowserManager } from '../src/core/browser-manager';
import { BrowserActionTool } from '../src/browser-use/browser';
import { initialize } from '../src/index';

async function testBrowser() {
  const browserManager = new BrowserManager();
  const browserTool = new BrowserActionTool(browserManager);

  try {
    console.log('🚀 Starting browser test...');

    console.log('\n1. Initializing config...');
    await initialize();

    console.log('\n2. Launching browser...');
    await browserManager.launch();

    console.log('\n3. Taking initial screenshot...');
    const screenshotResult = await browserTool.execute({
      action: 'screenshot'
    });
    console.log('Screenshot taken:', screenshotResult.screenshot ? '✅' : '❌');

    console.log('\n4. Clicking at coordinates (100, 100)...');
    const clickResult = await browserTool.execute({
      action: 'click',
      coordinates: [100, 100],
      clickType: 'left'
    });
    console.log('Click result:', clickResult.output);

    console.log('\n5. Typing text...');
    const typeResult = await browserTool.execute({
      action: 'type',
      text: 'Hello, Browser Testing!'
    });
    console.log('Type result:', typeResult.output);

    // Keep browser open for inspection
    console.log('\n✨ Test complete! Keeping browser open for 10 seconds...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

// Run the test
console.log('🧪 Browser Action Test');
console.log('====================');
testBrowser().catch(console.error); 