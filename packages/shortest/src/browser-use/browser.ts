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
import { ActionInput, ToolResult } from '../types/browser';
import { BetaToolType } from '../types/browser';
import { writeFileSync, mkdirSync } from 'fs';
import { rm } from 'fs/promises';
import { join } from 'path';
import { GitHubTool } from '../tools/github';
import { BrowserManager } from '../core/browser-manager';
import { TestContext, BrowserToolConfig } from '../types/index';

export class BrowserTool extends BaseBrowserTool {
  private page: Page;
  private browserManager: BrowserManager;
  protected readonly toolType: BetaToolType = "computer_20241022";
  protected readonly toolName: string = "computer";
  private screenshotDir: string;
  private cursorVisible: boolean = true;
  private lastMousePosition: [number, number] = [0, 0];
  private githubTool: GitHubTool;
  private viewport: { width: number; height: number };
  private testContext?: TestContext;
  
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

  constructor(
    page: Page, 
    browserManager: BrowserManager,
    config: BrowserToolConfig
  ) {
    super(config);
    this.page = page;
    this.browserManager = browserManager;
    this.screenshotDir = join(process.cwd(), 'screenshots');
    mkdirSync(this.screenshotDir, { recursive: true });
    this.githubTool = new GitHubTool();
    this.viewport = { width: config.width, height: config.height };
    this.testContext = config.testContext;
    
    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Set up navigation listener with error handling
    this.page.on('load', async () => {
      try {
        // Wait for page to stabilize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Try to initialize cursor
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

            window.cursorPosition = { x: 0, y: 0 };
            
            document.addEventListener('mousemove', (e) => {
              window.cursorPosition = { x: e.clientX, y: e.clientY };
              cursor.style.left = e.clientX + 'px';
              cursor.style.top = e.clientY + 'px';
            });
          }
        }).catch(() => {
          // Silently fail cursor initialization during navigation
        });
      } catch (error) {
        // Silently fail initialization during navigation
      }
    });
  }

  private async showClickAnimation(): Promise<void> {
    try {
      await this.page.evaluate(() => {
        const cursor = document.getElementById('ai-cursor');
        if (cursor) {
          cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
          setTimeout(() => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
          }, 100);
        }
      });
    } catch (error) {
      // fail silently
    }
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

        case 'github_login':
          const loginResult = await this.githubTool.GithubLogin(this, {
            username: input.username as string,
            password: input.password as string
          });

          output = loginResult.success ? 
              'GitHub login was successfully completed' : 
              `GitHub login failed: ${loginResult.error}`;
          break;

        case 'clear_session':
          // Get new context from browser manager
          const newContext = await this.browserManager.recreateContext();
          
          // Get the first page from new context
          this.page = newContext.pages()[0] || await newContext.newPage();
          
          // Clear browser storage
          await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });

          return {
            output: 'Successfully cleared browser data and created new context',
            metadata: {}
          };

        case 'run_callback':
          if (!this.testContext) {
            throw new Error('No test context available for callback execution');
          }

          const currentStep = this.testContext.currentTest.steps[this.testContext.currentStepIndex];
          if (currentStep?.assert) {
            await currentStep.assert();
            this.testContext.currentStepIndex++;
          }
          return { output: 'Callback executed successfully' };

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

  public async click(selector: string): Promise<void>;
  public async click(action: string, x: number, y: number): Promise<void>;
  public async click(actionOrSelector: string, x?: number, y?: number): Promise<void> {
    if (x !== undefined && y !== undefined) {
      const scaledX = Math.round(x * this.scaleRatio.x);
      const scaledY = Math.round(y * this.scaleRatio.y);
      
      await this.mouseMove(x, y);
      await this.page.mouse.click(scaledX, scaledY);
      await this.showClickAnimation();
    } else {
      await this.page.click(actionOrSelector);
    }
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

  private async isPageReady(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('.loading') && 
               !document.querySelector('.cl-loading') && // Check for Clerk loading
               Boolean(document.body);
      });
    } catch {
      return false;
    }
  }

  private async getMetadata(): Promise<any> {
    // Check page readiness first
    if (!await this.isPageReady()) {
      await this.page.waitForLoadState('networkidle');
      await this.page.waitForTimeout(500); // Small buffer for any JS initialization
    }

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

  // New selector-based methods
  public async waitForSelector(selector: string, options?: { timeout: number }): Promise<void> {
    await this.page.waitForSelector(selector, options);
  }

  public async fill(selector: string, value: string): Promise<void> {
    await this.page.fill(selector, value);
  }

  public async press(selector: string, key: string): Promise<void> {
    await this.page.press(selector, key);
  }

  public async findElement(selector: string) {
    return this.page.$(selector);
  }

  public async waitForNavigation(options?: { timeout: number }): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout: options?.timeout });
  }

  updateTestContext(newContext: TestContext) {
    this.testContext = newContext;
  }
}