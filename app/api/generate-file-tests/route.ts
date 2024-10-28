import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { GenerateFileTestsInput, createTestFileSchema } from "./schema";

export async function POST(req: Request) {
  const { files, test_files = [] } = (await req.json()) as GenerateFileTestsInput;

  const testFileSchema = createTestFileSchema(files.length);

  const prompt = `You are an expert software engineer. Write tests for the provided source files. Write entirely new tests and update relevant existing tests in order to reflect the functionality in the source files.

Source Files:
<Source Files>
${files.map((file) => `${file.path}\n${file.content}`).join("\n\n")}
</Source Files>

${test_files.length > 0 ? `
Existing Test Files:
<Test Files>
${test_files.map((file) => `${file.name}\n${file.content}`).join("\n\n")}
</Test Files>
` : ''}

Respond with an array of one test file per source file with their name being the path to the test file and the content being the full contents of the test file. Follow these conventions:
1. For each source file, create a corresponding test file
2. If the source file is 'src/components/Button.tsx', the test should be 'src/components/Button.test.tsx'
3. If the source file is 'lib/utils.ts', the test should be 'lib/utils.test.ts'
4. When updating existing tests, maintain the same testing style and patterns used in the existing test files`;

  const result = await streamObject({
    model: anthropic("claude-3-5-sonnet-20240620"),
    schema: testFileSchema,
    prompt,
  });

  return result.toTextStreamResponse();
} 