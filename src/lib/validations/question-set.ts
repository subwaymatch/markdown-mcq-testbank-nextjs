import { z } from "zod";

export const questionSetSaveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().default(""),
  question_ids: z.array(z.string().uuid()).min(1, "At least one question is required"),
});

export type QuestionSetSaveInput = z.infer<typeof questionSetSaveSchema>;
