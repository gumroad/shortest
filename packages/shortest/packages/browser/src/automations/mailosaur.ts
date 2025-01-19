import {
  Browser,
  BrowserAutomation,
  BrowserAutomationOptions,
  BrowserAutomationResult,
} from "@shortest/browser";
import Mailosaur from "mailosaur";

export class MailosaurTool implements BrowserAutomation {
  private client: Mailosaur;
  private serverId: string;

  constructor(config: { apiKey?: string; serverId?: string }) {
    if (!config.apiKey || !config.serverId) {
      throw new Error("Mailosaur configuration missing required fields");
    }

    this.client = new Mailosaur(config.apiKey);
    this.serverId = config.serverId;
  }

  async execute(
    browser: Browser,
    options: BrowserAutomationOptions
  ): Promise<BrowserAutomationResult> {
    const [inbox] = options.args || [];
    if (!inbox)
      return {
        success: false,
      };

    const page = await browser.getCurrentPage()?.context().newPage();
    if (!page)
      return {
        success: false,
      };
    try {
      const email = await this.getLatestEmail(inbox);

      await page.setContent(email.html, {
        waitUntil: "domcontentloaded",
      });

      await page
        .waitForLoadState("load", {
          timeout: 5000,
        })
        .catch((error) => {
          console.log("⚠️ Load timeout, continuing anyway", error);
        });

      return {
        success: true,
        reason: `Email received successfully. Navigated to new tab to display email: ${email.subject}`,
      };
    } catch (error: unknown) {
      await page.close();
      return this.handleError(inbox, error);
    }
  }

  private handleError(inbox: string, error: unknown): BrowserAutomationResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    if (errorMessage.includes("Email content missing")) {
      return {
        success: false,
        reason: `EMAIL_CONTENT_MISSING Email was found but content is missing. This might be due to malformed email. Moving to next test.`,
      };
    }

    if (errorMessage.includes("Mailosaur email address is required")) {
      return {
        success: false,
        reason: `EMAIL_ADDRESS_MISSING Email address is required but was not provided.`,
      };
    }

    if (errorMessage.includes("No matching messages found")) {
      return {
        success: false,
        reason: `EMAIL_NOT_FOUND No email found for ${inbox}. The email might not have been sent yet or is older than 1 hour. Moving to next test.`,
      };
    }

    return {
      success: false,
      reason: "Failed to check email",
    };
  }

  private async getLatestEmail(inbox: string) {
    try {
      const message = await this.client.messages.get(this.serverId, {
        sentTo: inbox,
      });

      if (!message.html?.body || !message.text?.body) {
        throw new Error("Email content missing");
      }

      return {
        subject: message.subject || "No Subject",
        html: message.html.body,
        text: message.text.body,
      };
    } catch (error) {
      throw new Error(`Failed to fetch email: ${error}`);
    }
  }
}
