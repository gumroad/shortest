export interface BrowserConfig {
  name: 'chrome' | 'firefox' | 'safari' | 'edge';
  headless?: boolean;
}

export interface ShortestConfig {
  browsers?: BrowserConfig[];
  baseUrl?: string;
  testDir?: string | string[];
}

export const defaultConfig: ShortestConfig = {
  browsers: [{ name: 'chrome', headless: true }],
  baseUrl: 'http://localhost:3000',
  testDir: 'tests'
}; 