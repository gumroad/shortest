import { BrowserTool, ToolError, ToolResult } from './base';
import { ActionInput, BrowserAction, BrowserToolOptions, MouseButton } from './types';
import CDP from 'chrome-remote-interface';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BrowserManager } from '../core/browser-manager';

// Define proper CDP types
interface TargetInfo {
  targetId: string;
  type: string;
  title: string;
  url: string;
  attached: boolean;
}

interface CDPTarget {
  description: string;
  devtoolsFrontendUrl: string;
  id: string;
  webSocketDebuggerUrl: string;
  targetInfo: TargetInfo;
}

interface TargetEvent {
  targetInfo: TargetInfo;
}

interface TargetDestroyedEvent {
  targetId: string;
}

interface Resolution {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
  x: number;
  y: number;
}

interface TabInfo {
  id: string;
  url: string;
  title: string;
  type: string;
}

// Similar to Python version's scaling targets
const MAX_SCALING_TARGETS: { [key: string]: Resolution } = {
  XGA: { width: 1024, height: 768 },    // 4:3
  WXGA: { width: 1280, height: 800 },   // 16:10
  FWXGA: { width: 1366, height: 768 }   // ~16:9
};

export class BrowserActionTool extends BrowserTool {
  name = 'browser';
  private cdpClient: CDP.Client | null = null;
  private typingDelay = 50;
  private screenshotDir = join(process.cwd(), 'test-screenshots');
  private reconnectAttempts = 3;
  private windowTargets = new Map<string, TargetInfo>();
  private width: number;
  private height: number;
  private displayNum: number;
  private scalingEnabled = true;
  private activeTabId: string | null = null;
  private viewport: Viewport | null = null;

  constructor(browserManager: BrowserManager) {
    super(browserManager);
    mkdirSync(this.screenshotDir, { recursive: true });
    // Get from environment or default
    this.width = parseInt(process.env.WIDTH || '1920', 10);
    this.height = parseInt(process.env.HEIGHT || '1080', 10);
    this.displayNum = parseInt(process.env.DISPLAY_NUM || '0', 10);
  }

