# Shortest

AI-powered natural language end-to-end testing framework.

## Features
- Natural language test writing
- AI-powered test execution using Claude computer use API
- Built on Playwright
- GitHub integration with 2FA support

## Installation
```bash
npm install @antiwork/shortest
# or
pnpm add @antiwork/shortest
# or
yarn add @antiwork/shortest
```

## Quick Start

1. Determine your test entry and add your Anthropic API key in config file: `shortest.config.ts`

```typescript
import type { ShortestConfig } from '@antiwork/shortest';

export default {
  headless: false,
  baseUrl: 'http://localhost:3000',
  testDir: 'app/__tests__',
  anthropicKey: process.env.ANTHROPIC_API_KEY
} satisfies ShortestConfig; 
```

2. Write your test in the test directory: `app/__tests__/login.test.ts`
```typescript
import { test } from '@antiwork/shortest'

const loginCredentials = {
  email: process.env.EMAIL,
  password: process.env.PASSWORD,
}

test('Login to the app using email and password', githubCredentials)
```

## Running Tests
```bash
shortest                    # Run all tests
shortest login.test.ts     # Run specific test
shortest --headless        # Run in headless mode using cli
```

## GitHub 2FA Login Setup
Shortest currently supports login using Github 2FA. For GitHub authentication tests:
1. Get OTP secret from GitHub settings > Security > 2FA
2. Add secret to `.env.local` or use CLI:
3. After generating OTP code you can enter it in Github OTP section and shortest will be able to use OTP code to login.

```bash
shortest --github-code --secret=<OTP_SECRET>
```

## Environment Setup
Required in `.env.local`:
```bash
ANTHROPIC_API_KEY=your_api_key
GITHUB_TOTP_SECRET=your_secret  # Only for GitHub auth tests
```

## CI Setup
You can run shortest in your CI/CD pipeline by running tests in headless mode. Make sure to add your Anthropic API key to your CI/CD pipeline secrets.

## Documentation
Visit [GitHub](https://github.com/anti-work/shortest) for detailed docs