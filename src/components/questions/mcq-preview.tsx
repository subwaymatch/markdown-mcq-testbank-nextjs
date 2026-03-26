"use client";

import { useMemo } from "react";
import { parseMcqMarkdown } from "@/lib/mcq/parser";
import { validateMcq } from "@/lib/mcq/validator";
import { Badge } from "@/components/ui/badge";
import { MarkdownRenderer } from "./markdown-renderer";

interface McqPreviewProps {
  rawMarkdown: string;
}

export function McqPreview({ rawMarkdown }: McqPreviewProps) {
  const { mcq, validation } = useMemo(() => {
    const mcq = parseMcqMarkdown(rawMarkdown);
    const validation = validateMcq(mcq);
    return { mcq, validation };
  }, [rawMarkdown]);

  return (
    <div className="space-y-4">
      {/* Validation errors */}
      {validation.errors.length > 0 && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md space-y-1">
          {validation.errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}
        </div>
      )}

      {/* Validation warnings */}
      {validation.warnings.length > 0 && (
        <div className="text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md space-y-1">
          {validation.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {/* Title */}
      <h2 className="text-xl font-bold">{mcq.title}</h2>

      {/* Tags */}
      {mcq.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {mcq.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Question body */}
      {mcq.questionBody && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <MarkdownRenderer content={mcq.questionBody} />
        </div>
      )}

      {/* Choices */}
      {mcq.choices.length > 0 && (
        <div className="space-y-2">
          {mcq.choices.map((choice, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-md border ${
                choice.isCorrect
                  ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                  : "border-border bg-card"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {mcq.allowMultipleAnswers ? (
                  <div
                    className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center ${
                      choice.isCorrect
                        ? "border-green-600 bg-green-600 text-white"
                        : "border-muted-foreground"
                    }`}
                  >
                    {choice.isCorrect && (
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
                      choice.isCorrect
                        ? "border-green-600"
                        : "border-muted-foreground"
                    }`}
                  >
                    {choice.isCorrect && (
                      <div className="w-2 h-2 rounded-full bg-green-600" />
                    )}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <MarkdownRenderer content={choice.text} />
                </div>
                {choice.explanation && (
                  <div className="mt-2 text-sm text-muted-foreground border-l-2 border-muted pl-3">
                    <MarkdownRenderer content={choice.explanation} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overall explanation */}
      {mcq.overallExplanation && (
        <div className="mt-4 p-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-2">
            Explanation
          </p>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer content={mcq.overallExplanation} />
          </div>
        </div>
      )}
    </div>
  );
}
