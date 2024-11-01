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
    
    // Wait longer for browser to fully initialize
    console.log('\nWaiting for browser window to settle...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Test with more distinct coordinates
    const testCoords = [
      [900, 400],    // Top left area
      [100, 600],    // Top left area
      [300, 800],    // Top right area
      [150, 100],    // Bottom left area
      [200, 290],    // Bottom right area
    ];

    for (const [x, y] of testCoords) {
      console.log(`\n📍 Moving to coordinates (${x}, ${y})`);
      
      // Move mouse with delay
      await browserTool.execute({
        action: 'mouse_move',
        coordinates: [x, y]
      });
      
      // Longer wait between move and clicks
      console.log('   Waiting before clicks...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Click 3 times with longer delays
      for (let i = 1; i <= 3; i++) {
        console.log(`   Click ${i}/3 at (${x}, ${y})`);
        await browserTool.execute({
          action: 'mouse_move',
          coordinates: [x, y],
          button: 'left',
          clickCount: 1
        });
        // Wait between clicks
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Wait before moving to next position
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✨ Test complete! Keeping browser open for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    console.log('\n🧹 Cleaning up...');
    await browserManager.close();
  }
}

// Run the test
console.log('🧪 Coordinate Consistency Test');
console.log('=============================');
testBrowser().catch(console.error); 