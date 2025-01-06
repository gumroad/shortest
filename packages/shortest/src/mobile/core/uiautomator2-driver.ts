import { randomUUID } from "node:crypto";
import pc from "picocolors";
import * as wdio from "webdriverio";
import { Browser } from "../../core/browser/browser";
import { Driver, CoreDriverConfig } from "../../core/driver/driver";
import * as objects from "../../utils/objects";
import { MobileBrowser } from "./mobile-browser";

export class UIAutomator2Driver extends Driver<wdio.Browser> {
  private coreDriverConfig: CoreDriverConfig.Mobile | null = null;
  private driver: wdio.Browser | null = null;
  private browsers: Map<string, Browser> = new Map();

  constructor(coreDriverConfig?: CoreDriverConfig.Mobile) {
    super();
    this.coreDriverConfig = coreDriverConfig ?? null;
  }

  public async init() {
    try {
      if (!this.driver) {
        this.driver = await wdio.remote(
          objects.mergeDeep(
            {
              // @see https://webdriver.io/docs/configurationfile/
              capabilities: {
                platformName: "Android",
                "appium:automationName": "UiAutomator2",
                "appium:noReset": true,
              },
              protocol: "http",
              hostname: "127.0.0.1",
              port: 4723,
              strictSSL: false,
            },
            this.coreDriverConfig || {}
          )
        );
      }
    } catch (error) {
      console.log("Error occured while initializing driver", { error });
      throw error;
    }

    // ensure entry point
    // const isAppIntalled =
    //   await this.driver.isAppInstalled("com.gldn.mobileapp");
    // if (!isAppIntalled) {
    //   this.driver.installApp(capabilities!["appium:app"]);
    // }
  }

  public async launch(): Promise<void> {
    return;
  }

  public async createBrowser(): Promise<Browser> {
    if (!this.driver) {
      throw new Error("Driver is not initialized.");
    }
    const id = randomUUID();
    const browser = new MobileBrowser(id, this.driver);
    this.browsers.set(id, browser);
    return browser;
  }

  public async closeBrowser(id: string): Promise<void> {
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

  async destroy() {
    if (this.getDriver()) {
      this.driver = null;
    } else {
      console.log("No driver session to close.");
    }
  }

  public getDriver(): wdio.Browser {
    this.assertDriver();
    return this.driver!;
  }

  private assertDriver() {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
  }
}
