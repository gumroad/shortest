/**
 * This file should be eventually deleted and all the functions should be moved to /core/web-browser impl
 */

import { Page } from "playwright";

export const keyboardShortcuts: Record<string, string | string[]> = {
  "ctrl+l": ["Control", "l"],
  "ctrl+a": ["Control", "a"],
  "ctrl+c": ["Control", "c"],
  "ctrl+v": ["Control", "v"],
  "alt+tab": ["Alt", "Tab"],
  return: ["Enter"],
  enter: ["Enter"],
  esc: ["Escape"],
  tab: ["Tab"],
  delete: ["Delete"],
  backspace: ["Backspace"],
  space: [" "],
  arrowup: ["ArrowUp"],
  arrowdown: ["ArrowDown"],
  arrowleft: ["ArrowLeft"],
  arrowright: ["ArrowRight"],
  page_down: ["PageDown"],
  page_up: ["PageUp"],
};

export const scaleRatio = {
  x: 1543 / 1170,
  y: 32 / 24,
};

export async function mouseMove(
  page: Page,
  x: number,
  y: number
): Promise<void> {
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    throw new Error("Coordinates must be non-negative integers");
  }

  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);

  await page.mouse.move(scaledX, scaledY);

  // Update visual cursor
  await page.evaluate(
    ({ x, y }) => {
      const cursor = document.getElementById("ai-cursor");
      const trail = document.getElementById("ai-cursor-trail");
      if (cursor && trail) {
        window.cursorPosition = { x, y };
        cursor.style.left = `${x}px`;
        cursor.style.top = `${y}px`;

        setTimeout(() => {
          trail.style.left = `${x}px`;
          trail.style.top = `${y}px`;
        }, 50);
      }
    },
    { x: scaledX, y: scaledY }
  );

  await page.waitForTimeout(50);
}

export async function click(page: Page, x: number, y: number): Promise<void> {
  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);

  await mouseMove(page, x, y);
  await page.mouse.click(scaledX, scaledY);
  // await showClickAnimation(page, "left");
}

export async function dragMouse(
  page: Page,
  x: number,
  y: number
): Promise<void> {
  const scaledX = Math.round(x * scaleRatio.x);
  const scaledY = Math.round(y * scaleRatio.y);

  await page.mouse.down();
  await page.mouse.move(scaledX, scaledY);
  await page.mouse.up();
}

export async function showClickAnimation(
  page: Page,
  type: "left" | "right" | "double" = "left"
): Promise<void> {
  await page.evaluate((clickType) => {
    const cursor = document.getElementById("ai-cursor");
    if (cursor) {
      cursor.classList.add("clicking");

      switch (clickType) {
        case "double":
          cursor.style.transform = "translate(-50%, -50%) scale(0.7)";
          cursor.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
          break;
        case "right":
          cursor.style.borderColor = "blue";
          break;
        default:
          cursor.style.transform = "translate(-50%, -50%) scale(0.8)";
      }

      setTimeout(() => {
        cursor.classList.remove("clicking");
        cursor.style.transform = "translate(-50%, -50%) scale(1)";
        cursor.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
        cursor.style.borderColor = "red";
      }, 200);
    }
  }, type);
}

export async function getCursorPosition(page: Page): Promise<[number, number]> {
  const position = await page.evaluate(() => {
    return window.cursorPosition || { x: 0, y: 0 };
  });
  return [position.x, position.y];
}

export async function initializeCursor(page: Page): Promise<void> {
  try {
    // Simpler check for page readiness
    await page
      .waitForLoadState("domcontentloaded", { timeout: 1000 })
      .catch(() => {});

    // Add styles only if they don't exist
    const hasStyles = await page
      .evaluate(() => {
        return !!document.querySelector("style[data-shortest-cursor]");
      })
      .catch(() => false);

    if (!hasStyles) {
      // Create style element directly in evaluate
      await page.evaluate(() => {
        const style = document.createElement("style");
        style.setAttribute("data-shortest-cursor", "true");
        style.textContent = `
          #ai-cursor {
            width: 20px;
            height: 20px;
            border: 2px solid red;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 999999;
            transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
            transform: translate(-50%, -50%);
            background-color: rgba(255, 0, 0, 0.2);
          }
          #ai-cursor.clicking {
            transform: translate(-50%, -50%) scale(0.8);
            background-color: rgba(255, 0, 0, 0.4);
          }
          #ai-cursor-trail {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            position: fixed;
            pointer-events: none;
            z-index: 999998;
            background-color: rgba(255, 0, 0, 0.1);
            transition: all 0.1s linear;
            transform: translate(-50%, -50%);
          }
        `;
        document.head.appendChild(style);
      });
    }

    // Initialize cursor elements with position persistence
    await page.evaluate(() => {
      if (!document.getElementById("ai-cursor")) {
        const cursor = document.createElement("div");
        cursor.id = "ai-cursor";
        document.body.appendChild(cursor);

        const trail = document.createElement("div");
        trail.id = "ai-cursor-trail";
        document.body.appendChild(trail);

        // Restore or initialize position
        window.cursorPosition = window.cursorPosition || { x: 0, y: 0 };
        window.lastPosition = window.lastPosition || { x: 0, y: 0 };

        // Set initial position
        cursor.style.left = window.cursorPosition.x + "px";
        cursor.style.top = window.cursorPosition.y + "px";
        trail.style.left = window.cursorPosition.x + "px";
        trail.style.top = window.cursorPosition.y + "px";

        // Update handler
        const updateCursor = (x: number, y: number) => {
          window.cursorPosition = { x, y };
          cursor.style.left = `${x}px`;
          cursor.style.top = `${y}px`;

          requestAnimationFrame(() => {
            trail.style.left = `${x}px`;
            trail.style.top = `${y}px`;
          });
        };

        document.addEventListener("mousemove", (e) => {
          window.lastPosition = window.cursorPosition;
          updateCursor(e.clientX, e.clientY);
        });
      }
    });
  } catch (error) {
    if (
      error instanceof Error &&
      !error.message.includes("context was destroyed") &&
      !error.message.includes("Target closed")
    ) {
      console.warn("Cursor initialization failed:", error);
    }
  }
}
