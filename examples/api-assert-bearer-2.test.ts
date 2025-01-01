import { shortest, APIRequest } from "@antiwork/shortest";
import { ALLOWED_TEST_BEARER, TESTING_API_BASE_URI } from "@/lib/constants";

const req = new APIRequest({
  baseURL: TESTING_API_BASE_URI,
  extraHTTPHeaders: {
    "Content-Type": "application/json",
  },
  timeout: 50000,
});

shortest(
  "Test 1: Ensure the request without a bearer token returns a message indicating the absence of the token",
  req.fetch(
    {
      url: "/assert-bearer",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flagged: "false" }),
    },
    {
      maxRetries: 3,
    }
  )
);

shortest(
  `Test 2: Bearer token is ${ALLOWED_TEST_BEARER}. Ensure the request with a valid bearer token returns the expected response`,
  req.fetch(
    {
      url: "/assert-bearer",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ flagged: "true" }),
    },
    {
      maxRetries: 3,
    }
  )
);
