"use client";

import { useState } from "react";
import type { QuestionWithChoices } from "@/types/mcq";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";

interface McqAttemptProps {
  question: QuestionWithChoices;
}

export function McqAttempt({ question }: McqAttemptProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);

  const sortedChoices = [...question.choices].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const toggleChoice = (choiceId: string) => {
    if (submitted) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (question.allow_multiple_answers) {
        if (next.has(choiceId)) next.delete(choiceId);
        else next.add(choiceId);
      } else {
        next.clear();
        next.add(choiceId);
      }
      return next;
    });
  };

  const handleSubmit = () => {
    if (selectedIds.size === 0) return;
    setSubmitted(true);
  };

  const handleReset = () => {
    setSelectedIds(new Set());
    setSubmitted(false);
  };

  const isCorrectAnswer = (choiceId: string) => {
    const choice = sortedChoices.find((c) => c.id === choiceId);
    return choice?.is_correct ?? false;
  };

  const allCorrect =
    submitted &&
    sortedChoices.every((c) =>
      c.is_correct ? selectedIds.has(c.id) : !selectedIds.has(c.id)
    );

  return (
    <div className="space-y-6">
      {/* Title */}
      <h1 className="text-2xl font-bold">{question.title}</h1>

      {/* Tags */}
      {question.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {question.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Question body */}
      {question.question_body && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={question.question_body} />
        </div>
      )}

      {/* Answer type hint */}
      <p className="text-sm text-muted-foreground">
        {question.allow_multiple_answers
          ? "Select all that apply."
          : "Select one answer."}
      </p>

      {/* Choices */}
      <div className="space-y-2">
        {sortedChoices.map((choice) => {
          const isSelected = selectedIds.has(choice.id);
          const isCorrect = choice.is_correct;

          let borderClass = "border-border bg-card";
          if (submitted) {
            if (isCorrect) {
              borderClass =
                "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20";
            } else if (isSelected && !isCorrect) {
              borderClass =
                "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20";
            }
          } else if (isSelected) {
            borderClass =
              "border-primary bg-primary/5 dark:border-primary dark:bg-primary/10";
          }

          return (
            <button
              key={choice.id}
              type="button"
              onClick={() => toggleChoice(choice.id)}
              disabled={submitted}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors ${borderClass} ${
                !submitted ? "hover:border-primary/50 cursor-pointer" : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {question.allow_multiple_answers ? (
                  <div
                    className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5L4 7L8 3"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={choice.choice_text} />
                </div>
                {submitted && choice.explanation && (
                  <div className="mt-2 text-sm text-muted-foreground border-l-2 border-muted pl-3">
                    <MarkdownRenderer content={choice.explanation} />
                  </div>
                )}
              </div>
              {submitted && (
                <div className="mt-0.5 shrink-0">
                  {isCorrect ? (
                    <svg
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isSelected ? (
                    <svg
                      className="w-5 h-5 text-red-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  ) : null}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Submit / Result */}
      {!submitted ? (
        <Button
          onClick={handleSubmit}
          disabled={selectedIds.size === 0}
        >
          Check Answer
        </Button>
      ) : (
        <div className="space-y-4">
          <div
            className={`p-4 rounded-md border ${
              allCorrect
                ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            <p
              className={`font-semibold ${
                allCorrect
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400"
              }`}
            >
              {allCorrect ? "Correct!" : "Incorrect"}
            </p>
          </div>

          {/* Overall explanation */}
          {question.overall_explanation && (
            <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                Explanation
              </p>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <MarkdownRenderer content={question.overall_explanation} />
              </div>
            </div>
          )}

          <Button variant="outline" onClick={handleReset}>
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
