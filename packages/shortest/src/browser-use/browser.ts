import { BrowserTool, ToolError, ToolResult } from './base';
import { ActionInput, BrowserAction, BrowserToolOptions, ClickType } from './types';
import CDP from 'chrome-remote-interface';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BrowserManager } from '../core/browser-manager';

export class BrowserActionTool extends BrowserTool {
  name = 'browser';
  private cdpClient: CDP.Client | null = null;
  private typingDelay = 50; // ms between keystrokes
  private screenshotDir = join(process.cwd(), 'test-screenshots');

  constructor(browserManager: BrowserManager) {
    super(browserManager);
    // Create screenshots directory if it doesn't exist
    mkdirSync(this.screenshotDir, { recursive: true });
  }

  async execute(input: ActionInput, options: BrowserToolOptions = {}): Promise<ToolResult> {
    try {
      this.cdpClient = this.browserManager.getCdpClient();
      if (!this.cdpClient) {
        throw new ToolError('Browser not connected');
      }

      const result = await this.executeAction(input);
      let screenshot: string | undefined;
      
      if (options.screenshot) {
        screenshot = await this.takeScreenshot();
      }

      return {
        output: result,
        screenshot,
      };

    } catch (error) {
      if (error instanceof ToolError) {
        throw error;
      }
      throw new ToolError(`Browser action failed: ${error}`);
    }
  }

  private async executeAction(input: ActionInput): Promise<string> {
    const { action, coordinates, clickType, text } = input;

    switch (action) {
      case 'click':
        if (!coordinates) {
          throw new ToolError('Coordinates are required for click action');
        }
        await this.click(coordinates[0], coordinates[1], clickType);
        return `Clicked at coordinates (${coordinates[0]}, ${coordinates[1]})`;

      case 'type':
        if (!text) {
          throw new ToolError('Text is required for type action');
        }
        await this.type(text);
        return `Typed text: "${text}"`;

      case 'screenshot':
        const screenshot = await this.takeScreenshot();
        return 'Screenshot taken';

      default:
        throw new ToolError(`Unsupported action: ${action}`);
    }
  }

  private async click(x: number, y: number, type: ClickType = 'left'): Promise<void> {
    const { Input } = this.cdpClient!;
    
    // Move mouse to position
    await Input.dispatchMouseEvent({
      type: 'mouseMoved',
      x,
      y
    });

    // Click based on type
    const clickCount = type === 'double' ? 2 : 1;
    const button = type === 'right' ? 'right' : 'left';

    await Input.dispatchMouseEvent({
      type: 'mousePressed',
      x,
      y,
      button,
      clickCount
    });

    await Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x,
      y,
      button,
      clickCount
    });
  }

  private async type(text: string): Promise<void> {
    const { Input } = this.cdpClient!;
    
    // Type each character with a delay
    for (const char of text) {
      await Input.dispatchKeyEvent({
        type: 'keyDown',
        text: char
      });

      await Input.dispatchKeyEvent({
        type: 'keyUp',
        text: char
      });

      await new Promise(resolve => setTimeout(resolve, this.typingDelay));
    }
  }

  protected async takeScreenshot(): Promise<string | undefined> {
    try {
      const { Page } = this.cdpClient!;
      const { data } = await Page.captureScreenshot();
      
      // Save screenshot to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = join(this.screenshotDir, `screenshot-${timestamp}.png`);
      writeFileSync(filePath, Buffer.from(data, 'base64'));
      
      console.log(`Screenshot saved to: ${filePath}`);
      return data;
    } catch (error) {
      throw new ToolError(`Screenshot failed: ${error}`);
    }
  }
} 