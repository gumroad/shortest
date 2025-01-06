import { Options } from "@wdio/types";
import pw from "playwright";
import * as wdio from "webdriverio";
import { Browser } from "../browser/browser";

export enum Platform {
  Web = "web",
  Ios = "ios",
  Android = "android",
}

export type PlatformType = `${Platform}`;

export enum MobilePlatform {
  Ios = "ios",
  Android = "android",
}
export type MobilePlatformType = `${MobilePlatform}`;

export type DriverCore = pw.Browser | wdio.Browser;
export type CoreDriverForPlatform = {
  web: pw.Browser;
  mobile: wdio.Browser;
};
export namespace CoreDriverConfig {
  export type Web = pw.LaunchOptions;

  export type Mobile = Options.WebdriverIO &
    Omit<Options.Testrunner, "capabilities" | "rootDir">;
}

export type DriverConfig =
  | {
      platform: "web";
      coreDriver?: CoreDriverConfig.Web;
    }
  | {
      platform: "android";
      coreDriver?: CoreDriverConfig.Mobile;
    }
  | {
      platform: "ios";
      coreDriver?: CoreDriverConfig.Mobile;
    };

export abstract class Driver<T extends DriverCore> {
  /**
   * Creates a new browser session.
   * A Browser is isolated context where a test is executed.
   */
  abstract createBrowser(): Promise<Browser>;

  /**
   * Closes an existing Browser with given id.
   */
  abstract closeBrowser(id: string): Promise<void>;

  /**
   * Launches the driver instance.
   * For web, it initializes Playwright.
   * For mobile, it initializes WebDriver.
   */
  abstract launch(): Promise<void>;

  /**
   * Cleans up the driver instance and closes every session.
   */
  abstract destroy(): Promise<void>;

  /**
   * Gets the core driver instance.
   * This method returns the core driver (either Playwright or WebDriver) depending on the platform.
   */
  abstract getDriver(): T;
}
