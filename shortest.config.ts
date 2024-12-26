import type { ShortestConfig } from '@antiwork/shortest';

export default {
  headless: false,
  baseUrl: 'https://helper.ai/',
  testDir: 'app/__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  mailosaur: {
    apiKey: process.env.MAILOSAUR_API_KEY,
    serverId: process.env.MAILOSAUR_SERVER_ID
  },
} satisfies ShortestConfig; 
