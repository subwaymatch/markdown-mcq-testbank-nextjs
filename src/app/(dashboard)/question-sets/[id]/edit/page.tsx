export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { QuestionSetEditor } from "@/components/questions/question-set-editor";
import { notFound } from "next/navigation";

export default async function EditQuestionSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: questionSet } = await supabase
    .from("question_sets")
    .select("*, question_set_items(question_id, sort_order)")
    .eq("id", id)
    .single();

  if (!questionSet) {
    notFound();
  }

  const sortedItems = [...questionSet.question_set_items].sort(
    (a: { sort_order: number }, b: { sort_order: number }) =>
      a.sort_order - b.sort_order
  );

  return (
    <QuestionSetEditor
      questionSetId={id}
      initialTitle={questionSet.title}
      initialDescription={questionSet.description || ""}
      initialQuestionIds={sortedItems.map(
        (item: { question_id: string }) => item.question_id
      )}
    />
  );
}
