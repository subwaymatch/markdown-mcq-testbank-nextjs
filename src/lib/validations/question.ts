import { z } from "zod";

export const questionSaveSchema = z.object({
  raw_markdown: z.string().min(1, "Markdown content is required"),
});

export type QuestionSaveInput = z.infer<typeof questionSaveSchema>;
