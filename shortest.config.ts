import type { ShortestConfig } from '@antiwork/shortest';

export default {
  browsers: [
    { name: 'chrome', headless: true }
  ],
  baseUrl: 'http://localhost:3000',
  testDir: ['app/__tests__'],
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || ''
  }
} satisfies ShortestConfig; 