export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { McqAttempt } from "@/components/questions/mcq-attempt";
import { notFound } from "next/navigation";
import type { QuestionWithChoices } from "@/types/mcq";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default async function QuestionViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  // Try to fetch as public question first
  const { data: question } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("id", id)
    .eq("visibility", "public")
    .single();

  if (!question) {
    // If not found as public, check if the user owns it
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: ownQuestion } = await supabase
        .from("questions")
        .select("*, choices(*)")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (ownQuestion) {
        return renderPage(ownQuestion as QuestionWithChoices);
      }
    }

    notFound();
  }

  return renderPage(question as QuestionWithChoices);
}

function renderPage(question: QuestionWithChoices) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between h-14 px-4">
          <h1 className="text-lg font-bold">MCQ Test Bank</h1>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto max-w-2xl py-8 px-4">
        <McqAttempt question={question} />
      </main>
    </div>
  );
}
