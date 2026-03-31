import type { ParsedMcq, QuestionWithChoices } from "@/types/mcq";

export function serializeParsedMcqToMarkdown(mcq: ParsedMcq): string {
  const parts: string[] = [];

  parts.push("---");
  parts.push(`title: ${mcq.title}`);
  if (mcq.tags.length > 0) {
    parts.push(`tags: [${mcq.tags.join(", ")}]`);
  }
  parts.push("---");
  parts.push("");

  if (mcq.questionBody) {
    parts.push(mcq.questionBody);
    parts.push("");
  }

  for (const choice of mcq.choices) {
    if (choice.isCorrect) {
      parts.push(`- [o] ${choice.text}`);
    } else {
      parts.push(`- ${choice.text}`);
    }
    if (choice.explanation) {
      for (const line of choice.explanation.split("\n")) {
        parts.push(`  > ${line}`);
      }
    }
  }

  if (mcq.overallExplanation) {
    parts.push("");
    parts.push(mcq.overallExplanation);
  }

  return parts.join("\n") + "\n";
}

export function serializeToMarkdown(question: QuestionWithChoices): string {
  const parts: string[] = [];

  // Frontmatter
  parts.push("---");
  parts.push(`title: ${question.title}`);
  if (question.tags.length > 0) {
    parts.push(`tags: [${question.tags.join(", ")}]`);
  }
  parts.push("---");
  parts.push("");

  // Question body
  if (question.question_body) {
    parts.push(question.question_body);
    parts.push("");
  }

  // Choices
  const sortedChoices = [...question.choices].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  for (const choice of sortedChoices) {
    if (choice.is_correct) {
      parts.push(`- [o] ${choice.choice_text}`);
    } else {
      parts.push(`- ${choice.choice_text}`);
    }
    if (choice.explanation) {
      for (const line of choice.explanation.split("\n")) {
        parts.push(`  > ${line}`);
      }
    }
  }

  // Overall explanation
  if (question.overall_explanation) {
    parts.push("");
    parts.push(question.overall_explanation);
  }

  return parts.join("\n") + "\n";
}
