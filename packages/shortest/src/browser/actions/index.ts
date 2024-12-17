import { Page } from 'playwright';
import { ToolError } from '../core';

export const keyboardShortcuts: Record<string, string | string[]> = {
  'ctrl+l': ['Control', 'l'],
  'ctrl+a': ['Control', 'a'],
  'ctrl+c': ['Control', 'c'],
  'ctrl+v': ['Control', 'v'],
  'alt+tab': ['Alt', 'Tab'],
  'return': ['Enter'],
  'enter': ['Enter'],
  'esc': ['Escape'],
  'tab': ['Tab'],
  'delete': ['Delete'],
  'backspace': ['Backspace'],
  'space': [' '],
  'arrowup': ['ArrowUp'],
  'arrowdown': ['ArrowDown'],
  'arrowleft': ['ArrowLeft'],
  'arrowright': ['ArrowRight'],
  'page_down': ['PageDown'],
  'page_up': ['PageUp']
};

export const scaleRatio = {
  x: 1543 / 1170,  // ≈ 1.318
  y: 32 / 24       // ≈ 1.333
};

export async function mouseMove(page: Page, x: number, y: number): Promise<void> {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    throw new ToolError('Coordinates must be non-negative integers');
  }
  
  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);
  
  await page.mouse.move(scaledX, scaledY);
  await page.waitForTimeout(100);
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);
  
  await mouseMove(page, x, y);
  await page.mouse.click(scaledX, scaledY);
  await showClickAnimation(page);
}

export async function dragMouse(page: Page, x: number, y: number): Promise<void> {
  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);
  
  await page.mouse.down();
  await page.mouse.move(scaledX, scaledY);
  await page.mouse.up();
}

export async function showClickAnimation(page: Page): Promise<void> {
  try {
    await page.evaluate(() => {
      const cursor = document.getElementById('ai-cursor');
      if (cursor) {
        cursor.style.transform = 'translate(-50%, -50%) scale(0.8)';
        setTimeout(() => {
          cursor.style.transform = 'translate(-50%, -50%) scale(1)';
        }, 100);
      }
    });
  } catch (error) {
    // fail silently
  }
}

export async function getCursorPosition(page: Page): Promise<[number, number]> {
  const position = await page.evaluate(() => {
    return window.cursorPosition || { x: 0, y: 0 };
  });
  return [position.x, position.y];
}
