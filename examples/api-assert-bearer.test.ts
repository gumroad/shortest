import { shortest } from "@antiwork/shortest";
import { ALLOWED_TEST_BEARER, TESTING_API_BASE_URI } from "@/lib/constants";

const apiTest1 = `
  There's no bearer token in the request.
  Use cURL with 'Bearer <API_KEY>' to POST ${TESTING_API_BASE_URI}/assert-bearer
  with: {"flagged": "false"}. Expect response is a message indicating the absence of the token
`;

const apiTest2 = `
  Bearer token for this request is ${ALLOWED_TEST_BEARER}.
  Use cURL with 'Bearer <API_KEY>' to POST ${TESTING_API_BASE_URI}/assert-bearer
  with: {"flagged": "true"}. Expect the response to show "flagged": true.
`;

shortest(apiTest1);
shortest(apiTest2);
