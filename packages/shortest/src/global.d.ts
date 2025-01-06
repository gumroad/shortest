import { Expect } from "expect";
import { Driver } from "./core/driver/driver";
import { ShortestConfig, TestFunction } from "./types";
import pw from "playwright";
import wdio from "webdriverio";

declare global {
  var __shortest__: Partial<{
    driver: Driver<pw.Browser | wdio.Browser>;
    config: ShortestConfig;

    expect: Expect;
    registry: {
      tests: Map<string, TestFunction[]>;
      currentFileTests: TestFunction[];
      beforeAllFns: TestFunction[];
      afterAllFns: TestFunction[];
      beforeEachFns: TestFunction[];
      afterEachFns: TestFunction[];
      directTestCounter: number;
    };
  }>;

  type DeepPartial<T> = T extends object
    ? {
        [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

  type MethodKeys<T> = {
    [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never;
  }[keyof T];

  interface Window {
    cursorPosition: { x: number; y: number };
    lastPosition: { x: number; y: number };
  }
}

// NOTE do not remove this line
// it tells TypeScript that this file is a module
export {};
