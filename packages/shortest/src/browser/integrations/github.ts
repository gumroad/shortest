import { authenticator } from 'otplib';
import dotenv from 'dotenv';
import { BrowserTool } from '../browser';

export class GitHubTool {
  private totpSecret: string;
  private readonly selectors = {
    loginForm: '#login form',
    usernameInput: '#login_field',
    passwordInput: '#password',
    submitButton: '[type="submit"]',
    useAuthenticatorButton: 'button:has-text("Use authenticator")',
    useAuthenticatorLink: '[data-test-selector="totp-app-link"]',
    otpInput: '#app_totp',
    errorMessage: '.flash-error'
  };

  constructor(secret?: string) {
    dotenv.config({ path: '.env.local' });
    dotenv.config({ path: '.env' });
    
    this.totpSecret = secret || process.env.GITHUB_TOTP_SECRET || '';
    
    if (!this.totpSecret) {
      throw new Error('GITHUB_TOTP_SECRET is required in .env file or via --secret flag');
    }
  }

  generateTOTPCode(): { code: string; timeRemaining: number } {
    try {
      const code = authenticator.generate(this.totpSecret);
      const timeRemaining = authenticator.timeRemaining();
      return { code, timeRemaining };
    } catch (error) {
      throw new Error(`Failed to generate TOTP code: ${error}`);
    }
  }

  async GithubLogin(browserTool: BrowserTool, credentials: { username: string; password: string }): Promise<{ success: boolean; error?: string }> {
    try {
      // Wait for login form
      await browserTool.waitForSelector(this.selectors.loginForm, { timeout: 10000 });
      
      // Fill credentials
      await browserTool.fill(this.selectors.usernameInput, credentials.username);
      await browserTool.fill(this.selectors.passwordInput, credentials.password);
      
      // Submit form
      await browserTool.click(this.selectors.submitButton);
      
      // Handle both 2FA paths
      try {
        // First try the button
        await browserTool.waitForSelector(this.selectors.useAuthenticatorButton, { timeout: 5000 });
        await browserTool.click(this.selectors.useAuthenticatorButton);
      } catch {
        // If button not found, try the link
        await browserTool.waitForSelector(this.selectors.useAuthenticatorLink, { timeout: 5000 });
        await browserTool.click(this.selectors.useAuthenticatorLink);
      }
      
      // Wait for OTP input to be visible
      await browserTool.waitForSelector(this.selectors.otpInput, { timeout: 10000 });
      
      // Generate and enter TOTP code
      const { code } = this.generateTOTPCode();
      await browserTool.fill(this.selectors.otpInput, code);
      await browserTool.press(this.selectors.otpInput, 'Enter');
      
      // Check for errors
      const errorElement = await browserTool.findElement(this.selectors.errorMessage);
      if (errorElement) {
        const errorText = await errorElement.textContent();
        return { success: false, error: errorText || 'Unknown error' };
      }
      
      // Wait for navigation after successful login
      await browserTool.waitForNavigation({ timeout: 100 }); 
      return { success: true };
      
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during GitHub login'
      };
    }
  }
}

export const githubTool = new GitHubTool();
