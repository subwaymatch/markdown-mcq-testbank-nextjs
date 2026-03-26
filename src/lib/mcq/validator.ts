import type { ParsedMcq } from "@/types/mcq";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateMcq(mcq: ParsedMcq): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!mcq.title || mcq.title === "Untitled") {
    errors.push("Title is required");
  }

  if (!mcq.questionBody.trim()) {
    errors.push("Question body is required");
  }

  if (mcq.choices.length < 2) {
    errors.push("At least 2 choices are required");
  }

  const correctCount = mcq.choices.filter((c) => c.isCorrect).length;
  if (correctCount === 0) {
    errors.push("At least one choice must be marked correct with [o]");
  }

  if (mcq.choices.some((c) => !c.text.trim())) {
    errors.push("All choices must have text");
  }

  if (mcq.choices.length > 10) {
    warnings.push("Consider using fewer than 10 choices");
  }

  if (mcq.tags.length === 0) {
    warnings.push("Consider adding tags for better organization");
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
