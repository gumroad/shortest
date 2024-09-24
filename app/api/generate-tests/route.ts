import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { z } from "zod";
import { GenerateTestsInput } from "./schema";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { mode, pr_diff, test_files } =
    (await req.json()) as GenerateTestsInput;

  const prompt = `You are an expert software engineer. ${
    mode === "write"
      ? "Write entirely new tests and update relevant existing tests in order to reflect the added/edited/removed functionality."
      : "Update existing test files in order to get the PR build back to passing. Make updates to tests solely, do not add or remove tests."
  }

  ${pr_diff}

  Existing test files:
  ${test_files
    .map((file) => `${file.name}${file.content ? `: ${file.content}` : ""}`)
    .join("\n")}`;

  const { elementStream } = await streamObject({
    model: openai("gpt-4-turbo"),
    output: "array",
    schema: z.object({
      name: z.string(),
      content: z.string(),
    }),
    prompt,
  });

  const tests = [];
  for await (const test of elementStream) {
    tests.push(test);
  }

  return new Response(JSON.stringify({ tests }), {
    headers: { "Content-Type": "application/json" },
  });
}
