import { BrowserConfig } from './browser';
import { AIConfig } from './ai';

export interface ShortestConfig {
  headless?: boolean;
  baseUrl?: string;
  testDir?: string | string[];
  anthropicKey?: string;
}

export const defaultConfig: ShortestConfig = {
  headless: false,
  baseUrl: 'http://localhost:3000',
  testDir: '__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY
}; 