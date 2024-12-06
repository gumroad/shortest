# Contributing to Shortest

Thanks for your interest in contributing! This document will help you get started.

## Development Setup

1. Clone and Install
```bash
git clone https://github.com/anti-work/shortest.git
cd shortest
pnpm install
```

2. Setup CLI Locally
```bash
cd packages/shortest
pnpm link --global
cd ../..
pnpm link --global shortest
```

3. Environment Setup
```bash
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
```

## Development Workflow

1. Create a new branch
```bash
git checkout -b feature/your-feature
```

2. Run Tests
```bash
pnpm test:ai
pnpm test:browser
pnpm test:coordinates
pnpm test:github
pnpm test:assertion
```

3. Build Package
```bash
pnpm build:pkg
```

## Pull Request Process

1. Bump the version if needed
2. Update documentation if needed
3. Add or update tests
4. Update CHANGELOG.md
5. Ensure all tests pass
6. Request review

## Code Style

- Use TypeScript
- Follow existing code style
- Use meaningful variable names

## Commit Messages

Format: `type(scope): message`

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation
- chore: Maintenance
- test: Tests
- refactor: Code refactoring

Example:
```
feat(browser): add support for iframe handling
```

## Need Help?

- Open an issue for bugs
- Start a discussion for features
- Check existing issues and PRs 