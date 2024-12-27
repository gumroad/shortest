import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

let frontendUrl = process.env.SHORTEST_TEST_BASE_URL ?? "http://localhost:3000";

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

shortest("Verify that the user can access the /dashboard page");