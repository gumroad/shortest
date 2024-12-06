// Add window interface extension
declare global {
  interface Window {
    cursorPosition: { x: number; y: number };
    showClick: () => void;
  }
}

import { Page } from 'playwright';
import { BaseBrowserTool, ToolError } from './index';
import { ActionInput, ToolResult, BetaToolType } from '../../types/browser';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { GitHubTool } from '../integrations/github';
import { BrowserManager } from '../manager';
import { TestContext, BrowserToolConfig, TestFunction } from '../../types';
import * as actions from '../actions';
import pc from 'picocolors';
import { CallbackError } from '../../types/test';

export class BrowserTool extends BaseBrowserTool {
  private page: Page;
  private browserManager: BrowserManager;
  protected readonly toolType: BetaToolType = "computer_20241022";
  protected readonly toolName: string = "computer";
  private screenshotDir: string;
  private cursorVisible: boolean = true;
  private lastMousePosition: [number, number] = [0, 0];
  private githubTool?: GitHubTool;
  private viewport: { width: number; height: number };
  private testContext?: TestContext;

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
    this.viewport = { width: config.width, height: config.height };
    this.testContext = config.testContext;
    
    this.initialize();
  }

  getPage(): Page {
    return this.page;
  }

  private async initialize(): Promise<void> {
    this.page.on('load', async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
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

  public async click(selector: string): Promise<void> {
    await this.page.click(selector);
  }

  public async clickAtCoordinates(x: number, y: number): Promise<void> {
    await actions.click(this.page, x, y);
  }

  async execute(input: ActionInput): Promise<ToolResult> {
    try {
      let output = '';
      let metadata = {};

      console.log(pc.magenta('\n🔍 Browser Action:'), {
        action: input.action,
        coordinates: input.coordinates,
        url: input.url
      });

      switch (input.action) {
        case 'mouse_move':
          const coords = input.coordinates || (input as any).coordinate;
          if (!coords) {
            throw new ToolError('Coordinates required for mouse_move');
          }
          await actions.mouseMove(this.page, coords[0], coords[1]);
          this.lastMousePosition = [coords[0], coords[1]];
          output = `Mouse moved to (${coords[0]}, ${coords[1]})`;
          break;

        case 'left_click':
        case 'right_click':
        case 'middle_click':
        case 'double_click':
          const clickCoords = input.coordinates || this.lastMousePosition;
          await this.clickAtCoordinates(clickCoords[0], clickCoords[1]);
          output = `${input.action} at (${clickCoords[0]}, ${clickCoords[1]})`;
          break;

        case 'left_click_drag':
          if (!input.coordinates) {
            throw new ToolError('Coordinates required for left_click_drag');
          }
          await actions.dragMouse(this.page, input.coordinates[0], input.coordinates[1]);
          output = `Dragged mouse to (${input.coordinates[0]}, ${input.coordinates[1]})`;
          break;

        case 'cursor_position':
          const position = await actions.getCursorPosition(this.page);
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
          const keys = Array.isArray(actions.keyboardShortcuts[keyText]) ? 
            actions.keyboardShortcuts[keyText] : 
            [actions.keyboardShortcuts[keyText] || input.text];

          if (Array.isArray(keys)) {
            for (const key of keys) {
              await this.page.keyboard.down(key);
            }
            for (const key of [...keys].reverse()) {
              await this.page.keyboard.up(key);
            }
          } else {
            await this.page.keyboard.press(keys);
          }
          
          await this.page.waitForTimeout(100);
          output = `Pressed key: ${input.text}`;
          break;
        }

        case 'github_login': {
          if (!this.githubTool) {
            this.githubTool = new GitHubTool();
          }
          const loginResult = await this.githubTool.GithubLogin(this, {
            username: input.username as string,
            password: input.password as string
          });

          output = loginResult.success ? 
              'GitHub login was successfully completed' : 
              `GitHub login failed: ${loginResult.error}`;
          break;
        }

        case 'clear_session':
          const newContext = await this.browserManager.recreateContext();
          this.page = newContext.pages()[0] || await newContext.newPage();
          await this.page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
          });

          return {
            output: 'Successfully cleared browser data and created new context',
            metadata: {}
          };

        case 'run_callback': {
          if (!this.testContext?.currentTest) {
            throw new ToolError('No test context available for callback execution');
          }

          const testContext = this.testContext;
          const currentTest = testContext.currentTest as TestFunction;
          const currentStepIndex = testContext.currentStepIndex ?? 0;

          // Check if it's the default empty function
          if (currentTest?.fn?.toString() === '(async () => {})') {
            return {
              output: 'Skipping callback execution: No callback function defined for this test'
            };
          }

          try {
            if (currentStepIndex === 0) {
              if (currentTest.fn) {
                await currentTest.fn({ page: this.page });
                testContext.currentStepIndex = 1;
                return {
                  output: 'Test function executed successfully'
                };
              }
              return {
                output: 'Skipping callback execution: No callback function defined for this test'
              };
            } else {
              const expectationIndex = currentStepIndex - 1;
              const expectation = currentTest.expectations?.[expectationIndex];
              
              if (expectation?.fn) {
                await expectation.fn({ page: this.page });
                testContext.currentStepIndex = currentStepIndex + 1;
                return {
                  output: `Callback function for "${expectation.description}" passed successfully`
                };
              } else {
                return {
                  output: `Skipping callback execution: No callback function defined for expectation "${expectation?.description}"`
                };
              }
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new CallbackError(errorMessage);
          }
        }

        case 'navigate': {          
          if (!input.url) {
            throw new ToolError('URL required for navigation');
          }

          // Create new tab
          const newPage = await this.page.context().newPage();
          
          try {
            const navigationTimeout = 30000;
            
            await newPage.goto(input.url, {
              timeout: navigationTimeout,
              waitUntil: 'domcontentloaded'
            });

            await newPage.waitForLoadState('load', {
              timeout: 5000
            }).catch(e => {
              console.log('⚠️ Load timeout, continuing anyway');
            });
            
            // Switch focus
            this.page = newPage;

            output = `Navigated to ${input.url}`;
            metadata = {
              window_info: {
                url: input.url,
                title: await newPage.title(),
                size: this.page.viewportSize() || { width: this.width, height: this.height }
              }
            };
            
            break;
          } catch (error) {
            await newPage.close();
            throw new ToolError(`Navigation failed: ${error}`);
          }
        }

        default:
          throw new ToolError(`Unknown action: ${input.action}`);
      }

      // Get and log metadata
      try {
        await this.page.waitForTimeout(200);
        metadata = await this.getMetadata();
        console.log(pc.magenta('\n📊 Page Metadata:'), metadata);
      } catch (metadataError) {
        console.warn('Failed to get metadata:', metadataError);
        metadata = {};
      }
      
      return {
        output,
        metadata
      };

    } catch (error) {
      console.error(pc.red('\n❌ Browser Action Failed:'), error);
      
      if (error instanceof CallbackError) {
        return {
          output: `Callback execution failed: ${error.message}`
        };
      }

      throw new ToolError(`Action failed: ${error}`);
    }
  }

  private async isPageReady(): Promise<boolean> {
    try {
      return await this.page.evaluate(() => {
        return document.readyState === 'complete' && 
               !document.querySelector('.loading') && 
               !document.querySelector('.cl-loading') && 
               Boolean(document.body);
      });
    } catch {
      return false;
    }
  }

  private async getMetadata(): Promise<any> {
    if (!await this.isPageReady()) {
      await this.page.waitForLoadState('load');
      await this.page.waitForTimeout(500);
    }

    const position = await actions.getCursorPosition(this.page);
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

  // Selector-based methods
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
    await this.page.waitForLoadState('load', { timeout: options?.timeout });
  }

  updateTestContext(newContext: TestContext) {
    this.testContext = newContext;
  }
}
