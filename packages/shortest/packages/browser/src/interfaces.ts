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
