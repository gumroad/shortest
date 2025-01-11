import { Browser } from "@shortest/browser";
import { DriverCore } from "./interfaces";

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
   * Ensures that the driver is initialized and gets the core driver instance.
   * This method returns the core driver (either Playwright or WebDriver) depending on the platform.
   */
  abstract getDriver(): T;
}
