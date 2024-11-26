import type { UITestBuilderInterface } from './ui-test-builder';
import type { Expect } from 'expect';

export interface ShortestGlobals {
  define: (name: string, fn: () => void | Promise<void>) => void;
  expect: Expect;
  registry: {
    suites: Map<string, UITestBuilderInterface[]>;
    currentSuite: string | null;
    beforeAllFns: (() => Promise<void> | void)[];
    afterAllFns: (() => Promise<void> | void)[];
  };
} 