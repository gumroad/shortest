import { execSync } from "child_process";
import { randomUUID } from "node:crypto";
import pc from "picocolors";
import * as pw from "playwright";
import { Browser } from "../../core/browser/browser";
import {
  CoreDriverConfig,
  CoreDriverForPlatform,
  Driver,
  Platform,
} from "../../core/driver/driver";
import { getInstallationCommand } from "../../utils/platform";
import { WebBrowser } from "./web-browser";

export class WebDriver extends Driver<CoreDriverForPlatform[Platform.Web]> {
  private coreDriverConfig: CoreDriverConfig.Web | null = null;
  private driver: pw.Browser | null = null;
  private browsers: Map<string, Browser> = new Map();

  constructor(coreDriverConfig?: CoreDriverConfig.Web) {
    super();
    this.coreDriverConfig = coreDriverConfig ?? null;
  }

  async launch() {
    try {
      this.driver = await pw.chromium.launch({
        headless: __shortest__.config?.headless ?? false,
        ...this.coreDriverConfig,
      });
    } catch (error) {
      const noPlaywrightError =
        error instanceof Error &&
        error.message.includes("Executable doesn't exist");
      if (noPlaywrightError) {
        console.log(pc.yellow("Installing Playwright browser..."));

        const installationCommand = await getInstallationCommand();

        execSync(installationCommand, { stdio: "inherit" });
        console.log(pc.green("✓ Playwright browser installed"));

        this.driver = await pw.chromium.launch({
          headless: __shortest__.config?.headless ?? false,
        });
      } else {
        throw error;
      }
    }
  }

  async createBrowser(): Promise<Browser> {
    const driver = this.getDriver();
    const context = await driver.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    const id = randomUUID();
    const browser = new WebBrowser(id, context);
    this.browsers.set(id, browser);
    console.log(
      pc.green(`Browser session with ID "${id}" created successfully.`)
    );
    return browser;
  }

  async closeBrowser(id: string): Promise<void> {
    const browser = this.browsers.get(id);
    if (!browser) {
      throw new Error(`Context with ID "${id}" not found.`);
    }
    await browser.destroy();
    this.browsers.delete(id);
    console.log(
      pc.green(`Browser session with ID "${id}" closed successfully.`)
    );
  }

  async destroy(): Promise<void> {
    this.assertDriver();
    await this.driver!.close();
    this.driver = null;
  }

  getDriver(): pw.Browser {
    this.assertDriver();
    return this.driver!;
  }

  private assertDriver() {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
  }
}
