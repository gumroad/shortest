/**
 * @fileoverview
 * This file consolidates and adapts Claude responses into
 * browser input interfaces. It transforms actions described
 * by Claude into corresponding browser automation commands.
 *
 * @see {@link ClaudeResponse} for the structure of the Claude response.
 * @see {@link Browser} for the Browser interface definition.
 */

import {
  Browser,
  BrowserActionOptions,
  BrowserActionResult,
  BrowserActions,
  keyboardShortcuts,
  MailosaurTool,
  githubAutomation,
} from "@shortest/browser";
import {
  ClaudeResponse,
  ClaudeResponseDoubleClick,
  ClaudeResponseGithubAutomation,
  ClaudeResponseKeyPress,
  ClaudeResponseLeftClick,
  ClaudeResponseLeftClickDrag,
  ClaudeResponseMailosaurAutomation,
  ClaudeResponseMiddleClick,
  ClaudeResponseMouseMove,
  ClaudeResponseNavigate,
  ClaudeResponseRightClick,
  ClaudeResponseSleep,
  ClaudeResponseTypeText,
  ClaudeResponseVerbose,
} from "./interfaces";

/**
 * Adapter for transforming LLM actions to browser actions
 */
export class ClaudeAdapter {
  constructor(private browser: Browser) {}

  async execute(response: ClaudeResponse): Promise<BrowserActionResult<any>> {
    switch (response.action) {
      case "key":
        return this.handleKeyPress(response);
      case "type":
        return this.handleTypeText(response);
      case "mouse_move":
        return this.handleMouseMove(response);
      case "left_click":
        return this.handleLeftClick(response);
      case "left_click_drag":
        return this.handleLeftClickDrag(response);
      case "right_click":
        return this.handleRightClick(response);
      case "middle_click":
        return this.handleMiddleClick(response);
      case "double_click":
        return this.handleDoubleClick(response);
      case "sleep":
        this.handleSleep(response);
      case "screenshot":
        return this.handleScreenshot();
      case "cursor_position":
        return this.handleCursorPosition();
      case "navigate":
        return this.handleNavigate(response);
      case "check_email":
        return this.handleMailosaurAutomation(response);
      case "github_tool":
        return this.handleGithubAutomation(response);
      case "clear_session":
        return this.handleClearSession();
      case "run_callback":
        return this.handleRunCallback();
      default:
        throw new Error(
          `Unsupported action: ${(response as ClaudeResponseVerbose).action}`
        );
    }
  }

  private async handleKeyPress(
    response: ClaudeResponseKeyPress
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.text) throw new Error("Text required for key press action.");
    const text = response.text.toLowerCase();
    const toPress = Array.isArray(keyboardShortcuts[text])
      ? (keyboardShortcuts[text] as string[])
      : ([keyboardShortcuts[text] || text] as string[]);

    return await this.browser.pressKey(toPress);
  }

  private async handleTypeText(
    response: ClaudeResponseTypeText
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.text) throw new Error("Text required for type action.");
    return await this.browser.type(response.text);
  }

  private async handleMouseMove(
    response: ClaudeResponseMouseMove
  ): Promise<BrowserActionResult<BrowserActions.MoveCursor>> {
    if (!response.coordinate)
      throw new Error("Coordinate required for mouse_move action.");
    const [x, y] = response.coordinate;
    return await this.browser.moveCursor(x, y);
  }

  private async handleLeftClick(
    response: ClaudeResponseLeftClick
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    let [x, y] = response.coordinate ?? [null, null];

    // const DEVICE_PIXEL_RATIO = 2.625;
    // const AI_X_MULTIPLIER = 0.38;
    // const AI_Y_MULTIPLIER = 0.37;
    // if (x && y) {
    //   x = x * 3.5;
    //   y = y * 3.5;
    // }
    return await this.browser.click(
      Math.round(x! + 200 * 2.625),
      Math.round(y! + 200 * 2.625)
    );
  }

  private async handleLeftClickDrag(
    response: ClaudeResponseLeftClickDrag
  ): Promise<BrowserActionResult<BrowserActions.Drag>> {
    if (!response.coordinate)
      throw new Error("Coordinate required for left_click_drag action.");
    const [x, y] = response.coordinate;
    return await this.browser.drag(x, y);
  }

  private async handleRightClick(
    _response: ClaudeResponseRightClick
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    throw new Error("Right click not supported yet.");
  }

  private async handleMiddleClick(
    _response: ClaudeResponseMiddleClick
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    throw new Error("Right click not supported yet.");
  }

  private async handleDoubleClick(
    response: ClaudeResponseDoubleClick
  ): Promise<BrowserActionResult<BrowserActions.Click>> {
    console.warn(
      "Double click not supported yet, left click will be used instead."
    );
    return await this.handleLeftClick(
      // currently, ClaudeResponseDoubleClick is the same as ClaudeResponseLeftClick
      response as unknown as ClaudeResponseLeftClick
    );
  }

  private async handleScreenshot(): Promise<
    BrowserActionResult<BrowserActions.Screenshot>
  > {
    return await this.browser.screenshot();
  }

  private async handleCursorPosition(): Promise<
    BrowserActionResult<BrowserActions.GetState>
  > {
    const result = await this.browser.getState();
    const cursorPosition = result.metadata?.browserState?.cursor?.position;
    return {
      message: `Cursor position is: (${cursorPosition?.x}, ${cursorPosition?.y})`,
      payload: result.payload,
      metadata: result.metadata,
    };
  }

  private async handleNavigate(
    response: ClaudeResponseNavigate
  ): Promise<BrowserActionResult<BrowserActions.Navigate>> {
    if (!response.url) throw new Error("URL required for navigate action.");
    const options: BrowserActionOptions.Navigate = {
      shouldInitialize: true,
    };
    return await this.browser.navigate(response.url, options);
  }

  private async handleSleep(
    response: ClaudeResponseSleep
  ): Promise<BrowserActionResult<BrowserActions.Sleep>> {
    return await this.browser.sleep(response.duration ?? null);
  }

  private async handleGithubAutomation(
    response: ClaudeResponseGithubAutomation
  ): Promise<BrowserActionResult<BrowserActions.Automation>> {
    const credentials = {
      username: response.username,
      password: response.password,
    };
    return await this.browser.runAutomation(githubAutomation, {
      args: [credentials],
    });
  }

  private async handleMailosaurAutomation(
    response: ClaudeResponseMailosaurAutomation
  ): Promise<BrowserActionResult<BrowserActions.Automation>> {
    const mailosaurAPIKey =
      __shortest__.config?.mailosaur?.apiKey || process.env.MAILOSAUR_API_KEY;
    const mailosaurServerId =
      __shortest__.config?.mailosaur?.serverId ||
      process.env.MAILOSAUR_SERVER_ID;

    if (!response.email)
      throw new Error("Email is requered to perform Mailosaur automation.");

    const mailosaurAutomation = new MailosaurTool({
      apiKey: mailosaurAPIKey,
      serverId: mailosaurServerId,
    });

    return await this.browser.runAutomation(mailosaurAutomation, {
      args: [response.email],
    });
  }

  private async handleClearSession(): Promise<
    BrowserActionResult<BrowserActions.Cleanup>
  > {
    return await this.browser.cleanup();
  }

  private async handleRunCallback(): Promise<
    BrowserActionResult<BrowserActions.Cleanup>
  > {
    return await this.browser.runCallback();
  }
}
