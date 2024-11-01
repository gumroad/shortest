import { BrowserManager } from '../src/core/browser-manager';
import { BrowserActionTool } from '../src/browser-use/browser';
import { initialize } from '../src/index';

async function testCoordinates() {
  const browserManager = new BrowserManager();
  const browserTool = new BrowserActionTool(browserManager);

  try {
    console.log('🚀 Starting coordinate test...');
    await initialize();
    await browserManager.launch();

    // Test different screen regions
    const testPoints = [
      [100, 100],   // Top left
      [500, 100],   // Top center
      [900, 100],   // Top right
      [100, 500],   // Middle left
      [500, 500],   // Center
      [900, 500],   // Middle right
      [100, 900],   // Bottom left
      [500, 900],   // Bottom center
      [900, 900],   // Bottom right
    ];

    for (const [x, y] of testPoints) {
      console.log(`\nTesting coordinates (${x}, ${y})`);
      
      // Move mouse
      await browserTool.execute({
        action: 'mouse_move',
        coordinates: [x, y]
      });
      
      // Wait to see cursor
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Click and verify
      await browserTool.execute({
        action: 'mouse_move',
        coordinates: [x, y],
        button: 'left',
        clickCount: 1
      });

      // Take screenshot for verification
      await browserTool.execute({
        action: 'screenshot'
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browserManager.close();
  }
}

console.log('🧪 Coordinate Precision Test');
console.log('===========================');
testCoordinates().catch(console.error); 