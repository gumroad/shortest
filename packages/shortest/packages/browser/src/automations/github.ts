import {
  Browser,
  BrowserAutomation,
  BrowserAutomationOptions,
} from "@shortest/browser";
import dotenv from "dotenv";
import { authenticator } from "otplib";

export class GitHubTool implements BrowserAutomation {
  private totpSecret: string;
  private readonly selectors = {
    loginForm: "#login form",
    usernameInput: "#login_field",
    passwordInput: "#password",
    submitButton: '[type="submit"]',
    useAuthenticatorButton: 'button:has-text("Use authenticator")',
    useAuthenticatorLink: '[data-test-selector="totp-app-link"]',
    otpInput: "#app_totp",
    errorMessage: ".flash-error",
  };

  constructor(secret?: string) {
    dotenv.config({ path: ".env.local" });
    dotenv.config({ path: ".env" });

    this.totpSecret = secret || process.env.GITHUB_TOTP_SECRET || "";

    if (!this.totpSecret) {
      throw new Error(
        "GITHUB_TOTP_SECRET is required in .env file or via --secret flag"
      );
    }
  }

  private validateSecret() {
    if (!this.totpSecret) {
      throw new Error(
        "GITHUB_TOTP_SECRET is required in .env file or via --secret flag"
      );
    }
  }

  generateTOTPCode(): { code: string; timeRemaining: number } {
    this.validateSecret();
    try {
      const code = authenticator.generate(this.totpSecret);
      const timeRemaining = authenticator.timeRemaining();
      return { code, timeRemaining };
    } catch (error) {
      throw new Error(`Failed to generate TOTP code: ${error}`);
    }
  }

  async execute(browser: Browser, options: BrowserAutomationOptions) {
    const [credentials] = options.args;
    const page = browser.getCurrentPage();
    if (!page)
      return {
        success: false,
      };
    try {
      // Wait for login form
      await page.waitForSelector(this.selectors.loginForm, {
        timeout: 10000,
      });

      // Fill credentials
      await page.fill(this.selectors.usernameInput, credentials.username);
      await page.fill(this.selectors.passwordInput, credentials.password);

      // Submit form
      await page.click(this.selectors.submitButton);

      try {
        await page.waitForSelector(this.selectors.useAuthenticatorButton, {
          timeout: 5000,
        });
        await page.click(this.selectors.useAuthenticatorButton);
      } catch {
        // If button not found, try the link
        await page.waitForSelector(this.selectors.useAuthenticatorLink, {
          timeout: 5000,
        });
        await page.click(this.selectors.useAuthenticatorLink);
      }

      // Wait for OTP input to be visible
      await page.waitForSelector(this.selectors.otpInput, {
        timeout: 1000,
      });

      // Generate and enter TOTP code
      const { code } = this.generateTOTPCode();
      await page.fill(this.selectors.otpInput, code);

      // Start navigation promise before pressing Enter
      const navigationPromise = page.waitForNavigation({
        timeout: 3000,
      });

      // Press Enter and wait for navigation
      await page.press(this.selectors.otpInput, "Enter");
      await navigationPromise;

      const isLoggedIn = (await page.$(this.selectors.loginForm)) === null;

      return {
        success: isLoggedIn,
        error: isLoggedIn ? undefined : "Failed to verify login success",
      };
    } catch (error) {
      // Check if we're actually logged in despite the error
      try {
        const currentUrl = await page.url();
        if (!currentUrl.includes("github.com")) {
          return {
            success: true,
          };
        }
      } catch {
        // Ignore URL check errors
      }

      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown error during GitHub login",
      };
    }
  }
}

export const githubAutomation = new GitHubTool();
