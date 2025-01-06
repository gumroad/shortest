import pc from "picocolors";
import pw from "playwright";
import * as wdio from "webdriverio";
import { WebDriver } from "../../browser/core/web-driver";
import { UIAutomator2Driver } from "../../mobile/core/uiautomator2-driver";
// import { XCUITestDriver } from "../../mobile/core/xcuitest-driver";
import { Driver, DriverConfig } from "./driver";

export class DriverFactory {
  static async getInstance({
    platform,
    coreDriver,
  }: DriverConfig): Promise<Driver<pw.Browser | wdio.Browser>> {
    console.log(pc.blue(`Initializing driver for ${platform} platform`));
    try {
      switch (platform) {
        case "web":
          const webDriver = new WebDriver(coreDriver);
          console.log(pc.blue(`Driver initialized`));
          return webDriver;
        case "android":
          const androidDriver = new UIAutomator2Driver(coreDriver);
          await androidDriver.init();
          console.log(pc.blue(`Driver initialized`));
          return androidDriver;
        // case "ios":
        //   const IOSDriver = new XCUITestDriver(coreDriverConfig);
        //   console.log(pc.blue(`Driver initialized`));
        //   return IOSDriver;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.error("Driver initialization failed.");
      throw error;
    }
  }
}
