import type { QuestionWithChoices, McqExportEnvelope } from "@/types/mcq";

export function createExportEnvelope(
  questions: QuestionWithChoices[]
): McqExportEnvelope {
  return {
    version: "1.0",
    exported_at: new Date().toISOString(),
    question_count: questions.length,
    questions: questions.map((q) => ({
      id: q.id,
      title: q.title,
      slug: q.slug,
      question_body: q.question_body,
      allow_multiple_answers: q.allow_multiple_answers,
      tags: q.tags,
      overall_explanation: q.overall_explanation,
      choices: [...q.choices]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => ({
          choice_text: c.choice_text,
          is_correct: c.is_correct,
          explanation: c.explanation,
          sort_order: c.sort_order,
        })),
      created_at: q.created_at,
      updated_at: q.updated_at,
    })),
  };
}

export function downloadJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
