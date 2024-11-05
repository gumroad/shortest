// Add window interface extension
declare global {
  interface Window {
    cursorPosition: { x: number; y: number };
    showClick: () => void;
  }
}

// browser-tool.ts
import { Page } from 'playwright';
import { BaseBrowserTool, ToolError } from './base';
import { ActionInput, ToolResult } from './types';
import { BetaToolType } from './types';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

export class BrowserTool extends BaseBrowserTool {
  private page: Page;
  protected readonly toolType: BetaToolType = "computer_20241022";
  protected readonly toolName: string = "computer";
  private screenshotDir: string;
  private cursorVisible: boolean = true;
  private lastMousePosition: [number, number] = [0, 0];
  
  private readonly keyboardShortcuts: Record<string, string | string[]> = {
    'ctrl+l': ['Control', 'l'],
    'ctrl+a': ['Control', 'a'],
    'ctrl+c': ['Control', 'c'],
    'ctrl+v': ['Control', 'v'],
    'alt+tab': ['Alt', 'Tab'],
    'return': ['Enter'],
    'enter': ['Enter'],
    'esc': ['Escape'],
    'tab': ['Tab'],
    'delete': ['Delete'],
    'backspace': ['Backspace'],
    'space': [' '],
    'arrowup': ['ArrowUp'],
    'arrowdown': ['ArrowDown'],
    'arrowleft': ['ArrowLeft'],
    'arrowright': ['ArrowRight']
  };

  // Add scaling ratios based on actual vs AI coordinates
  private readonly scaleRatio = {
    x: 1543 / 1170,  // ≈ 1.318
    y: 32 / 24       // ≈ 1.333
  };

