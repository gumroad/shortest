# Shortest

**[shortest.com](https://shortest.com)**

## Local Development Setup Guide

This guide will help you set up the Shortest web app for local development.

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
1. Run `pnpm run setup` to configure the environment variables.
2. The setup wizard will ask you for information. Refer to "Services Configuration" section below for more details.

#### Set up the database:
   ```bash
   pnpm drizzle-kit generate
   pnpm db:migrate
   pnpm db:seed # creates stripe products, currently unused
   ```

### Services Configuration

You'll need to set up the following services for local development. If you're not a Gumroad Vercel team member, you'll need to either run the setup wizard `pnpm run setup` or manually configure each of these services and add the corresponding environment variables to your `.env.local` file:

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
   - Navigate to `Configure` > `SSO Connections` > `GitHub`.
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

To run unit tests:

```bash
pnpm vitest
```


## Setup Guide for Running and Building Shortest Package Locally
   
When running `pnpm install` in the root, the `shortest` package will be built and added in the `node_modules` folder. However, in order to use the cli, you need to setup the cli locally as follows:

# to install shortest package
pnpm install
```

### Setup Shortest CLI
```bash
# packages/shortest
cd packages/shortest
pnpm link --global

# root
cd ../..
pnpm link --global shortest
```

## Run Tests
You can either run tests using the `shortest` cli:
```bash
shortest
```

or use the `pnpm` command:

```bash
pnpm test
```

## Testing Github MFA Login Flow with Shortest
To test Github MFA login in a browser, you need to register Shortest as an OTP provider and add the OTP secret to your `.env.local` file:

1. Go to your repository settings
2. Navigate to "Password and Authentication"
3. Click on "Authenticator App"
4. Select "Use your authenticator app"
5. Click "Setup key" to obtain the OTP secret
6. Add the OTP secret to your `.env.local` file or use the Shortest CLI to add it
7. Enter the 2FA code displayed in your terminal into Github's Authenticator setup page to complete the process
```bash
shortest --github-code --secret=<OTP_SECRET>
```


## To run tests in Github workflows

prerequisites:

- Add ANTHROPIC_API_KEY to your repo secrets
- Connect your repo to Vercel

### To add ANTHROPIC_API_KEY to your repo secrets:

- Go to your repo settings
- Navigate to `Security`
- Click `Add secret`
- Add the ANTHROPIC_API_KEY environment variable

