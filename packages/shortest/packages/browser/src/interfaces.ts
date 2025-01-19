import { Browser } from "./browser";

export type ElementIdentifier = string;
export interface BrowserState {
  window: {
    url: string;
    title: string;
    size: { width: number; height: number };
  };
  cursor: {
    position: { x: number; y: number };
  };
}

export enum BrowserActionEnum {
  MouseMove = "mouse_move",
  LeftClick = "left_click",
  LeftClickDrag = "left_click_drag",
  RightClick = "right_click",
  MiddleClick = "middle_click",
  DoubleClick = "double_click",
  Screenshot = "screenshot",
  CursorPosition = "cursor_position",
  GithubLogin = "github_login",
  ClearSession = "clear_session",
  Type = "type",
  Key = "key",
  RunCallback = "run_callback",
  Navigate = "navigate",
  Sleep = "sleep",
  CheckMail = "check_email",
}

export type BrowserAction = `${BrowserActionEnum}`;

export namespace BrowserActionOptions {
  export interface Navigate {
    shouldInitialize: boolean;
  }

  export interface Automation {
    args: any[];
  }
}

export namespace BrowserActions {
  export interface LocateAt {
    element: ElementIdentifier;
  }

  export interface Screenshot {
    base64Image: string; // base64
  }

  export interface GetState {
    state: DeepPartial<BrowserState>;
  }

  export interface Drag {}
  export interface Click {}
  export interface MoveCursor {}

  export interface Navigate {}
  export interface Type {}
  export interface PressKey {}
  export interface Sleep {}
  export interface Automation {
    reason?: string;
  }

  export interface Cleanup {}
  export interface Callback {}
}

export interface BrowserActionResult<
  T extends
    | BrowserActions.LocateAt
    | BrowserActions.Screenshot
    | BrowserActions.GetState
    | BrowserActions.Drag
    | BrowserActions.Click
    | BrowserActions.MoveCursor
    | BrowserActions.Navigate
    | BrowserActions.Type
    | BrowserActions.PressKey
    | BrowserActions.Sleep
    | BrowserActions.Automation
    | BrowserActions.Cleanup
    | BrowserActions.Callback,
> {
  /**
   * One-liner message about the result (will be sent to LLM)
   */
  message: string;

  /**
   * The status of the action. Should be descriptive enough to be used in the LLM
   */
  payload?: T;

  /**
   * Additional metadata that can be used for debugging
   */
  metadata?: {
    browserState?: DeepPartial<BrowserState>;
    [key: string]: any;
  };
}

/**
 * Represents the options required for executing a browser automation task.
 */
export type BrowserAutomationOptions = BrowserActionOptions.Automation;

export interface BrowserAutomationResult {
  success: boolean;
  /**
   * An optional message providing additional details about the outcome,
   * whether it's a success or failure.
   */
  reason?: string;
}
export interface BrowserAutomation {
  /**
   * Executes the automation on the given browser instance.
   * @param browser The browser instance where the automation will be executed.
   * @param options Additional options for the automation, including arguments required for execution.
   * @returns A promise resolving to the result of the automation.
   */
  execute(
    browser: Browser,
    options: Partial<BrowserActionOptions.Automation>
  ): Promise<BrowserAutomationResult>;
}
