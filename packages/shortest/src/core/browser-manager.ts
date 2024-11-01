import { launch } from 'chrome-launcher';
import CDP from 'chrome-remote-interface';
import { getConfig } from '../index';

export class BrowserManager {
  private chromeInstance: any = null;
  private cdpClient: CDP.Client | null = null;
  private debugPort: number = 9222;

  async launch() {
    const config = getConfig();
    const browserConfig = config.browsers?.find(b => b.name === 'chrome');
    const startUrl = config.baseUrl || 'about:blank';
    
    try {
      // Launch Chrome
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

      // Connect CDP
      this.cdpClient = await CDP({
        port: this.debugPort
      });

      // Enable necessary domains
      const { Page, DOM, Runtime, Network } = this.cdpClient;
      await Promise.all([
        Page.enable(),
        DOM.enable(),
        Runtime.enable(),
        Network.enable()
      ]);

      return this.cdpClient;

    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to launch Chrome: ${error.message}`);
      }
      throw error;
    }
  }

  async close() {
    if (this.cdpClient) {
      await this.cdpClient.close();
      this.cdpClient = null;
    }
    if (this.chromeInstance) {
      await this.chromeInstance.kill();
      this.chromeInstance = null;
    }
  }

  getCdpClient(): CDP.Client | null {
    return this.cdpClient;
  }
} 