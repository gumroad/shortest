/**
 * @fileoverview
 * This file defines interfaces for Claude responses, which represent
 * different types of actions that can be executed in a browser or
 * other automated environments. These interfaces are based on the
 * definitions in the claude-tools file.
 *
 * Additionally, this file includes the type definition for the
 * Claude computer use response type, as described in the official
 * documentation.
 *
 * @see https://docs.anthropic.com/en/docs/build-with-claude/computer-use#computer-tool
 */

export interface ClaudeResponseBase {
  action: string;
}

export interface ClaudeResponseKeyPress extends ClaudeResponseBase {
  action: "key";
  text: string;
}

export interface ClaudeResponseTypeText extends ClaudeResponseBase {
  action: "type";
  text: string;
}

export interface ClaudeResponseMouseMove extends ClaudeResponseBase {
  action: "mouse_move";
  coordinate: [number, number];
}

export interface ClaudeResponseLeftClick extends ClaudeResponseBase {
  action: "left_click";
  coordinate?: [number, number];
}

export interface ClaudeResponseLeftClickDrag extends ClaudeResponseBase {
  action: "left_click_drag";
  coordinate: [number, number];
}

export interface ClaudeResponseRightClick extends ClaudeResponseBase {
  action: "right_click";
}

export interface ClaudeResponseMiddleClick extends ClaudeResponseBase {
  action: "middle_click";
}

export interface ClaudeResponseDoubleClick extends ClaudeResponseBase {
  action: "double_click";
  coordinate?: [number, number];
}

export interface ClaudeResponseScreenshot extends ClaudeResponseBase {
  action: "screenshot";
}

export interface ClaudeResponseCursorPosition extends ClaudeResponseBase {
  action: "cursor_position";
}

export interface ClaudeResponseNavigate extends ClaudeResponseBase {
  action: "navigate";
  url: string;
}

export interface ClaudeResponseSleep extends ClaudeResponseBase {
  action: "sleep";
  duration: number;
}

export interface ClaudeResponseGithubAutomation extends ClaudeResponseBase {
  action: "github_tool";
  username: string;
  password: string;
}

export interface ClaudeResponseMailosaurAutomation extends ClaudeResponseBase {
  action: "check_email";
  email: string;
}

export interface ClaudeResponseClearSession extends ClaudeResponseBase {
  action: "clear_session";
}

export interface ClaudeResponseCallback extends ClaudeResponseBase {
  action: "run_callback";
}

export interface ClaudeResponseVerbose extends ClaudeResponseBase {
  action: string;
  [key: string]: any;
}

export type ClaudeResponse =
  | ClaudeResponseKeyPress
  | ClaudeResponseTypeText
  | ClaudeResponseMouseMove
  | ClaudeResponseLeftClick
  | ClaudeResponseLeftClickDrag
  | ClaudeResponseRightClick
  | ClaudeResponseMiddleClick
  | ClaudeResponseDoubleClick
  | ClaudeResponseScreenshot
  | ClaudeResponseCursorPosition
  | ClaudeResponseNavigate
  | ClaudeResponseSleep
  | ClaudeResponseGithubAutomation
  | ClaudeResponseMailosaurAutomation
  | ClaudeResponseClearSession
  | ClaudeResponseCallback;
