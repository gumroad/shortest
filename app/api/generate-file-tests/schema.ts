import { z } from "zod";

export const generateFileTestsSchema = z.object({
  files: z.array(
    z.object({
      path: z.string(),
      content: z.string(),
    })
  ),
});

export const TestFileSchema = z.object({
  tests: z.array(
    z.object({
      name: z.string(),
      content: z.string(),
    })
  ),
});

export type GenerateFileTestsInput = z.infer<typeof generateFileTestsSchema>; 