import { launch } from 'chrome-launcher';
import { getConfig } from '../index';

export class BrowserManager {
  private chromeInstance: any = null;
  private debugPort: number = 9222;

  async launch() {
    const config = getConfig();
    const browserConfig = config.browsers?.find(b => b.name === 'chrome');
    const startUrl = config.baseUrl || 'about:blank';
    
    try {
      this.chromeInstance = await launch({
        port: this.debugPort,
        chromeFlags: [
          '--no-first-run',
          '--no-default-browser-check',
          '--new-window',
          '--start-maximized',
          '--disable-extensions',
          `--user-data-dir=/tmp/shortest-chrome-profile-${Date.now()}`,
        ],
        startingUrl: startUrl,
        logLevel: 'silent',
        ignoreDefaultFlags: true,
      });

      return this.chromeInstance;
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to launch Chrome: ${error.message}`);
      }
      throw error;
    }
  }

  async close() {
    if (this.chromeInstance) {
      await this.chromeInstance.kill();
      this.chromeInstance = null;
    }
  }
} 