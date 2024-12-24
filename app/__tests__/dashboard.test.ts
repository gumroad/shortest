import { shortest } from "@antiwork/shortest";
import { clerk, clerkSetup } from "@clerk/testing/playwright";

let frontendUrl = process.env.SHORTEST_TEST_BASE_URL ?? "http://localhost:3000";


shortest('Login to the app using email and password', {
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD
})

shortest('Verify that the user can access the /dashboard page');

shortest("Verify that users can generate test cases")
.expect("It takes up to 20 seconds for the tests to be generated")
.expect("You should validate that the vitest tests are generated and shown in the UI")