import { anthropic } from '@ai-sdk/anthropic';
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

  PR Diff:
  <PR Diff>
  ${pr_diff}
  </PR Diff>

  Existing test files:
  <Test Files>
  ${test_files
    .map((file) => `${file.name}${file.content ? `: ${file.content}` : ""}`)
    .join("\n")}
  </Test Files>`;

  console.log("Prompt: ", prompt);

  const { elementStream } = await streamObject({
    model: anthropic("claude-3-5-sonnet-20240620"),
    output: "array",
    schema: z.object({
      name: z.string(),
      content: z.string(),
    }),
    prompt,
  });

  console.log("Element stream: ", elementStream);

  const tests = [];
  for await (const test of elementStream) {
    tests.push(test);
  }

  console.log("Tests: ", tests);

  return new Response(JSON.stringify({ tests }), {
    headers: { "Content-Type": "application/json" },
  });
}
