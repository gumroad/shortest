import { Browser, IOSBrowser } from "@shortest/browser";
import {
  CoreDriverConfig,
  Driver,
  CoreDriverForPlatform,
} from "@shortest/driver";
import { merge, retry } from "@shortest/util";
import pc from "picocolors";
import * as wdio from "webdriverio";

/**
 * Shortest driver for IOS platforms
 */
// @ts-expect-error Implementation comming
export class XCUITestDriver extends Driver<CoreDriverForPlatform.Mobile> {
  private coreDriverConfig: CoreDriverConfig.Mobile | null = null;
  private driver: CoreDriverForPlatform.Mobile | null = null;
  private browsers: Map<string, Browser> = new Map();

  constructor(coreDriverConfig?: CoreDriverConfig.Mobile) {
    super();
    this.coreDriverConfig = coreDriverConfig ?? null;
  }

  public async init() {
    const CONNECT_RETRY_ATTEMPTS = 2;
    const connect = async () => {
      if (!this.getDriver()) {
        this.driver = await wdio.remote(
          merge(
            {
              // @see https://webdriver.io/docs/configurationfile/
              capabilities: {
                platformName: "iOS",
                "appium:automationName": "XCUITest",
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
    };

    await retry(connect.bind(this), CONNECT_RETRY_ATTEMPTS);
  }

  public async createBrowser(): Promise<Browser> {
    const browser = new IOSBrowser(this.getDriver());
    this.browsers.set(browser.getId(), browser);
    return browser;
  }

  public async closeBrowser(id: string): Promise<void> {
    const browser = this.browsers.get(id);
    if (!browser) {
      throw new Error(`Browser session with ID "${id}" not found.`);
    }

    await browser.destroy();
    this.browsers.delete(id);
    console.log(
      pc.green(`Browser session with ID "${id}" closed successfully.`)
    );
  }

  public getDriver(): CoreDriverForPlatform.Mobile {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
    return this.driver;
  }
}
