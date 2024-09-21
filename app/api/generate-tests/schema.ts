import { z } from "zod";

const generateTestsSchema = z.object({
  mode: z.enum(["write", "update"]),
  pr_id: z.number(),
  pr_diff: z.string(),
  test_files: z.array(
    z.object({
      name: z.string(),
      content: z.string().optional(),
    })
  ),
});

export const generateTestsResponseSchema = z.object({
  testFiles: z.array(
    z.object({
      name: z.string(),
      oldContent: z.string(),
      newContent: z.string(),
      isEntirelyNew: z.boolean(),
    })
  ),
});

export type GenerateTestsInput = z.infer<typeof generateTestsSchema>;
export type GenerateTestsResponse = z.infer<typeof generateTestsResponseSchema>;
