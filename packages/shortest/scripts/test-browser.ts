import { BrowserManager } from '../src/core/browser-manager';
import { BrowserTool } from '../src/browser-use/browser';
import { initialize } from '../src/index';

async function testBrowser() {
  const browserManager = new BrowserManager();

  try {
    await initialize();
    console.log('🚀 Launching browser...');
    const context = await browserManager.launch();
    const page = context.pages()[0];

    const browserTool = new BrowserTool(page, {
      width: 1920, 
      height: 1080
    });

    // Navigate to a page with a sign in button
    await page.goto('http://localhost:3000');
    
    // Find the "Sign in" text/button and get its coordinates
    const signInElement = await page.locator('text="Sign in"').first();
    const boundingBox = await signInElement.boundingBox();
    
    if (!boundingBox) {
      throw new Error('Could not find Sign in element');
    }

    // Calculate center coordinates of the element
    const x = Math.round(boundingBox.x + boundingBox.width / 2);
    const y = Math.round(boundingBox.y + boundingBox.height / 2);
    
    console.log(`📍 Sign in button coordinates: (${x}, ${y})`);

    // Test sequence
    console.log('\n📍 Testing Mouse Movements and Clicks:');
    
    // Move to sign in button
    console.log(`\nTest 1: Move to Sign in button (${x}, ${y})`);
    await browserTool.execute({ 
      action: 'mouse_move', 
      coordinates: [x, y] 
    });
    await new Promise(r => setTimeout(r, 1000));

    // Take screenshot to verify position
    console.log('\nTest 2: Taking screenshot to verify cursor position');
    await browserTool.execute({ 
      action: 'screenshot' 
    });

    // Click the button
    console.log('\nTest 3: Clicking at current position');
    await browserTool.execute({ 
      action: 'left_click'
    });
    await new Promise(r => setTimeout(r, 1000));

    // Take final screenshot
    console.log('\nTest 4: Taking screenshot after click');
    const result = await browserTool.execute({ 
      action: 'screenshot' 
    });
    
    console.log('\n✅ All coordinate tests completed');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

console.log('🧪 Mouse Coordinate Test');
console.log('=======================');
testBrowser().catch(console.error);