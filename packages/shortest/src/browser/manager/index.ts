import { chromium, Browser, BrowserContext } from 'playwright';
import { getConfig } from '../../index';
import path from 'path';
import { mkdirSync, existsSync, rmSync } from 'fs';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private userDataDir = path.join(process.cwd(), '.shortest');

  async launch(): Promise<BrowserContext> {
    const config = getConfig();
    const browserConfig = config.browsers?.[0] || { name: 'chrome', headless: false };
    const baseUrl = config.baseUrl || 'http://localhost:3000';

    try {
      await this.forceCleanup();
      
      await this.ensureUserDataDir();
      return await this.createContext(browserConfig, baseUrl);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to launch Chrome: ${error.message}`);
      }
      throw error;
    }
  }

  private async forceCleanup(): Promise<void> {
    const lockFile = path.join(this.userDataDir, 'SingletonLock');
    
    try {
      // Force remove lock file if it exists
      if (existsSync(lockFile)) {
        console.log('🧹 Cleaning up stale lock file...');
        rmSync(lockFile, { force: true });
      }

      // Clean entire directory if it exists
      if (existsSync(this.userDataDir)) {
        console.log('🧹 Cleaning up browser data directory...');
        rmSync(this.userDataDir, { recursive: true, force: true });
      }
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error);
    }
  }

  private async ensureUserDataDir(): Promise<void> {
    if (!existsSync(this.userDataDir)) {
      mkdirSync(this.userDataDir, { recursive: true });
    }
  }

  private async createContext(browserConfig: any, baseUrl: string): Promise<BrowserContext> {
    this.context = await chromium.launchPersistentContext(this.userDataDir, {
      headless: browserConfig.headless,
      viewport: { width: 1920, height: 1080 },
      args: [
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-sync',
        '--disable-features=TranslateUI,ChromeWhatsNewUI',
        '--disable-infobars',
      ],
      ignoreDefaultArgs: false
    });

    const page = this.context.pages()[0] || await this.context.newPage();
    
    await page.waitForLoadState('domcontentloaded');
    await page.goto(baseUrl);
    await page.waitForLoadState('networkidle');

    return this.context;
  }

  async clearContext(): Promise<BrowserContext> {
    if (!this.context) {
      throw new Error('No context available');
    }

    // Clear all browser state
    await Promise.all([
      this.context.clearCookies(),
      // Clear storage
      this.context.pages().map(page => 
        page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
          indexedDB.deleteDatabase('shortest');
        })
      ),
      // Clear permissions
      this.context.clearPermissions(),
    ]);

    // Navigate all pages to blank
    await Promise.all(
      this.context.pages().map(page => 
        page.goto('about:blank')
      )
    );

    // Close all pages except first
    const pages = this.context.pages();
    if (pages.length > 1) {
      await Promise.all(
        pages.slice(1).map(page => page.close())
      );
    }

    // Navigate first page to baseUrl
    const baseUrl = getConfig().baseUrl || 'http://localhost:3000';
    await pages[0].goto(baseUrl);
    await pages[0].waitForLoadState('networkidle');

    return this.context;
  }

  async recreateContext(): Promise<BrowserContext> {
    return this.clearContext();
  }

  private async closeContext(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
  }

  private async cleanUserDataDir(): Promise<void> {
    if (existsSync(this.userDataDir)) {
      try {
        if (this.context) {
          await this.context.close();
          this.context = null;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        for (let i = 0; i < 3; i++) {
          try {
            rmSync(this.userDataDir, { recursive: true, force: true });
            break;
          } catch (e) {
            if (i === 2) throw e;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } catch (error) {
        if (error instanceof Error) {
          console.warn(`Failed to clean directory: ${error.message}`);
          return;
        }
        throw error;
      }
    }
  }

  async close(): Promise<void> {
    try {
      await this.closeContext();
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      // Always try to clean up after closing
      await this.forceCleanup();
    } catch (error) {
      console.error('⚠️ Error during browser cleanup:', error);
      // Force cleanup even if close fails
      await this.forceCleanup();
    }
  }

  // Add process termination handler
  setupCleanupHandlers(): void {
    process.on('SIGINT', async () => {
      console.log('\n🧹 Cleaning up before exit...');
      await this.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🧹 Cleaning up before termination...');
      await this.close();
      process.exit(0);
    });
  }

  getContext(): BrowserContext | null {
    return this.context;
  }
} 