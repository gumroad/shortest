import * as wdio from "webdriverio";
import { Browser } from "../../core/browser/browser";
import { CoreDriverConfig, Driver } from "../../core/driver/driver";
import * as objects from "../../utils/objects";

// @ts-expect-error Implementation comming
export class XCUITestDriver extends Driver<wdio.Browser> {
  private coreDriverConfig: CoreDriverConfig.Mobile | null = null;
  private driver: wdio.Browser | null = null;
  private browsers: Map<string, Browser> = new Map();

  constructor(coreDriverConfig: CoreDriverConfig.Mobile) {
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
    } catch (error) {
      console.log("Error occured while initializing driver", { error });
      throw error;
    }
  }
}
