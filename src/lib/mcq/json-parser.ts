import type { ParsedMcq } from "@/types/mcq";
import type { JsonSaveInput } from "@/lib/validations/question";
import { generateSlug } from "./slug";

export function parseMcqJson(data: JsonSaveInput): ParsedMcq {
  const title = data.title.trim() || "Untitled";
  const correctCount = data.choices.filter((c) => c.is_correct).length;

  return {
    title,
    slug: generateSlug(title),
    tags: data.tags ?? [],
    questionBody: data.question_body,
    choices: data.choices.map((c) => ({
      text: c.text,
      isCorrect: c.is_correct,
      explanation: c.explanation ?? null,
    })),
    overallExplanation: data.overall_explanation ?? null,
    allowMultipleAnswers: correctCount > 1,
  };
}
