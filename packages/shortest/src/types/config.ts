import { BrowserConfig } from './browser';
import { AIConfig } from './ai';

export interface ShortestConfig {
  browsers?: BrowserConfig[];
  baseUrl?: string;
  testDir?: string | string[];
  ai?: AIConfig;
}

export const defaultConfig: ShortestConfig = {
  browsers: [{ name: 'chrome', headless: false }],
  baseUrl: 'http://localhost:3000',
  testDir: '__tests__',
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || ''
  }
}; 