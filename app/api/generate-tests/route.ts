import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { GenerateTestsInput, TestFileSchema } from "./schema";

export async function POST(req: Request) {
  const { mode, pr_diff, test_files } =
    (await req.json()) as GenerateTestsInput;

  const prompt = `You are an expert software engineer. ${
    mode === "write"
      ? "Write entirely new tests and update relevant existing tests in order to reflect the added/edited/removed functionality."
      : "Update the provided failing test files in order to get the PR build back to passing. Make updates to tests solely, do not add or remove tests."
  }

  PR Diff:
  <PR Diff>
  ${pr_diff}
  </PR Diff>

  ${mode === "update" ? "Failing test files:" : "Existing test files:"}
  <Test Files>
  ${test_files
    .map((file) => `${file.name}\n${file.content ? `: ${file.content}` : ""}`)
    .join("\n")}
  </Test Files>

  Respond with an array of test files with their name being the path to the file and the content being the full contents of the updated test file.`;

  const result = await streamObject({
    model: anthropic("claude-3-5-sonnet-20240620"),
    output: "object",
    schema: TestFileSchema,
    prompt,
  });

  return result.toTextStreamResponse();
}
