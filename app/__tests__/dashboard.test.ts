import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

let frontendUrl = process.env.PLAYWRIGHT_TEST_BASE_URL ?? "http://localhost:3001";

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

shortest('clicking write new test button should initiate test generation');