import { chromium, Browser, BrowserContext } from 'playwright';
import { getConfig } from '../index';
import path from 'path';
import { mkdirSync, existsSync } from 'fs';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private userDataDir = path.join(process.cwd(), '.browser-data');

  async launch(): Promise<BrowserContext> {
    const config = getConfig();
    const browserConfig = config.browsers?.[0] || { name: 'chrome', headless: false };
    const baseUrl = config.baseUrl || 'http://localhost:3000';

    try {
      // Ensure user data directory exists
      if (!existsSync(this.userDataDir)) {
        mkdirSync(this.userDataDir, { recursive: true });
      }

      // Launch persistent context
      this.context = await chromium.launchPersistentContext(this.userDataDir, {
        headless: browserConfig.headless,
        viewport: { width: 1920, height: 1080 }
      });

      const page = this.context.pages()[0] || await this.context.newPage();
      await page.goto(baseUrl);

      return this.context;

    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to launch Chrome: ${error.message}`);
      }
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  getContext(): BrowserContext | null {
    return this.context;
  }
} 