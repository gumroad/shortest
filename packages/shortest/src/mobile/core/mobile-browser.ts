import { writeFileSync } from "fs";
import { join } from "path";
// import sharp from "sharp";
import * as wdio from "webdriverio";
import {
  Browser,
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  BrowserState,
} from "../../core/browser/browser";

// @ts-expect-error not implemented fully yet
export class MobileBrowser extends Browser {
  private id: string;
  private driver: wdio.Browser | null = null;
  private state: DeepPartial<BrowserState>;

  constructor(id: string, driver: wdio.Browser) {
    super();
    this.id = id;
    this.driver = driver;
    this.state = {};
  }

  public getId() {
    return this.id;
  }

  public async navigate(
    _url: string,
    _options: BrowserActionOptions.Navigate
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    return {
      message: "Navigated.",
    };
  }

  async locateAt(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.LocateAt>> {
    return await Promise.resolve({
      message: "Not implemented yet",
    });
  }

  async click(
    x: number | null,
    y: number | null
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    if (x === null || y === null || isNaN(x) || isNaN(y)) {
      x = this.state?.cursor?.position?.x ?? 0;
      y = this.state?.cursor?.position?.y ?? 0;
      console.warn(
        `No coordinates provided. Using last remembered cursor position ${x} ${y}`
      );
    }

    try {
      this.assertDriver();
      await this.driver!.executeScript("mobile: clickGesture", [{ x, y }]);
      await this.driver!.pause(1000);

      let metadata;
      try {
        metadata = await this.getState();
      } catch {
        // Fallthrough
      }

      return {
        message: `Tap performed at (${x}, ${y})`,
        metadata,
      };
    } catch (error) {
      throw new Error(`Failed to tap: ${error}`);
    }
  }

  async screenshot(): Promise<BrowserActionResult<BrowserActions.Screenshot>> {
    this.assertDriver();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = join(process.cwd(), ".shortest", "screenshots");
    const filePath = join(outputDir, `screenshot-${timestamp}.png`);

    try {
      if (!this.driver) {
        throw new Error("No driver found.");
      }

      const screenshot = await this.driver.takeScreenshot();

      // Rotate the screenshot and convert it back to a base64 string
      // const rotatedBuffer = await sharp(Buffer.from(screenshot, "base64"))
      //   .rotate(90)
      //   .toBuffer();

      // Save the original screenshot to a file (optional)
      writeFileSync(filePath, Buffer.from(screenshot, "base64"));

      return {
        message: `Screenshot taken`,
        payload: {
          base64Image: screenshot,
        },
        metadata: {
          browserState: (await this.getState()).payload?.state,
        },
      };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error}`);
    }
  }

  public getState(): Promise<BrowserActionResult<BrowserActions.GetState>> {
    return Promise.resolve({
      message: "State is not available at the moment",
    });
  }

  public async destroy(): Promise<void> {
    try {
      this.assertDriver();
      await this.driver!.deleteSession();
      this.driver = null;
    } catch (error) {
      throw error;
    }
  }

  private assertDriver() {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
  }
}
