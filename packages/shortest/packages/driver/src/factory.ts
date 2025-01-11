import pc from "picocolors";
import { Driver } from "./driver";
import { CoreDriverForPlatform, DriverConfig } from "./interfaces";
import { UIAutomator2Driver } from "./uiautomator2-driver";
import { WebDriver } from "./web-driver";
import { XCUITestDriver } from "./xcuitest-driver";

export class DriverFactory {
  static async getInstance({
    platform,
    coreDriver,
  }: DriverConfig): Promise<
    Driver<CoreDriverForPlatform.Web | CoreDriverForPlatform.Mobile>
  > {
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
        case "ios":
          const IOSDriver = new XCUITestDriver(coreDriver);
          console.log(pc.blue(`Driver initialized`));
          return IOSDriver;
        default:
          throw new Error(`Unsupported platform: ${platform}`);
      }
    } catch (error) {
      console.log({ error });
      console.error("Driver initialization failed.");
      throw error;
    }
  }
}
