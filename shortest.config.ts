import type { ShortestConfig } from 'shortest';

export default {
  browsers: [
    { name: 'chrome', headless: false }
  ],
  baseUrl: 'http://localhost:3000',
  testDir: ['app/__tests__'],
  ai: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: 'claude-3-5-sonnet-20241022'
  }
} satisfies ShortestConfig; 