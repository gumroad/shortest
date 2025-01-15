import { join } from "path";
import dotenv from "dotenv";
import { expect as jestExpect } from "expect";
import { APIRequest } from "./browser/core/api-request";
import { TestCompiler } from "./core/compiler";
import {
  TestFunction,
  TestAPI,
  TestContext,
  TestChain,
  ShortestConfig,
} from "./types";

// to include the global expect in the generated d.ts file
import "./globals";

// Initialize config
let globalConfig: ShortestConfig | null = null;
const compiler = new TestCompiler();

// Initialize shortest namespace and globals
declare const global: {
  __shortest__: any;
  expect: any;
} & typeof globalThis;

if (!global.__shortest__) {
  global.__shortest__ = {
    expect: jestExpect,
    registry: {
      tests: new Map<string, TestFunction[]>(),
      currentFileTests: [],
      beforeAllFns: [],
      afterAllFns: [],
      beforeEachFns: [],
      afterEachFns: [],
      directTestCounter: 0,
    },
  };

  // Attach to global scope
  global.expect = global.__shortest__.expect;

  dotenv.config({ path: join(process.cwd(), ".env") });
  dotenv.config({ path: join(process.cwd(), ".env.local") });
}

function validateConfig(config: Partial<ShortestConfig>) {
  const missingFields: string[] = [];

  if (config.headless === undefined) missingFields.push("headless");
  if (!config.baseUrl) missingFields.push("baseUrl");
  if (!config.testPattern) missingFields.push("testPattern");

  if (config.useBedrock) {
    if (!config.awsAccessKey && !process.env.AWS_ACCESS_KEY_ID)
      missingFields.push("awsAccessKey");
    if (!config.awsSecretKey && !process.env.AWS_SECRET_ACCESS_KEY)
      missingFields.push("awsSecretKey");
    if (!config.awsRegion && !process.env.AWS_REGION)
      missingFields.push("awsRegion");
  } else {
    if (!config.anthropicKey && !process.env.ANTHROPIC_API_KEY)
      missingFields.push("anthropicKey");
  }

  if (missingFields.length > 0) {
    throw new Error(
      `Missing required fields in shortest.config.ts:\n` +
        missingFields.map((field) => `  - ${field}`).join("\n"),
    );
  }
}

export async function initialize() {
  if (globalConfig) return globalConfig;

  dotenv.config({ path: join(process.cwd(), ".env") });
  dotenv.config({ path: join(process.cwd(), ".env.local") });

  const configFiles = [
    "shortest.config.ts",
    "shortest.config.js",
    "shortest.config.mjs",
  ];

  for (const file of configFiles) {
    try {
      const module = await compiler.loadModule(file, process.cwd());
      if (module.default) {
        const config = module.default;
        validateConfig(config);

        globalConfig = {
          ...config,
          anthropicKey: process.env.ANTHROPIC_API_KEY || config.anthropicKey,
        };

        return globalConfig;
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Config Error: ${error.message}`);
      }
      continue;
    }
  }

  throw new Error(
    "No config file found. Create shortest.config.ts in your project root.\n" +
      "Required fields:\n" +
      "  - headless: boolean\n" +
      "  - baseUrl: string\n" +
      "  - testPattern: string\n" +
      "  - anthropicKey: string",
  );
}

export function getConfig(): ShortestConfig {
  if (!globalConfig) {
    throw new Error("Config not initialized. Call initialize() first");
  }
  return globalConfig;
}

function createTestChain(
  nameOrFn: string | string[] | ((context: TestContext) => Promise<void>),
  payloadOrFn?: ((context: TestContext) => Promise<void>) | any,
  fn?: (context: TestContext) => Promise<void>,
): TestChain {
  const registry = global.__shortest__.registry;

  // Handle array of test names
  if (Array.isArray(nameOrFn)) {
    const tests = nameOrFn.map((name) => {
      const test: TestFunction = {
        name,
        expectations: [],
      };

      registry.tests.set(name, [...(registry.tests.get(name) || []), test]);
      registry.currentFileTests.push(test);
      return test;
    });

    // Return chain for the last test
    const lastTest = tests[tests.length - 1];
    if (!lastTest.name) {
      throw new Error("Test name is required");
    }
    return createTestChain(lastTest.name, payloadOrFn, fn);
  }

  // Handle direct execution
  if (typeof nameOrFn === "function") {
    registry.directTestCounter++;
    const test: TestFunction = {
      name: `Direct Test #${registry.directTestCounter}`,
      directExecution: true,
      fn: nameOrFn,
    };
    registry.currentFileTests.push(test);
    return {
      expect: () => {
        throw new Error("expect() cannot be called on direct execution test");
      },
      after: () => {
        throw new Error("after() cannot be called on direct execution test");
      },
      before: () => {
        throw new Error("before() cannot be called on direct execution test");
      },
    };
  }

  // Rest of existing createTestChain implementation...
  const test: TestFunction = {
    name: nameOrFn,
    payload: typeof payloadOrFn === "function" ? undefined : payloadOrFn,
    fn: typeof payloadOrFn === "function" ? payloadOrFn : fn,
    expectations: [],
  };

  registry.tests.set(nameOrFn, [...(registry.tests.get(nameOrFn) || []), test]);
  registry.currentFileTests.push(test);

  const chain: TestChain = {
    expect(
      descriptionOrFn: string | ((context: TestContext) => Promise<void>),
      payloadOrFn?: any,
      fn?: (context: TestContext) => Promise<void>,
    ) {
      // Handle direct execution for expect
      if (typeof descriptionOrFn === "function") {
        test.expectations = test.expectations || [];
        test.expectations.push({
          directExecution: true,
          fn: descriptionOrFn,
        });
        return chain;
      }

      // Existing expect implementation...
      test.expectations = test.expectations || [];
      test.expectations.push({
        description: descriptionOrFn,
        payload: typeof payloadOrFn === "function" ? undefined : payloadOrFn,
        fn: typeof payloadOrFn === "function" ? payloadOrFn : fn,
      });
      return chain;
    },
    before(fn: (context: TestContext) => void | Promise<void>) {
      test.beforeFn = (context) => Promise.resolve(fn(context));
      return chain;
    },
    after(fn: (context: TestContext) => void | Promise<void>) {
      test.afterFn = (context) => Promise.resolve(fn(context));
      return chain;
    },
  };

  return chain;
}

export const test: TestAPI = Object.assign(
  (
    nameOrFn: string | string[] | ((context: TestContext) => Promise<void>),
    payloadOrFn?: ((context: TestContext) => Promise<void>) | any,
    fn?: (context: TestContext) => Promise<void>,
  ) => createTestChain(nameOrFn, payloadOrFn, fn),
  {
    beforeAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === "function" ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeAllFns.push(hook);
    },
    afterAll: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === "function" ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterAllFns.push(hook);
    },
    beforeEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === "function" ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.beforeEachFns.push(hook);
    },
    afterEach: (nameOrFn: string | ((ctx: TestContext) => Promise<void>)) => {
      const hook = typeof nameOrFn === "function" ? nameOrFn : undefined;
      if (hook) global.__shortest__.registry.afterEachFns.push(hook);
    },
  },
);

export const shortest: TestAPI = test;
export { APIRequest };
export type { ShortestConfig };
