import { chromium, Browser, BrowserContext } from 'playwright';
import { getConfig } from '../index';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async launch(): Promise<BrowserContext> {
    const config = getConfig();
    const browserConfig = config.browsers?.[0] || { name: 'chrome', headless: false };
    const baseUrl = config.baseUrl || 'http://localhost:3000';

    console.log('Browser Config:', {
      fromConfig: config.browsers?.[0],
      usingConfig: browserConfig,
      headless: browserConfig.headless,
      baseUrl
    });

    try {
      const launchArgs = [
        '--start-maximized',
        '--disable-infobars',
        '--no-sandbox',
        `--window-size=1920,1080`,
        `--window-position=0,0`
      ];

      if (!browserConfig.headless) {
        launchArgs.push('--kiosk');
      }

      this.browser = await chromium.launch({
        headless: browserConfig.headless,
        args: launchArgs
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        screen: { width: 1920, height: 1080 },
        acceptDownloads: true
      });

      const page = await this.context.newPage();

      await page.setViewportSize({ width: 1920, height: 1080 });

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