export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { QuestionTable } from "@/components/questions/question-table";
import type { QuestionWithChoices } from "@/types/mcq";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">My Questions</h2>
        <p className="text-muted-foreground">
          Create and manage your multiple choice questions
        </p>
      </div>
      <QuestionTable
        questions={(questions as QuestionWithChoices[]) || []}
      />
    </div>
  );
}
