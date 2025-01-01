import { APIRequest, shortest } from "@antiwork/shortest";

const req = new APIRequest();

shortest(
  "Ensure the request fails",
  req.fetch(
    { url: "http://invalid.url.test" },
    {
      maxRetries: 5,
    },
  ),
);

shortest(
  "Ensure the request fails due to SSL sertificate error",
  req.fetch({ url: "https://secure.donauversicherung.at" }),
);

shortest(
  "Ensure the request to be successful",
  req.fetch(
    {
      url: "https://secure.donauversicherung.at",
    },
    {
      ignoreHTTPSErrors: true,
    },
  ),
);
