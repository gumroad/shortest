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

export namespace BrowserActionOptions {
  export interface Navigate {
    shoultInitialize: boolean;
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
    | BrowserActions.Sleep,
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
   * @default Pauses for 1 minute if no duration is provided.
   */
  abstract sleep(
    ms: number | null
  ): Promise<BrowserActionResult<BrowserActions.Sleep>>;

  abstract cleanup(): Promise<void>;
  abstract destroy(): Promise<void>;
}
