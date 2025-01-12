import { Options } from "@wdio/types";
import pw from "playwright";
import * as wdio from "webdriverio";

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

export namespace CoreDriverForPlatform {
  export type Web = pw.Browser;

  export type Mobile = wdio.Browser;
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

export type WebPage = pw.Page;
export type WebBrowserDriver = pw.BrowserContext;
