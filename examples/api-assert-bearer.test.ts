import { shortest } from "@antiwork/shortest";
import { ALLOWED_TEST_BEARER, TESTING_API_BASE_URI } from "@/lib/constants";

// @note you should be authenticated in Clerk to run this test
const missingBearerToken = `
  Test the API POST endpoint ${TESTING_API_BASE_URI}/assert-bearer with body { "flagged": "false" } without providing a bearer token.
  Expect the response to indicate that the token is missing
`;

const validBearerToken = `
  Test the API POST endpoint ${TESTING_API_BASE_URI}/assert-bearer with body { "flagged": "true" } and the bearer token ${ALLOWED_TEST_BEARER}.
  Expect the response to show "flagged": true
`;

shortest(missingBearerToken);
shortest(validBearerToken);