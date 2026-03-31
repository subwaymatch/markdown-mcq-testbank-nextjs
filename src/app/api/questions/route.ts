import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMcqMarkdown } from "@/lib/mcq/parser";
import { parseMcqJson } from "@/lib/mcq/json-parser";
import { serializeParsedMcqToMarkdown } from "@/lib/mcq/serializer";
import { validateMcq } from "@/lib/mcq/validator";
import { questionSaveSchema } from "@/lib/validations/question";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = questionSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const isMarkdown = "raw_markdown" in parsed.data;
  const mcq = isMarkdown
    ? parseMcqMarkdown(parsed.data.raw_markdown)
    : parseMcqJson(parsed.data);
  const rawMarkdown = isMarkdown
    ? parsed.data.raw_markdown
    : serializeParsedMcqToMarkdown(mcq);

  const validation = validateMcq(mcq);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors.join(", ") },
      { status: 400 }
    );
  }

  // Handle slug uniqueness: try slug, then slug-2, slug-3, etc.
  let slug = mcq.slug;
  let suffix = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("questions")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    suffix++;
    slug = `${mcq.slug}-${suffix}`;
  }

  // Insert question
  const { data: question, error: qError } = await supabase
    .from("questions")
    .insert({
      user_id: user.id,
      title: mcq.title,
      slug,
      question_body: mcq.questionBody,
      allow_multiple_answers: mcq.allowMultipleAnswers,
      tags: mcq.tags,
      overall_explanation: mcq.overallExplanation,
      raw_markdown: rawMarkdown,
      visibility: parsed.data.visibility,
    })
    .select()
    .single();

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  // Insert choices
  if (mcq.choices.length > 0) {
    const choicesData = mcq.choices.map((c, i) => ({
      question_id: question.id,
      choice_text: c.text,
      is_correct: c.isCorrect,
      explanation: c.explanation,
      sort_order: i,
    }));

    const { error: cError } = await supabase
      .from("choices")
      .insert(choicesData);

    if (cError) {
      // Rollback: delete the question
      await supabase.from("questions").delete().eq("id", question.id);
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }
  }

  // Fetch the complete question with choices
  const { data: complete } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("id", question.id)
    .single();

  return NextResponse.json(complete, { status: 201 });
}
