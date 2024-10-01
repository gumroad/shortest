# Shortest

**[shortest.com](https://shortest.com)**

## Local Development Setup Guide

This guide will help you set up the Shortest project for local development.

### Prerequisites

- Node.js
- pnpm

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/gumroad/shortest.git
   cd shortest
   ```

2. Install dependencies:
   ```bash
   npm install -g pnpm
   pnpm install
   ```

#### For Gumroad Vercel Team Members:
1. Run `vercel env pull` to get the latest environment variables
- https://vercel.com/docs/deployments/local-env#environment-variables-for-local-development

#### For Other Contributors:
1. Duplicate `.env.example` and name it `.env`
2. You will need to manually configure the services as described in the "Services Configuration" section below

#### Set up the database:
   ```bash
   pnpm drizzle-kit generate
   pnpm db:migrate
   pnpm db:seed # creates stripe products, currently unused
   ```

### Services Configuration

You'll need to set up the following services for local development. If you're not a Gumroad Vercel team member, you'll need to manually configure each of these services and add the corresponding environment variables to your `.env.local` file:

<details>
<summary>Clerk</summary>

1. Go to [clerk.com](https://clerk.com) and create a new app.
2. Name it whatever you like and **disable all login methods except GitHub**.
   ![Clerk App Login](https://github.com/user-attachments/assets/1de7aebc-8e9d-431a-ae13-af60635307a1)
3. Once created, copy the environment variables to your `.env.local` file.
   ![Clerk Env Variables](https://github.com/user-attachments/assets/df3381e6-017a-4e01-8bd3-5793e5f5d31e)

</details>

<details>
<summary>Vercel Postgres</summary>

1. Go to your dashboard at [vercel.com](https://vercel.com).
2. Navigate to the Storage tab and click the `Create Database` button.
   ![Vercel Create Database](https://github.com/user-attachments/assets/acdf3ba7-31a6-498b-860c-171018d5ba02)
3. Choose `Postgres` from the `Browse Storage` menu.
   ![Neon Postgres](https://github.com/user-attachments/assets/9ad2a391-5213-4f31-a6c3-b9e54c69bb2e)
4. Copy your environment variables from the `Quickstart` `.env.local` tab.
   ![Vercel Postgres .env.local](https://github.com/user-attachments/assets/e48f1d96-2fd6-4e2e-aaa6-eeb5922cc521)

</details>

<details>
<summary>Anthropic</summary>

1. Go to your dashboard at [anthropic.com](https://anthropic.com) and grab your API Key.
   - Note: If you've never done this before, you will need to answer some questions and likely load your account with a balance. Not much is needed to test the app.
   ![Anthropic API Key](https://github.com/user-attachments/assets/0905ed4b-5815-4d50-bf43-8713a4397674)

</details>

<details>
<summary>Stripe</summary>

1. Go to your `Developers` dashboard at [stripe.com](https://stripe.com).
2. Turn on `Test mode`.
3. Go to the `API Keys` tab and copy your `Secret key`.
   ![Stripe Secret Key](https://github.com/user-attachments/assets/0830b226-f2c2-4b92-a28f-f4682ad03ec0)
4. Go to the terminal of your project and type `pnpm run stripe:webhooks`. It will prompt you to login with a code then give you your `STRIPE_WEBHOOK_SECRET`.
   ![Stripe Webhook Secret](https://github.com/user-attachments/assets/b02531ed-5c31-40ba-8483-32880aa3ca36)

</details>

<details>
<summary>GitHub OAuth</summary>

1. Create a GitHub OAuth App:
   - Go to your GitHub account settings.
   - Navigate to `Developer settings` > `OAuth Apps` > `New OAuth App`.
   - Fill in the application details:
     - **Application name**: Choose any name for your app
     - **Homepage URL**: Set to `http://localhost:3000` for local development
     - **Authorization callback URL**: Use the Clerk-provided callback URL (found in below image)
   ![Github OAuth App](https://github.com/user-attachments/assets/1af635fd-dedc-401c-a45a-159cb20bb209)

2. Configure Clerk with GitHub OAuth:
   - Go to your Clerk dashboard.
   - Navigate to `Configure` > `Social Connections` > `GitHub`.
   - Select `Use custom credentials`
   - Enter your `Client ID` and `Client Secret` from the GitHub OAuth app you just created.
   - Add `repo` to the `Scopes`
   ![Clerk Custom Credentials](https://github.com/user-attachments/assets/31d414e1-4e1e-4725-8649-ec1826c6e53e)

</details>

### Running the Application

Once you have set up the environment variables and installed dependencies, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the app in action.

### Running Tests

To run specs:

```bash
pnpm vitest
```
