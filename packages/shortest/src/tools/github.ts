import { authenticator } from 'otplib';
import dotenv from 'dotenv';

export class GitHubTool {
  private totpSecret: string;

  constructor() {
    dotenv.config();
    this.totpSecret = process.env.GITHUB_TOTP_SECRET || '';
    
    if (!this.totpSecret) {
      throw new Error('GITHUB_TOTP_SECRET is required in .env file');
    }
  }

  generateTOTPCode(): string {
    try {
      return authenticator.generate(this.totpSecret);
    } catch (error) {
      throw new Error(`Failed to generate TOTP code: ${error}`);
    }
  }
}
