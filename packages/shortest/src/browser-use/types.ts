export type BrowserAction = 
  | 'mouse_move'
  | 'key'
  | 'type'
  | 'screenshot'
  | 'new_tab'
  | 'close_tab'
  | 'switch_tab'
  | 'list_tabs';

export type MouseButton = 'left' | 'right' | 'middle';
export type ClickCount = 1 | 2;

export interface ActionInput {
  action: BrowserAction;
  coordinates?: [number, number];
  button?: MouseButton;
  clickCount?: ClickCount;
  text?: string;
  key?: string;
  url?: string;
  tabId?: string;
}

export interface BrowserToolOptions {
  timeout?: number;
  screenshot?: boolean;
} 