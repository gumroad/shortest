import { authenticator } from 'otplib';
import dotenv from 'dotenv';

export class GitHubTool {
  private totpSecret: string;

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
}
