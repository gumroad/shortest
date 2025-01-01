import { APIRequest, shortest } from "@antiwork/shortest";

const req = new APIRequest({
  baseURL: "http://invalid.url.test",
  extraHTTPHeaders: {
    "Content-Type": "application/json",
  },
});

shortest(
  "Test 1: Ensure the request fails",
  req.fetch(
    {},
    {
      maxRetries: 5,
    }
  )
);