  constructor(page: Page, options: { width: number; height: number; displayNum?: number }) {
    super(options);
    this.page = page;
    this.screenshotDir = join(process.cwd(), 'screenshots');
    mkdirSync(this.screenshotDir, { recursive: true });
    
    // Initialize in sequence
    this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      // Wait for page to be ready
      await this.page.waitForLoadState('domcontentloaded');
      
      // Initialize window first
      await this.initializeWindow();
      
      // Then initialize mouse tracking
      await this.initializeMouseTracking();
    } catch (error) {
      console.warn('Initialization error:', error);
    }
  }

  private async initializeWindow(): Promise<void> {
    try {
      // Set viewport size first
      await this.page.setViewportSize({
        width: 1920,
        height: 1080
      });

      // Wait for page to be stable
      await this.page.waitForLoadState('domcontentloaded');

      // Then get dimensions
      const dimensions = await this.page.evaluate(() => ({
        viewport: {
          width: document.documentElement.clientWidth,
          height: document.documentElement.clientHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight
        }
      }));

      console.log('Window dimensions:', dimensions);

      // Update dimensions
      this.width = dimensions.viewport.width;
      this.height = dimensions.viewport.height;

    } catch (error) {
      console.warn('Failed to initialize window:', error);
    }
  }

  private async initializeMouseTracking(): Promise<void> {
    // Wait for page load
    await this.page.waitForLoadState('domcontentloaded');
    
    // Add cursor tracking script
    await this.page.evaluate(() => {
      if (!document.getElementById('ai-cursor')) {
        const cursor = document.createElement('div');
        cursor.id = 'ai-cursor';
        cursor.style.cssText = `
          width: 20px;
          height: 20px;
          border: 2px solid red;
          border-radius: 50%;
          position: fixed;
          pointer-events: none;
          z-index: 999999;
          transition: all 0.1s ease;
          transform: translate(-50%, -50%);
          background-color: rgba(255, 0, 0, 0.2);
        `;
        document.body.appendChild(cursor);

        // Add to window object
        window.cursorPosition = { x: 0, y: 0 };
        window.showClick = () => {
          const cursor = document.getElementById('ai-cursor');
          if (cursor) {
            cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
            setTimeout(() => {
              cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 100);
          }
        };

        // Update cursor position
        document.addEventListener('mousemove', (e) => {
          window.cursorPosition = { x: e.clientX, y: e.clientY };
          cursor.style.left = e.clientX + 'px';
          cursor.style.top = e.clientY + 'px';
        });
      }
    });

    // Re-initialize on navigation
    this.page.on('load', async () => {
      await this.initializeMouseTracking();
    });
  }

  private async showClickAnimation(): Promise<void> {
    await this.page.evaluate(() => {
      (window as any).showClick();
    });
  }

  async execute(input: ActionInput): Promise<ToolResult> {
    try {
      let output = '';
      let metadata = {};

      switch (input.action) {
        case 'mouse_move':
          const coords = input.coordinates || (input as any).coordinate;
          if (!coords) {
            throw new ToolError('Coordinates required for mouse_move');
          }
          await this.mouseMove(coords[0], coords[1]);
          this.lastMousePosition = [coords[0], coords[1]];
          output = `Mouse moved to (${coords[0]}, ${coords[1]})`;
          break;

        case 'left_click':
        case 'right_click':
        case 'middle_click':
        case 'double_click':
          const clickCoords = input.coordinates || this.lastMousePosition;
          await this.click(input.action, clickCoords[0], clickCoords[1]);
          output = `${input.action} at (${clickCoords[0]}, ${clickCoords[1]})`;
          break;

        case 'left_click_drag':
          if (!input.coordinates) {
            throw new ToolError('Coordinates required for left_click_drag');
          }
          await this.dragMouse(input.coordinates[0], input.coordinates[1]);
          output = `Dragged mouse to (${input.coordinates[0]}, ${input.coordinates[1]})`;
          break;

        case 'cursor_position':
          const position = await this.getCursorPosition();
          output = `Cursor position: (${position[0]}, ${position[1]})`;
          break;

        case 'screenshot':
          return await this.takeScreenshotWithMetadata();

        case 'type':
          if (!input.text) {
            throw new ToolError('Text required for type action');
          }
          await this.page.waitForTimeout(100);
          await this.page.keyboard.type(input.text);
          await this.page.waitForTimeout(100);
          output = `Typed: ${input.text}`;
          break;

        case 'key': {
          if (!input.text) {
            throw new ToolError('Key required for key action');
          }
          
          await this.page.waitForTimeout(100);
          
          const keyText = input.text.toLowerCase();
          // Check if it's a key combination or a mapped key
          const keys = Array.isArray(this.keyboardShortcuts[keyText]) ? 
            this.keyboardShortcuts[keyText] : 
            [this.keyboardShortcuts[keyText] || input.text];

          if (Array.isArray(keys)) {
            // Handle key combination
            for (const key of keys) {
              await this.page.keyboard.down(key);
            }
            for (const key of [...keys].reverse()) {
              await this.page.keyboard.up(key);
            }
          } else {
            // Handle single key
            await this.page.keyboard.press(keys);
          }
          
          await this.page.waitForTimeout(100);
          output = `Pressed key: ${input.text}`;
          break;
        }

        default:
          throw new ToolError(`Unknown action: ${input.action}`);
      }

      try {
        await this.page.waitForTimeout(200);
        metadata = await this.getMetadata();
      } catch (metadataError) {
        console.warn('Failed to get metadata:', metadataError);
        metadata = {};
      }
      
      return {
        output,
        metadata
      };

    } catch (error) {
      throw new ToolError(`Action failed: ${error}`);
    }
  }

  private async mouseMove(x: number, y: number): Promise<void> {
    // Simple coordinate validation
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
      throw new ToolError('Coordinates must be non-negative integers');
    }
    
    // Scale coordinates
    const scaledX = Math.round(x * this.scaleRatio.x);
    const scaledY = Math.round(y * this.scaleRatio.y);
    
    // Direct mouse movement with scaled coordinates
    await this.page.mouse.move(scaledX, scaledY);
    this.lastMousePosition = [scaledX, scaledY];
    await this.page.waitForTimeout(100);
  }

  private async click(action: string, x: number, y: number): Promise<void> {
    const scaledX = Math.round(x * this.scaleRatio.x);
    const scaledY = Math.round(y * this.scaleRatio.y);
    
    await this.mouseMove(x, y);
    await this.page.mouse.click(scaledX, scaledY);
    await this.showClickAnimation();
  }

  private async dragMouse(x: number, y: number): Promise<void> {
    const scaledX = Math.round(x * this.scaleRatio.x);
    const scaledY = Math.round(y * this.scaleRatio.y);
    
    await this.page.mouse.down();
    await this.page.mouse.move(scaledX, scaledY);
    await this.page.mouse.up();
  }

  private async getCursorPosition(): Promise<[number, number]> {
    const position = await this.page.evaluate(() => {
      return window.cursorPosition || { x: 0, y: 0 };
    });
    return [position.x, position.y];
  }

  private async getMetadata() {
    const position = await this.getCursorPosition();
    const viewport = this.page.viewportSize() || { width: this.width, height: this.height };

    return {
      window_info: {
        url: await this.page.url(),
        title: await this.page.title(),
        size: {
          width: viewport.width,
          height: viewport.height
        }
      },
      cursor_info: {
        position,
        visible: this.cursorVisible
      }
    };
  }

  private async takeScreenshotWithMetadata(): Promise<ToolResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = join(this.screenshotDir, `screenshot-${timestamp}.png`);
    
    const buffer = await this.page.screenshot({
      type: 'jpeg',
      quality: 50,
      scale: 'device',
      fullPage: false
    });

    writeFileSync(filePath, buffer);
    console.log(`Screenshot saved to: ${filePath}`);
    
    return {
      output: 'Screenshot taken',
      base64_image: buffer.toString('base64'),
      metadata: await this.getMetadata()
    };
  }

  toToolParameters() {
    return {
      type: this.toolType,
      name: this.toolName,
      display_width_px: this.width,
      display_height_px: this.height,
      display_number: this.displayNum
    };
  }
}