import { BrowserTool, ToolError, ToolResult } from './base';
import { ActionInput, BrowserAction, BrowserToolOptions, MouseButton } from './types';
import CDP from 'chrome-remote-interface';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BrowserManager } from '../core/browser-manager';

export class BrowserActionTool extends BrowserTool {
  name = 'browser';
  private cdpClient: CDP.Client | null = null;
  private typingDelay = 50;
  private screenshotDir = join(process.cwd(), 'test-screenshots');

  constructor(browserManager: BrowserManager) {
    super(browserManager);
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

      return { output: result, screenshot };

    } catch (error) {
      if (error instanceof ToolError) throw error;
      throw new ToolError(`Browser action failed: ${error}`);
    }
  }

  private async executeAction(input: ActionInput): Promise<string> {
    const { action, coordinates, button, clickCount, text, key } = input;

    switch (action) {
      case 'mouse_move':
        if (!coordinates) {
          throw new ToolError('Coordinates required for mouse_move');
        }
        await this.ensureActiveTab();
        await this.mouseMove(coordinates[0], coordinates[1]);
        if (button) {
          await this.click(coordinates[0], coordinates[1], button, clickCount);
        }
        return `Mouse moved to (${coordinates[0]}, ${coordinates[1]})${button ? ' and clicked' : ''}`;

      case 'key':
        if (!key) {
          throw new ToolError('Key required for key action');
        }
        await this.sendKey(key);
        return `Pressed key: ${key}`;

      case 'type':
        if (!text) {
          throw new ToolError('Text required for type action');
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

  private async ensureActiveTab(): Promise<void> {
    const { Target } = this.cdpClient!;
    const targets = await Target.getTargets();
    const activeTarget = targets.targetInfos.find(t => t.type === 'page' && t.attached);
    
    if (activeTarget) {
      await Target.activateTarget({ targetId: activeTarget.targetId });
    }
  }

  private async mouseMove(x: number, y: number): Promise<void> {
    const { Input, Runtime } = this.cdpClient!;
    await Input.dispatchMouseEvent({
      type: 'mouseMoved',
      x,
      y
    });

    await Runtime.evaluate({
      expression: `
        (() => {
          const existing = document.getElementById('shortest-cursor');
          if (existing) existing.remove();

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
            left: ${x}px;
            top: ${y}px;
          \`;
          document.body.appendChild(cursor);
        })()
      `
    });
  }

  private async click(x: number, y: number, button: MouseButton = 'left', clickCount: number = 1): Promise<void> {
    const { Input, Runtime } = this.cdpClient!;
    
    await Input.dispatchMouseEvent({
      type: 'mousePressed',
      x,
      y,
      button,
      clickCount
    });

    await Runtime.evaluate({
      expression: `
        (() => {
          if (!document.getElementById('shortest-animations')) {
            const style = document.createElement('style');
            style.id = 'shortest-animations';
            style.textContent = \`
              @keyframes clickRipple {
                0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
              }
            \`;
            document.head.appendChild(style);
          }

          const effect = document.createElement('div');
          effect.style.cssText = \`
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 20px;
            height: 20px;
            border: 2px solid red;
            border-radius: 50%;
            pointer-events: none;
            z-index: 999998;
            transform: translate(-50%, -50%);
            animation: clickRipple 0.5s ease-out forwards;
          \`;
          document.body.appendChild(effect);
          setTimeout(() => effect.remove(), 500);
        })()
      `
    });

    await Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x,
      y,
      button,
      clickCount
    });
  }

  private async sendKey(key: string): Promise<void> {
    const { Input } = this.cdpClient!;
    await Input.dispatchKeyEvent({
      type: 'keyDown',
      key
    });
    await Input.dispatchKeyEvent({
      type: 'keyUp',
      key
    });
  }

  private async type(text: string): Promise<void> {
    const { Input } = this.cdpClient!;
    
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
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filePath = join(this.screenshotDir, `screenshot-${timestamp}.png`);
      writeFileSync(filePath, Buffer.from(data, 'base64'));
      
      return data;
    } catch (error) {
      throw new ToolError(`Screenshot failed: ${error}`);
    }
  }
} 