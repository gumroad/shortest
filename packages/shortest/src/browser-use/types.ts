export type BrowserAction = 
  | 'mouse_move'
  | 'key'
  | 'type'
  | 'screenshot';

export type MouseButton = 'left' | 'right' | 'middle';
export type ClickCount = 1 | 2;

export interface ActionInput {
  action: BrowserAction;
  coordinates?: [number, number];
  button?: MouseButton;
  clickCount?: ClickCount;
  text?: string;
  key?: string;
  options?: Record<string, any>;
}

export interface BrowserToolOptions {
  timeout?: number;
  screenshot?: boolean;
} 