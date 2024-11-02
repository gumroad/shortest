import { BrowserTool, ToolError, ToolResult } from './base';
import { ActionInput, BrowserAction, BrowserToolOptions, MouseButton } from './types';
import { BrowserContext, Page } from 'playwright';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BrowserManager } from '../core/browser-manager';

// Add key mapping similar to computer.py
const KEY_MAPPINGS: { [key: string]: string } = {
  'enter': 'Enter',
  'return': 'Enter',
  'tab': 'Tab',
  'space': ' ',
  'backspace': 'Backspace',
  'delete': 'Delete',
  'escape': 'Escape',
  'up': 'ArrowUp',
  'down': 'ArrowDown',
  'left': 'ArrowLeft',
  'right': 'ArrowRight'
};

export class BrowserActionTool extends BrowserTool {
  name = 'browser';
  private context: BrowserContext | null = null;
  private currentPage: Page | null = null;
  private screenshotDir = join(process.cwd(), 'test-screenshots');
  private width: number;
  private height: number;
  private lastMousePosition: { x: number; y: number } | null = null;

  constructor(browserManager: BrowserManager) {
    super(browserManager);
    mkdirSync(this.screenshotDir, { recursive: true });
    this.width = parseInt(process.env.WIDTH || '1920', 10);
    this.height = parseInt(process.env.HEIGHT || '1080', 10);
  }

