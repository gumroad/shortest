import { shortest } from "@antiwork/shortest";

shortest("Login to the app using Github login", {
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD
})

shortest("Validate end users can receive emails")
  .expect("Click on the yellow/orange circular send icon (play button-like icon)")
  .expect("Send test email to deep-mighty@taoyeoeo.mailosaur.net with subject 'Test Email' and body 'This is a test email'")
  .expect("Verify the email was received with the correct subject and body")