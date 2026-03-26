"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { QuestionWithChoices } from "@/types/mcq";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface QuestionSetEditorProps {
  questionSetId?: string;
  initialTitle?: string;
  initialDescription?: string;
  initialQuestionIds?: string[];
}

export function QuestionSetEditor({
  questionSetId,
  initialTitle = "",
  initialDescription = "",
  initialQuestionIds = [],
}: QuestionSetEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [questions, setQuestions] = useState<QuestionWithChoices[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialQuestionIds);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch("/api/questions");
        if (res.ok) {
          const data = await res.json();
          setQuestions(data);
        }
      } catch {
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, []);

  const toggleQuestion = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (selectedIds.length === 0) {
      toast.error("Select at least one question");
      return;
    }

    setSaving(true);
    try {
      const url = questionSetId
        ? `/api/question-sets/${questionSetId}`
        : "/api/question-sets";
      const method = questionSetId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          question_ids: selectedIds,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      toast.success(
        questionSetId ? "Question set updated" : "Question set created"
      );
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }, [title, description, selectedIds, questionSetId, router]);

  const filteredQuestions = questions.filter((q) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return (
      q.title.toLowerCase().includes(s) ||
      q.tags.some((t) => t.toLowerCase().includes(s))
    );
  });

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            Back
          </Button>
          <h1 className="text-lg font-semibold">
            {questionSetId ? "Edit Question Set" : "New Question Set"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      {/* Title & Description */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., JavaScript Fundamentals Quiz"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A brief description of this question set"
          />
        </div>
      </div>

      {/* Selected count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {selectedIds.length} question(s) selected
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search questions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Question list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading questions...</p>
      ) : filteredQuestions.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {questions.length === 0
            ? "No questions available. Create some questions first."
            : "No questions match your search."}
        </p>
      ) : (
        <div className="space-y-2">
          {filteredQuestions.map((question) => (
            <label
              key={question.id}
              className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                selectedIds.includes(question.id)
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <Checkbox
                checked={selectedIds.includes(question.id)}
                onCheckedChange={() => toggleQuestion(question.id)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{question.title}</p>
                {question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {question.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  {question.choices.length} choices &middot;{" "}
                  {question.allow_multiple_answers ? "Multiple answer" : "Single answer"}
                </p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
