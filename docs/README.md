# Shortest

[![npm version](https://badge.fury.io/js/shortest.svg)](https://badge.fury.io/js/shortest)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)

> 🤖 An AI-powered E2E testing framework that uses natural language to write and execute tests.

## ✨ Features

- 🤖 AI-powered test execution
- 📝 Natural language test definitions
- 🔄 Automatic retry and error recovery
- 📸 Automatic screenshots
- 🖱️ Visual mouse tracking
- 📊 Detailed test reports

## 📦 Installation

Choose your preferred package manager:

```bash
# pnpm
pnpm add -D shortest

# npm
npm install --save-dev shortest

# yarn
yarn add -D shortest
```

## 🏃‍♂️ Running Tests

```bash
# Run all tests
pnpm shortest

# Run specific test file
pnpm shortest login.test
```

## 🛠️ Setup Shortest Cli
```bash
# packages/shortest
cd packages/shortest
pnpm link --global

# root
cd ../..
pnpm link --global shortest
```


## 🛠️ Setup

### 1. Create Configuration File

Create a `shortest.config.ts` in your project root:

```typescript
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
```

### 2. Set Environment Variables

Add to `.env.local`:

```bash
ANTHROPIC_API_KEY=your_api_key_here
```

### 3. Add Test Script

Update `package.json`:

```json
{
  "scripts": {
    "test": "shortest"
  }
}
```

## 📝 Writing Tests

Tests are written in TypeScript using a simple, declarative API.

### Basic Login Test

```typescript
import { define, UITestBuilder } from 'shortest';

interface LoginState {
  username: string;
  password: string;
}

define('Validate login feature', () => {
  new UITestBuilder<LoginState>('/')
    .test('Login with valid credentials')
    .given('username and password', { 
      username: 'test@example.com', 
      password: 'password123' 
    })
    .expect('should redirect to /dashboard');
});
```

### Multiple Test Cases

```typescript
define('Validate login feature', () => {
  new UITestBuilder<LoginState>('/')
    .test('Login with valid credentials')
    .given('username and password', { 
      username: 'test@example.com', 
      password: 'password123' 
    })
    .expect('should redirect to /dashboard');

  new UITestBuilder<LoginState>('/')
    .test('Login with invalid credentials')
    .given('username and password', { 
      username: 'wrong@example.com', 
      password: 'wrongpass' 
    })
    .expect('should show error message');
});
```

### OAuth Tests

```typescript
define('Validate OAuth login', () => {
  new UITestBuilder('/')
    .test('Login with Github')
    .given('click Github login button')
    .expect('should complete OAuth flow')
    .expect('should redirect to /dashboard');
});
```

## ⚙️ Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `browsers` | Browser configurations | `[{ name: 'chrome', headless: false }]` |
| `baseUrl` | Base URL for tests | `http://localhost:3000` |
| `testDir` | Test file locations | `['app/__tests__']` |
| `ai.apiKey` | Anthropic API key | Required |
| `ai.model` | Claude model version | `claude-3-5-sonnet-20241022` |

## 📄 License

[MIT](LICENSE) © Shortest

---
<div align="center">
Made with ❤️ for the testing community
</div>