import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { generateTestsResponseSchema, GenerateTestsInput } from "./schema";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { mode, pr_diff, test_files } =
    (await req.json()) as GenerateTestsInput;

  console.log("mode", mode);
  console.log("pr_diff", pr_diff);
  console.log("test_files", test_files);

  const result = await streamObject({
    model: openai("gpt-4-turbo"),
    schema: generateTestsResponseSchema,
    prompt: `Generate tests for the following code diff in ${mode} mode:

    ${pr_diff}

    Existing test files:
    ${test_files
      .map((file) => `${file.name}${file.content ? `: ${file.content}` : ""}`)
      .join("\n")}

    Generate appropriate test content based on the diff and mode.`,
  });

  console.log("result", result);

  return result.toTextStreamResponse();
}
