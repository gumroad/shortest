# Shortest

AI-powered natural language end-to-end testing framework.

## Features
- Natural language test writing
- AI-powered test execution using Claude
- Built on Playwright
- GitHub integration with 2FA support
- Automatic retry and error handling

## Installation
```bash
npm install shortest
# or
pnpm add shortest
# or
yarn add shortest
```

## Quick Start
```typescript
import { define } from 'shortest'

define('Login Flow', () => {
  test('User can login')
    .given('I am on the login page')
    .when('I enter my credentials')
    .expect('I should be logged in')
})
```

## Environment Setup
Required in `.env.local`:
```bash
ANTHROPIC_API_KEY=your_api_key
GITHUB_TOTP_SECRET=your_secret  # Only for GitHub auth tests
```

## Running Tests
```bash
shortest                    # Run all tests
shortest login.test.ts     # Run specific test
shortest --headless        # Run in headless mode
```

## GitHub 2FA Setup
For GitHub authentication tests:
1. Get OTP secret from GitHub settings > Security > 2FA
2. Add secret to `.env.local` or use CLI:
```bash
shortest --github-code --secret=<OTP_SECRET>
```

## CI Setup
1. Add `ANTHROPIC_API_KEY` to repo secrets
2. Use provided GitHub Actions workflow

## Documentation
Visit [GitHub](https://github.com/anti-work/shortest) for detailed docs