import { z } from "zod";

const markdownSaveSchema = z.object({
  raw_markdown: z.string().min(1, "Markdown content is required"),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

const choiceJsonSchema = z.object({
  text: z.string().min(1, "Choice text is required"),
  is_correct: z.boolean(),
  explanation: z.string().nullable().optional().default(null),
});

const jsonSaveSchema = z.object({
  title: z.string().min(1, "Title is required"),
  tags: z.array(z.string()).optional().default([]),
  question_body: z.string().min(1, "Question body is required"),
  choices: z
    .array(choiceJsonSchema)
    .min(2, "At least 2 choices are required"),
  overall_explanation: z.string().nullable().optional().default(null),
  visibility: z.enum(["public", "private"]).optional().default("private"),
});

export const questionSaveSchema = z.union([markdownSaveSchema, jsonSaveSchema]);

export type MarkdownSaveInput = z.infer<typeof markdownSaveSchema>;
export type JsonSaveInput = z.infer<typeof jsonSaveSchema>;
export type QuestionSaveInput = z.infer<typeof questionSaveSchema>;
