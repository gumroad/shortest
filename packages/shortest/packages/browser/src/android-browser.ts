import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { CoreDriverForPlatform } from "@shortest/driver";
import sharp from "sharp";
import { Browser } from "./browser";
import {
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  BrowserState,
} from "./interfaces";

// @ts-expect-error not implemented fully yet
export class AndroidBrowser extends Browser {
  private id: string;
  private driver: CoreDriverForPlatform.Mobile | null = null;
  private state: DeepPartial<BrowserState>;

  constructor(driver: CoreDriverForPlatform.Mobile) {
    super();
    this.id = randomUUID();
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
    _x: number,
    _y: number
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
      await this.getDriver().executeScript("mobile: clickGesture", [{ x, y }]);
      await this.getDriver().pause(5000);

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
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outputDir = join(process.cwd(), ".shortest", "screenshots");
    const filePath = join(outputDir, `screenshot-${timestamp}.png`);

    try {
      const screenshot = await this.getDriver().takeScreenshot();

      // Rotate the screenshot and convert it back to a base64 string
      // const rotatedBuffer = await sharp(Buffer.from(screenshot, "base64"))
      //   .rotate(90)
      //   .toBuffer();

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
      message: "State received.",
      payload: {
        state: {
          window: {
            size: { width: 411, height: 889 },
          },
        },
      },
    });
  }

  public async destroy(): Promise<void> {
    if (this.getDriver()) {
      await this.getDriver().deleteSession();
      this.driver = null;
    } else {
      console.warn("No driver to destroy.");
    }
  }

  public getDriver(): CoreDriverForPlatform.Mobile {
    if (!this.driver) {
      throw new Error("Driver not initialized.");
    }
    return this.driver;
  }
}
