import { z } from "zod";

export const questionSaveSchema = z.object({
  raw_markdown: z.string().min(1, "Markdown content is required"),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

export type QuestionSaveInput = z.infer<typeof questionSaveSchema>;
