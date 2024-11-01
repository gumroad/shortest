export type BrowserAction = 
  | 'click'
  | 'type'
  | 'screenshot';

export type ClickType = 'left' | 'right' | 'double';

export interface ActionInput {
  action: BrowserAction;
  coordinates?: [number, number];
  clickType?: ClickType;
  text?: string;
  options?: Record<string, any>;
}

export interface BrowserToolOptions {
  timeout?: number;
  screenshot?: boolean;
} 