  async execute(input: ActionInput, options: BrowserToolOptions = {}): Promise<ToolResult> {
    try {
      this.cdpClient = this.browserManager.getCdpClient();
      if (!this.cdpClient) {
        throw new ToolError('Browser not connected');
      }

      // Handle tab management actions
      switch (input.action) {
        case 'new_tab':
          const tabId = await this.createTab(input.url);
          return { output: `Created new tab with ID: ${tabId}` };

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
          await this.ensureActiveTab();
          await this.mouseMove(input.coordinates[0], input.coordinates[1]);
          if (input.button) {
            await this.click(input.coordinates[0], input.coordinates[1], input.button, input.clickCount);
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
      if (await this.handleError(error)) {
        return this.execute(input, options);
      }
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.cdpClient) {
      this.cdpClient = this.browserManager.getCdpClient();
      if (!this.cdpClient) {
        throw new ToolError('Browser not connected');
      }

      // Enable required domains
      await Promise.all([
        this.cdpClient.Page.enable(),
        this.cdpClient.DOM.enable(),
        this.cdpClient.Network.enable()
      ]);

      // Setup event listeners
      this.cdpClient.on('Target.targetCreated', this.handleTargetCreated.bind(this));
      this.cdpClient.on('Target.targetDestroyed', this.handleTargetDestroyed.bind(this));
    }
  }

  private async handleError(error: unknown): Promise<boolean> {
    if (error instanceof Error && error.message.includes('connection')) {
      for (let i = 0; i < this.reconnectAttempts; i++) {
        try {
          this.cdpClient = null;
          await this.ensureConnection();
          return true;
        } catch (e) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    return false;
  }

  private async handleTargetCreated(event: TargetEvent): Promise<void> {
    this.windowTargets.set(event.targetInfo.targetId, event.targetInfo);
  }

  private async handleTargetDestroyed(event: TargetDestroyedEvent): Promise<void> {
    this.windowTargets.delete(event.targetId);
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
      this.windowTargets.set(activeTarget.targetId, activeTarget);
    }
  }

  private async mouseMove(x: number, y: number): Promise<void> {
    const { Input, Runtime } = this.cdpClient!;
    
    // Move the actual mouse
    await Input.dispatchMouseEvent({
      type: 'mouseMoved',
      x,
      y
    });

    // Add visual feedback using CDP's overlay features
    await Runtime.evaluate({
      expression: `
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
      `
    });
  }

  private async click(x: number, y: number, button: MouseButton = 'left', clickCount: number = 1): Promise<void> {
    const { Input, Runtime } = this.cdpClient!;
    
    // First add the styles if they don't exist
    await Runtime.evaluate({
      expression: `
        if (!document.getElementById('shortest-animations')) {
          const style = document.createElement('style');
          style.id = 'shortest-animations';
          style.textContent = \`
            @keyframes clickRipple {
              0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
              50% { transform: translate(-50%, -50%) scale(2); opacity: 0.5; }
              100% { transform: translate(-50%, -50%) scale(3); opacity: 0; }
            }
          \`;
          document.head.appendChild(style);
        }
      `
    });

    // Actual click
    await Input.dispatchMouseEvent({
      type: 'mousePressed',
      x,
      y,
      button,
      clickCount
    });

    // Show ripple effect immediately after press
    await Runtime.evaluate({
      expression: `
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
      `
    });

    // Complete the click
    await Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x,
      y,
      button,
      clickCount
    });

    // Small delay to ensure animation is visible
    await new Promise(resolve => setTimeout(resolve, 50));
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

  async cleanup(): Promise<void> {
    if (this.cdpClient) {
      // Close all tracked targets
      for (const [targetId] of this.windowTargets) {
        try {
          await this.cdpClient.Target.closeTarget({ targetId });
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
      this.windowTargets.clear();
      
      // Close CDP connection
      await this.cdpClient.close();
      this.cdpClient = null;
    }
  }

  private scaleCoordinates(x: number, y: number, fromBrowser: boolean = false): [number, number] {
    if (!this.scalingEnabled) return [x, y];

    // Check bounds
    if (x > this.width || y > this.height) {
      throw new ToolError(`Coordinates (${x}, ${y}) are out of bounds`);
    }

    const ratio = this.width / this.height;
    let targetDimension: Resolution | null = null;

    // Find matching aspect ratio target
    for (const dimension of Object.values(MAX_SCALING_TARGETS)) {
      const dimensionRatio = dimension.width / dimension.height;
      if (Math.abs(dimensionRatio - ratio) < 0.02 && dimension.width < this.width) {
        targetDimension = dimension;
        break;
      }
    }

    if (!targetDimension) return [x, y];

    const xScalingFactor = targetDimension.width / this.width;
    const yScalingFactor = targetDimension.height / this.height;

    if (fromBrowser) {
      // Scale up from browser coordinates
      return [
        Math.round(x / xScalingFactor),
        Math.round(y / yScalingFactor)
      ];
    } else {
      // Scale down to browser coordinates
      return [
        Math.round(x * xScalingFactor),
        Math.round(y * yScalingFactor)
      ];
    }
  }

  private async getTabs(): Promise<TabInfo[]> {
    if (!this.cdpClient) {
      throw new ToolError('Browser not connected');
    }

    const { Target } = this.cdpClient;
    const targets = await Target.getTargets();
    
    return targets.targetInfos
      .filter(target => target.type === 'page')
      .map(target => ({
        id: target.targetId,
        url: target.url,
        title: target.title,
        type: target.type
      }));
  }

  private async switchTab(tabId: string): Promise<void> {
    if (!this.cdpClient) {
      throw new ToolError('Browser not connected');
    }

    const { Target } = this.cdpClient;
    await Target.activateTarget({ targetId: tabId });
    this.activeTabId = tabId;
    
    // Reset viewport cache as it might be different in new tab
    this.viewport = null;
  }

  private async createTab(url?: string): Promise<string> {
    if (!this.cdpClient) {
      throw new ToolError('Browser not connected');
    }

    const { Target } = this.cdpClient;
    const { targetId } = await Target.createTarget({
      url: url || 'about:blank',
      newWindow: false
    });

    await this.switchTab(targetId);
    return targetId;
  }

  private async closeTab(tabId: string): Promise<void> {
    if (!this.cdpClient) {
      throw new ToolError('Browser not connected');
    }

    const { Target } = this.cdpClient;
    await Target.closeTarget({ targetId: tabId });
    
    // If we closed the active tab, switch to another one
    if (tabId === this.activeTabId) {
      const tabs = await this.getTabs();
      if (tabs.length > 0) {
        await this.switchTab(tabs[0].id);
      }
    }
  }
} 