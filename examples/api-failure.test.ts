import { APIRequest, shortest } from "@antiwork/shortest";

const req = new APIRequest();

shortest(
  "Test 1: Ensure the request fails",
  req.fetch(
    { url: "http://invalid.url.test" },
    {
      maxRetries: 5,
    },
  ),
);

shortest(
  "Test 2: Ensure the request fails due to SSL sertificate error",
  req.fetch({ url: "https://secure.donauversicherung.at" })
);

shortest(
  "Test 2: Ensure the request to be successful",
  req.fetch(
    {
      url: "https://secure.donauversicherung.at",
    },
    {
      ignoreHTTPSErrors: true,
    }
  )
);