  async execute(input: ActionInput, options: BrowserToolOptions = {}): Promise<ToolResult> {
    try {
      await this.ensureConnection();

      switch (input.action) {
        case 'new_tab':
          const page = await this.createTab(input.url);
          return { output: `Created new tab with ID: ${page.url()}` };

        case 'close_tab':
          if (!input.tabId) {
            throw new ToolError('Tab ID required for close_tab action');
          }
          await this.closeTab(input.tabId);
          return { output: `Closed tab: ${input.tabId}` };

        case 'switch_tab':
          if (!input.tabId) {
            throw new ToolError('Tab ID required for switch_tab action');
          }
          await this.switchTab(input.tabId);
          return { output: `Switched to tab: ${input.tabId}` };

        case 'list_tabs':
          const tabs = await this.getTabs();
          return { 
            output: `Current tabs:\n${tabs.map(tab => 
              `${tab.id} - ${tab.title} (${tab.url})`
            ).join('\n')}` 
          };

        case 'mouse_move':
          if (!input.coordinates) {
            throw new ToolError('Coordinates required for mouse_move');
          }
          await this.mouseMove(input.coordinates[0], input.coordinates[1]);
          if (input.button) {
            await this.click(input.coordinates[0], input.coordinates[1], input.button);
          }
          return { output: `Mouse moved to (${input.coordinates[0]}, ${input.coordinates[1]})${input.button ? ' and clicked' : ''}` };

        case 'key':
          if (!input.key) {
            throw new ToolError('Key required for key action');
          }
          await this.sendKey(input.key);
          return { output: `Pressed key: ${input.key}` };

        case 'type':
          if (!input.text) {
            throw new ToolError('Text required for type action');
          }
          await this.type(input.text);
          return { output: `Typed text: "${input.text}"` };

        case 'screenshot':
          const screenshot = await this.takeScreenshot();
          return { output: 'Screenshot taken', screenshot };

        default:
          throw new ToolError(`Unsupported action: ${input.action}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new ToolError(error.message);
      }
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.context) {
      this.context = this.browserManager.getContext();
      if (!this.context) {
        throw new ToolError('Browser not connected');
      }
      
      // Get current page or create one
      const pages = this.context.pages();
      this.currentPage = pages.length > 0 ? pages[0] : await this.context.newPage();
    }
  }

  private async mouseMove(x: number, y: number): Promise<void> {
    if (!this.currentPage) return;

    // Add visual feedback using JavaScript
    await this.currentPage.evaluate(`
      (() => {
        if (!window.__shortest_overlay__) {
          const overlay = {
            showCursor: (x, y) => {
              const cursor = document.createElement('div');
              cursor.id = 'shortest-cursor';
              cursor.style.cssText = \`
                position: fixed;
                width: 20px;
                height: 20px;
                background: rgba(255, 0, 0, 0.5);
                border: 2px solid red;
                border-radius: 50%;
                pointer-events: none;
                z-index: 999999;
                transform: translate(-50%, -50%);
                left: \${x}px;
                top: \${y}px;
              \`;
              document.body.appendChild(cursor);
              return cursor;
            },
            updateCursor: (x, y) => {
              let cursor = document.getElementById('shortest-cursor');
              if (!cursor) {
                cursor = overlay.showCursor(x, y);
              }
              cursor.style.left = x + 'px';
              cursor.style.top = y + 'px';
            }
          };
          window.__shortest_overlay__ = overlay;
        }
        window.__shortest_overlay__.updateCursor(${x}, ${y});
      })()
    `);

    // Move the actual mouse
    await this.currentPage.mouse.move(x, y);
    this.lastMousePosition = { x, y };
  }

  private async click(x: number, y: number, button: MouseButton = 'left'): Promise<void> {
    if (!this.currentPage) return;

    // Show click effect
    await this.currentPage.evaluate(`
      (() => {
        const effect = document.createElement('div');
        effect.style.cssText = \`
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          width: 30px;
          height: 30px;
          border: 3px solid red;
          border-radius: 50%;
          pointer-events: none;
          z-index: 999998;
          animation: clickRipple 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        \`;
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
      })()
    `);

    // Perform click
    await this.currentPage.mouse.click(x, y, {
      button: button === 'left' ? 'left' : button === 'right' ? 'right' : 'middle'
    });
  }

  private async sendKey(key: string): Promise<void> {
    if (!this.currentPage) return;
    
    // Map common key names to Playwright key codes
    const mappedKey = KEY_MAPPINGS[key.toLowerCase()] || key;
    await this.currentPage.keyboard.press(mappedKey);
  }

  private async type(text: string): Promise<void> {
    if (!this.currentPage) return;
    await this.currentPage.keyboard.type(text);
  }

  protected async takeScreenshot(): Promise<string | undefined> {
    if (!this.currentPage) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = join(this.screenshotDir, `screenshot-${timestamp}.png`);
      const buffer = await this.currentPage.screenshot();
      writeFileSync(filePath, buffer);
      return buffer.toString('base64');
    } catch (error) {
      throw new ToolError(`Screenshot failed: ${error}`);
    }
  }

  private async getTabs(): Promise<Array<{ id: string; url: string; title: string }>> {
    if (!this.context) return [];
    
    const pages = this.context.pages();
    return Promise.all(pages.map(async page => ({
      id: page.url(), // Using URL as ID since Playwright doesn't have handle IDs
      url: page.url(),
      title: await page.title()
    })));
  }

  private async switchTab(tabId: string): Promise<void> {
    if (!this.context) return;
    
    const pages = this.context.pages();
    const targetPage = pages.find(page => page.url() === tabId);
    if (targetPage) {
      this.currentPage = targetPage;
      await targetPage.bringToFront();
    }
  }

  private async createTab(url?: string): Promise<Page> {
    if (!this.context) throw new ToolError('Browser not connected');
    
    const page = await this.context.newPage();
    if (url) {
      await page.goto(url);
    }
    this.currentPage = page;
    return page;
  }

  private async closeTab(tabId: string): Promise<void> {
    if (!this.context) return;
    
    const pages = this.context.pages();
    const targetPage = pages.find(page => page.url() === tabId);
    if (targetPage) {
      await targetPage.close();
      
      // Switch to another tab if available
      const remainingPages = this.context.pages();
      if (remainingPages.length > 0) {
        this.currentPage = remainingPages[0];
      }
    }
  }

  async cleanup(): Promise<void> {
    if (this.context) {
      const pages = this.context.pages();
      for (const page of pages) {
        try {
          await page.close();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }
  }
} 