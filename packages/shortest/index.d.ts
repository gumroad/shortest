import type { Expect } from 'expect';
import type { Page } from 'playwright';
import type { TestAPI, TestContext } from './dist/types/test';
import type { ShortestConfig } from './dist/types/config';

declare global {
  const expect: Expect;
}

declare module '@antiwork/shortest' {
  export const test: TestAPI;
  export { TestContext, Page };
  export type { ShortestConfig };
} 