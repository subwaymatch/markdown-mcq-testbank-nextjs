"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { McqPreview } from "./mcq-preview";
import { parseMcqMarkdown } from "@/lib/mcq/parser";
import { validateMcq } from "@/lib/mcq/validator";
import { toast } from "sonner";
import type { QuestionVisibility } from "@/types/mcq";

const STARTER_TEMPLATE = `---
title: Your Question Title
tags: [topic1, topic2]
---

Write your question here using **Markdown**.

You can use math like $E = mc^2$ or code like \`console.log("hello")\`.

- First incorrect choice
- [o] The correct answer
  > Explanation for why this is correct
- Another incorrect choice
- Yet another choice

Optional overall explanation goes here after the choices.
`;

interface McqEditorProps {
  initialMarkdown?: string;
  questionId?: string;
  initialVisibility?: QuestionVisibility;
}

export function McqEditor({ initialMarkdown, questionId, initialVisibility = "private" }: McqEditorProps) {
  const [markdown, setMarkdown] = useState(
    initialMarkdown || STARTER_TEMPLATE
  );
  const [visibility, setVisibility] = useState<QuestionVisibility>(initialVisibility);
  const [saving, setSaving] = useState(false);
  const [debouncedMarkdown, setDebouncedMarkdown] = useState(markdown);
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Debounce preview updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMarkdown(markdown);
    }, 300);
    return () => clearTimeout(timer);
  }, [markdown]);

  const handleSave = useCallback(async () => {
    const mcq = parseMcqMarkdown(markdown);
    const validation = validateMcq(mcq);

    if (!validation.valid) {
      toast.error(validation.errors.join("\n"));
      return;
    }

    setSaving(true);

    try {
      const url = questionId
        ? `/api/questions/${questionId}`
        : "/api/questions";
      const method = questionId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw_markdown: markdown, visibility }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success(questionId ? "Question updated" : "Question created");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [markdown, visibility, questionId, router]);

  // Handle tab key in textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const value = textarea.value;

        setMarkdown(value.substring(0, start) + "  " + value.substring(end));

        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }

      if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
          <h1 className="text-lg font-semibold">
            {questionId ? "Edit Question" : "New Question"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as QuestionVisibility)}
            className="h-8 rounded-md border border-input bg-background px-2 text-sm"
          >
            <option value="private">Private</option>
            <option value="public">Public</option>
          </select>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Mobile: Tabs / Desktop: Split pane */}
      <div className="flex-1 min-h-0">
        {/* Mobile tabs */}
        <div className="md:hidden h-full">
          <Tabs defaultValue="editor" className="h-full flex flex-col">
            <TabsList className="mx-4 mt-2">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <TabsContent value="editor" className="flex-1 min-h-0 m-0 px-4 pb-4">
              <textarea
                ref={textareaRef}
                value={markdown}
                onChange={(e) => setMarkdown(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-full resize-none font-mono text-sm p-4 bg-muted/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                spellCheck={false}
              />
            </TabsContent>
            <TabsContent value="preview" className="flex-1 min-h-0 m-0 px-4 pb-4 overflow-y-auto">
              <div className="p-4 border rounded-md bg-card">
                <McqPreview rawMarkdown={debouncedMarkdown} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Desktop split pane */}
        <div className="hidden md:grid md:grid-cols-2 h-full divide-x">
          <div className="p-4 min-h-0">
            <textarea
              ref={textareaRef}
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full h-full resize-none font-mono text-sm p-4 bg-muted/50 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              spellCheck={false}
            />
          </div>
          <div className="p-4 overflow-y-auto">
            <McqPreview rawMarkdown={debouncedMarkdown} />
          </div>
        </div>
      </div>
    </div>
  );
}
