import {
  MobileBrowserDriver,
  WebBrowserDriver,
  WebPage,
} from "@shortest/driver";
import {
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  BrowserAutomation,
} from "./interfaces";

export abstract class Browser {
  /**
   * Locates an element at given coordinates.
   */
  abstract locateAt(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.LocateAt>>;

  /**
   * Takes a screenshot of the current browser state.
   */
  abstract screenshot(): Promise<
    BrowserActionResult<BrowserActions.Screenshot>
  >;

  abstract getId(): string;
  abstract getState(): Promise<BrowserActionResult<BrowserActions.GetState>>;
  abstract drag(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.Drag>>;

  /**
   * Clicks/taps at the given coordinates.
   * @default Clicks at the current cursor position if coordinates are not provided.
   */
  abstract click(
    x: number | null,
    y: number | null
  ): Promise<BrowserActionResult<BrowserActions.Click>>;
  abstract moveCursor(
    x: number,
    y: number
  ): Promise<BrowserActionResult<BrowserActions.MoveCursor>>;
  abstract type(
    text: string
  ): Promise<BrowserActionResult<BrowserActions.Type>>;

  /**
   * @note Not available on mobile platforms.
   */
  abstract pressKey(
    key: string[]
  ): Promise<BrowserActionResult<BrowserActions.PressKey>>;

  /**
   * Navigates to the given URL.
   * @note Not available on mobile platforms.
   */
  abstract navigate(
    url: string,
    options: BrowserActionOptions.Navigate
  ): Promise<BrowserActionResult<BrowserActions.Navigate>>;

  /**
   * Pauses the browser for a specified duration.
   * @default 60s pause if no duration is provided.
   */
  abstract sleep(
    ms: number | null
  ): Promise<BrowserActionResult<BrowserActions.Sleep>>;

  /**
   * Executes a pre-defined automation.
   */
  abstract runAutomation(
    automation: BrowserAutomation,
    options: BrowserActionOptions.Automation
  ): Promise<BrowserActionResult<BrowserActions.Automation>>;

  /**
   * Executes callback function.
   */
  abstract runCallback(): Promise<BrowserActionResult<BrowserActions.Callback>>;

  abstract getDriver(): WebBrowserDriver | MobileBrowserDriver;
  abstract getCurrentPage(): WebPage | null; // todo: add mobile as well
  abstract cleanup(): Promise<BrowserActionResult<BrowserActions.Cleanup>>;
  abstract destroy(): Promise<void>;
}
