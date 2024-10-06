import { z } from "zod";

export const generateTestsSchema = z.object({
  mode: z.enum(["write", "update"]),
  pr_id: z.number(),
  pr_diff: z.string(),
  test_files: z.array(
    z.object({
      name: z.string(),
      content: z.string().optional(),
    })
  ),
  issue: z.object({
    title: z.string(),
    description: z.string(),
  }),
});

export const generateTestsResponseSchema = z.array(
  z.object({
    name: z.string(),
    content: z.string(),
  })
);

export type GenerateTestsInput = z.infer<typeof generateTestsSchema>;
export type GenerateTestsResponse = z.infer<typeof generateTestsResponseSchema>;
