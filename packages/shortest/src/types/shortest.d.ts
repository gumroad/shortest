import type { Expect } from 'expect';
import type { ShortestGlobals } from './globals';

// Extend the global scope
declare global {
  export const define: (name: string, fn: () => void | Promise<void>) => void;
  export const expect: Expect;
  export const __shortest__: ShortestGlobals;
}

// Extend NodeJS.Global
declare module 'node' {
  interface Global {
    define: (name: string, fn: () => void | Promise<void>) => void;
    expect: Expect;
    __shortest__: ShortestGlobals;
  }
}

export {}; 