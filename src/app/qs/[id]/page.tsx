export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { QuestionSetAttempt } from "@/components/questions/question-set-attempt";
import { notFound } from "next/navigation";
import type { QuestionWithChoices } from "@/types/mcq";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function QuestionSetViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("question_sets")
    .select("*, question_set_items(sort_order, questions(*, choices(*)))")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  // Sort items by sort_order and extract questions with sorted choices
  const sortedItems = [...data.question_set_items].sort(
    (a, b) => a.sort_order - b.sort_order
  );

  const questions: QuestionWithChoices[] = sortedItems
    .map((item) => item.questions as QuestionWithChoices | null)
    .filter((q): q is QuestionWithChoices => q !== null)
    .map((q) => ({
      ...q,
      choices: [...q.choices].sort((a, b) => a.sort_order - b.sort_order),
    }));

  if (questions.length === 0) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold">MCQ Test Bank</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto max-w-2xl py-8 px-4">
        <QuestionSetAttempt
          title={data.title}
          description={data.description}
          questions={questions}
        />
      </main>
    </div>
  );
}
