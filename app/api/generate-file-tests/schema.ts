import { z } from "zod";

export const generateFileTestsSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
});

export const TestFileSchemaLoose = z.object({
  tests: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    })
  ),
});

export const createTestFileSchema = (inputLength: number) => 
  z.object({
    tests: z
      .array(
        z.object({
          name: z.string(),
          content: z.string(),
        })
      )
      .refine(
        (tests) => tests.length === inputLength,
        `Number of test files must match number of input files (expected ${inputLength})`
      ),
  });

export type GenerateFileTestsInput = z.infer<typeof generateFileTestsSchema>; 