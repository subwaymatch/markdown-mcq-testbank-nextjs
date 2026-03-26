export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { McqEditor } from "@/components/questions/mcq-editor";
import { notFound } from "next/navigation";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: question } = await supabase
    .from("questions")
    .select("*")
    .eq("id", id)
    .single();

  if (!question) {
    notFound();
  }

  return (
    <div className="h-screen">
      <McqEditor
        initialMarkdown={question.raw_markdown}
        questionId={id}
        initialVisibility={question.visibility || "private"}
      />
    </div>
  );
}
