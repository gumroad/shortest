import { openai } from "@ai-sdk/openai";
import { streamObject } from "ai";
import { generateTestsResponseSchema, GenerateTestsInput } from "./schema";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { mode, pr_diff, existing_test_files }: GenerateTestsInput = await req.json();

  const result = await streamObject({
    model: openai("gpt-4-turbo"),
    schema: generateTestsResponseSchema,
    prompt: `Generate tests for the following code diff in ${mode} mode:

    ${pr_diff}

    Existing test files:
    ${existing_test_files.map(file => `${file.name}:\n${file.content}`).join('\n\n')}

    Generate appropriate test content based on the diff, mode, and existing test files.`,
  });

  return result.toTextStreamResponse();
}
