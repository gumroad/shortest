# Shortest app

**[shortest.com](shortest.com)**

## Getting started

```bash
npm install -g pnpm
pnpm install
pnpm drizzle-kit generate
pnpm db:migrate
pnpm db:seed # creates stripe products, currently unused
```

Run `vercel env pull .env.development.local` to make the latest environment variables available to your project locally.

## Running locally

Once you have set up the environment variables and installed dependencies, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

## Running tests

To run specs:

```bash
pnpm vitest
```
