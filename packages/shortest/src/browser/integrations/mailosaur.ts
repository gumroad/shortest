import Mailosaur from "mailosaur";

export class MailosaurTool {
  private client: Mailosaur;
  private serverId: string;
  private emailAddress: string;

  constructor(config: {
    apiKey: string;
    serverId: string;
    emailAddress?: string;
  }) {
    if (!config.apiKey || !config.serverId) {
      throw new Error("Mailosaur configuration missing required fields");
    } else if (!config.emailAddress) {
      throw new Error("Mailosaur email address is required");
    }

    this.client = new Mailosaur(config.apiKey);
    this.serverId = config.serverId;
    this.emailAddress = config.emailAddress;
  }

  async getLatestEmail() {
    try {
      const message = await this.client.messages.get(this.serverId, {
        sentTo: this.emailAddress,
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
