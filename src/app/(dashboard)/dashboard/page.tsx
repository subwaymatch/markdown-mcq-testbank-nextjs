export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { QuestionTable } from "@/components/questions/question-table";
import { QuestionSetTable } from "@/components/questions/question-set-table";
import type { QuestionWithChoices } from "@/types/mcq";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: questions }, { data: questionSets }] = await Promise.all([
    supabase
      .from("questions")
      .select("*, choices(*)")
      .order("created_at", { ascending: false }),
    supabase
      .from("question_sets")
      .select("*, question_set_items(question_id)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="container mx-auto py-8 px-4 space-y-12">
      <div>
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

      <QuestionSetTable questionSets={questionSets || []} />
    </div>
  );
}
