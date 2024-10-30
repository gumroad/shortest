import type { ShortestConfig } from 'shortest';

export default {
  browsers: [
    { name: 'chrome', headless: true },
    { name: 'firefox', headless: false }
  ],
  baseUrl: 'http://localhost:3000',
  testDir: ['src/__tests__']
} satisfies ShortestConfig; 