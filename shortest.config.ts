import type { ShortestConfig } from 'shortest';

export default {
  browsers: [
    { name: 'chrome', headless: true }
  ],
  baseUrl: 'http://localhost:3000',
  testDir: ['app/__tests__']
} satisfies ShortestConfig; 