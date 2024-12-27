import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

let frontendUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3000";

shortest.beforeAll(async ({ page }) => {
  await clerkSetup({
    frontendApiUrl: frontendUrl,
  });
  await clerk.signIn({
    page,
    signInParams: {
      strategy: "email_code",
      identifier: "shortest+clerk_test@example.com",
    },
  });

  await page.goto(frontendUrl + "/dashboard");
});

shortest("Generate test cases by clicking on 'Write new tests'. Validate test cases appears in UI within 20s");