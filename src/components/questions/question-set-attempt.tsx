"use client";

import { useState } from "react";
import type { QuestionWithChoices } from "@/types/mcq";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MarkdownRenderer } from "./markdown-renderer";

interface QuestionSetAttemptProps {
  title: string;
  description: string | null;
  questions: QuestionWithChoices[];
}

interface QuestionState {
  selectedIds: Set<string>;
  submitted: boolean;
}

export function QuestionSetAttempt({
  title,
  description,
  questions,
}: QuestionSetAttemptProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<QuestionState[]>(
    questions.map(() => ({ selectedIds: new Set(), submitted: false }))
  );
  const [showSummary, setShowSummary] = useState(false);

  const current = questions[currentIndex];
  const currentState = questionStates[currentIndex];

  const sortedChoices = current
    ? [...current.choices].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const toggleChoice = (choiceId: string) => {
    if (currentState.submitted) return;
    setQuestionStates((prev) => {
      const next = [...prev];
      const state = { ...next[currentIndex] };
      const ids = new Set(state.selectedIds);
      if (current.allow_multiple_answers) {
        if (ids.has(choiceId)) ids.delete(choiceId);
        else ids.add(choiceId);
      } else {
        ids.clear();
        ids.add(choiceId);
      }
      state.selectedIds = ids;
      next[currentIndex] = state;
      return next;
    });
  };

  const handleSubmit = () => {
    if (currentState.selectedIds.size === 0) return;
    setQuestionStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], submitted: true };
      return next;
    });
  };

  const handleReset = () => {
    setQuestionStates((prev) => {
      const next = [...prev];
      next[currentIndex] = { selectedIds: new Set(), submitted: false };
      return next;
    });
  };

  const isCorrectAnswer = (choiceId: string) =>
    sortedChoices.find((c) => c.id === choiceId)?.is_correct ?? false;

  const allCorrect = (state: QuestionState, q: QuestionWithChoices) => {
    const choices = [...q.choices].sort((a, b) => a.sort_order - b.sort_order);
    return choices.every((c) =>
      c.is_correct ? state.selectedIds.has(c.id) : !state.selectedIds.has(c.id)
    );
  };

  const score = questionStates.filter(
    (s, i) => s.submitted && allCorrect(s, questions[i])
  ).length;
  const answered = questionStates.filter((s) => s.submitted).length;

  if (showSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && (
            <p className="text-muted-foreground mt-1">{description}</p>
          )}
        </div>

        <div className="p-6 rounded-lg border text-center space-y-2">
          <p className="text-4xl font-bold">
            {score} / {questions.length}
          </p>
          <p className="text-muted-foreground">
            {score === questions.length
              ? "Perfect score!"
              : score === 0
              ? "Keep practicing!"
              : "Good effort!"}
          </p>
        </div>

        <div className="space-y-3">
          {questions.map((q, i) => {
            const s = questionStates[i];
            const correct = s.submitted && allCorrect(s, q);
            const skipped = !s.submitted;
            return (
              <div
                key={q.id}
                className={`flex items-center gap-3 p-3 rounded-md border ${
                  skipped
                    ? "border-border bg-card"
                    : correct
                    ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                    : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                }`}
              >
                <span className="text-sm font-medium text-muted-foreground w-6 shrink-0">
                  {i + 1}.
                </span>
                <span className="flex-1 text-sm">{q.title}</span>
                <span className="text-xs shrink-0">
                  {skipped ? "Skipped" : correct ? "Correct" : "Incorrect"}
                </span>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => {
            setCurrentIndex(0);
            setQuestionStates(
              questions.map(() => ({ selectedIds: new Set(), submitted: false }))
            );
            setShowSummary(false);
          }}
        >
          Start Over
        </Button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
          {answered > 0 && (
            <span className="text-sm text-muted-foreground">
              · {score}/{answered} correct so far
            </span>
          )}
        </div>
        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question title */}
      <h2 className="text-xl font-semibold">{current.title}</h2>

      {/* Tags */}
      {current.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {current.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Question body */}
      {current.question_body && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={current.question_body} />
        </div>
      )}

      {/* Answer type hint */}
      <p className="text-sm text-muted-foreground">
        {current.allow_multiple_answers
          ? "Select all that apply."
          : "Select one answer."}
      </p>

      {/* Choices */}
      <div className="space-y-2">
        {sortedChoices.map((choice) => {
          const isSelected = currentState.selectedIds.has(choice.id);
          const isCorrect = choice.is_correct;

          let borderClass = "border-border bg-card";
          if (currentState.submitted) {
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
              disabled={currentState.submitted}
              className={`w-full text-left flex items-start gap-3 p-3 rounded-md border transition-colors ${borderClass} ${
                !currentState.submitted
                  ? "hover:border-primary/50 cursor-pointer"
                  : ""
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {current.allow_multiple_answers ? (
                  <div
                    className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground"
                    }`}
                  >
                    {isSelected && (
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
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
                      isSelected ? "border-primary" : "border-muted-foreground"
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
                {currentState.submitted && choice.explanation && (
                  <div className="mt-2 text-sm text-muted-foreground border-l-2 border-muted pl-3">
                    <MarkdownRenderer content={choice.explanation} />
                  </div>
                )}
              </div>
              {currentState.submitted && (
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

      {/* Submit / Result + Navigation */}
      <div className="space-y-4">
        {!currentState.submitted ? (
          <Button
            onClick={handleSubmit}
            disabled={currentState.selectedIds.size === 0}
          >
            Check Answer
          </Button>
        ) : (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-md border ${
                allCorrect(currentState, current)
                  ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                  : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              }`}
            >
              <p
                className={`font-semibold ${
                  allCorrect(currentState, current)
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-700 dark:text-red-400"
                }`}
              >
                {allCorrect(currentState, current) ? "Correct!" : "Incorrect"}
              </p>
            </div>

            {current.overall_explanation && (
              <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  Explanation
                </p>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={current.overall_explanation} />
                </div>
              </div>
            )}

            <Button variant="outline" size="sm" onClick={handleReset}>
              Try Again
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentIndex((i) => i - 1)}
            disabled={currentIndex === 0}
          >
            Previous
          </Button>
          {currentIndex < questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              Next
            </Button>
          ) : (
            <Button size="sm" onClick={() => setShowSummary(true)}>
              Finish &amp; See Results
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
