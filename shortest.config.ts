import type { ShortestConfig } from "@antiwork/shortest";

export default {
  headless: false,
  driver: {
    platform: "android",
    coreDriver: {
      capabilities: {
        "appium:app":
          "/Users/mac/Desktop/contributions/shortest/packages/shortest/src/core/runner/app.apk",
      },
    },
  },
  baseUrl: "./packages/shortest/src/core/runner/app.apk", // todo: change to more appropriate name
  testDir: ["app/__tests__", "examples"],
  anthropicKey: process.env.ANTHROPIC_API_KEY,
  mailosaur: {
    apiKey: process.env.MAILOSAUR_API_KEY,
    serverId: process.env.MAILOSAUR_SERVER_ID,
  },
} satisfies ShortestConfig;
