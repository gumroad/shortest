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
  | "clear_session";

export interface ToolResult {
  output?: string;
  error?: string;
  base64_image?: string;
  system?: string;
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

export interface BrowserToolOptions {
  width: number;
  height: number;
  displayNum?: number;
  screenshotDelay?: number;
}

export type ActionInput = {
  action: 'mouse_move' | 'left_click' | 'right_click' | 'middle_click' | 
          'double_click' | 'left_click_drag' | 'cursor_position' | 
          'screenshot' | 'type' | 'key' | 'github_login' | 'clear_session';
  coordinates?: number[];
  text?: string;
  username?: string;
  password?: string;
};

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