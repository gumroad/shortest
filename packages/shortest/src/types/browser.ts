import { TestContext } from "./test";

export type BrowserAction = 
  | "mouse_move"
  | "left_click"
  | "left_click_drag"
  | "right_click"
  | "middle_click"
  | "double_click"
  | "screenshot"
  | "cursor_position"
  | "github_login"
  | "clear_session"
  | "type"
  | "key"
  | "run_callback";

export interface BrowserToolOptions {
  width: number;
  height: number;
  displayNum?: number;
  screenshotDelay?: number;
}

export interface ActionInput {
  action: BrowserAction;
  coordinates?: number[];
  text?: string;
  username?: string;
  password?: string;
}

export interface ToolResult {
  output?: string;
  error?: string;
  base64_image?: string;
  metadata?: {
    window_info?: {
      url: string;
      title: string;
      size: { width: number; height: number }
    };
    cursor_info?: {
      position: [number, number];
      visible: boolean;
    };
  };
}

export interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'safari' | 'edge';
  headless?: boolean;
  width?: number;
  height?: number;
  displayNum?: number;
}

export interface BrowserToolConfig {
  width: number;
  height: number;
  testContext?: TestContext;
}

export type BetaToolType = 
  | "computer_20241022"
  | "text_editor_20241022"
  | "bash_20241022";

export interface BetaToolParams {
  type: BetaToolType;
  name: string;
  display_width_px?: number;
  display_height_px?: number;
  display_number?: number;
}