import { BrowserManager } from '../src/core/browser-manager';
import { BrowserActionTool } from '../src/browser-use/browser';
import { initialize } from '../src/index';

async function testBrowser() {
  const browserManager = new BrowserManager();
  const browserTool = new BrowserActionTool(browserManager);

  try {
    console.log('🚀 Starting browser test...');
    await initialize();
    await browserManager.launch();

    // List initial tabs
    console.log('\n1. Listing initial tabs...');
    const initialTabs = await browserTool.execute({ action: 'list_tabs' });
    console.log(initialTabs.output);

    // Create new tabs
    console.log('\n2. Creating new tabs...');
    const tab1 = await browserTool.execute({ 
      action: 'new_tab',
      url: 'https://example.com'
    });
    console.log('Created first tab:', tab1.output);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 2000));

    const tab2 = await browserTool.execute({ 
      action: 'new_tab',
      url: 'https://www.google.com'
    });
    console.log('Created second tab:', tab2.output);

    // Wait for load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // List all tabs
    console.log('\n3. Listing all tabs...');
    const allTabs = await browserTool.execute({ action: 'list_tabs' });
    console.log(allTabs.output || 'No tabs found');

    // Get Google tab URL from output
    const googleTabUrl = allTabs.output?.match(/https:\/\/www\.google\.com/)?.[0];
    if (!googleTabUrl) {
      throw new Error('Could not find Google tab');
    }

    // Switch to Google tab
    console.log('\n4. Switching to Google tab...');
    await browserTool.execute({ 
      action: 'switch_tab',
      tabId: googleTabUrl
    });

    // Test mouse movement and typing in Google tab
    console.log('\n5. Testing mouse and keyboard in Google tab...');
    await browserTool.execute({
      action: 'mouse_move',
      coordinates: [500, 300]
    });

    await browserTool.execute({
      action: 'type',
      text: 'Playwright Test'
    });

    // Take screenshot to verify
    await browserTool.execute({
      action: 'screenshot'
    });

    // Hit enter after typing
    await browserTool.execute({
      action: 'key',
      key: 'enter'
    });

    // Wait for search results
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Take screenshot to verify
    await browserTool.execute({
      action: 'screenshot'
    });

    // Wait to see the result
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Close the Google tab
    console.log('\n6. Closing Google tab...');
    await browserTool.execute({
      action: 'close_tab',
      tabId: googleTabUrl
    });

    // Final tab list
    console.log('\n7. Final tab list...');
    const finalTabs = await browserTool.execute({ action: 'list_tabs' });
    console.log(finalTabs.output || 'No tabs found');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

console.log('🧪 Browser Tab Management Test');
console.log('=============================');
testBrowser().catch(console.error);