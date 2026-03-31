import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseMcqMarkdown } from "@/lib/mcq/parser";
import { parseMcqJson } from "@/lib/mcq/json-parser";
import { serializeParsedMcqToMarkdown } from "@/lib/mcq/serializer";
import { validateMcq } from "@/lib/mcq/validator";
import { questionSaveSchema } from "@/lib/validations/question";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const { data: existing } = await supabase
    .from("questions")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  // Handle slug uniqueness (exclude current question)
  let slug = mcq.slug;
  let suffix = 1;
  while (true) {
    const { data: conflict } = await supabase
      .from("questions")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (!conflict) break;
    suffix++;
    slug = `${mcq.slug}-${suffix}`;
  }

  // Update question
  const { error: qError } = await supabase
    .from("questions")
    .update({
      title: mcq.title,
      slug,
      question_body: mcq.questionBody,
      allow_multiple_answers: mcq.allowMultipleAnswers,
      tags: mcq.tags,
      overall_explanation: mcq.overallExplanation,
      raw_markdown: rawMarkdown,
      visibility: parsed.data.visibility,
    })
    .eq("id", id);

  if (qError) {
    return NextResponse.json({ error: qError.message }, { status: 500 });
  }

  // Replace choices: delete old, insert new
  await supabase.from("choices").delete().eq("question_id", id);

  if (mcq.choices.length > 0) {
    const choicesData = mcq.choices.map((c, i) => ({
      question_id: id,
      choice_text: c.text,
      is_correct: c.isCorrect,
      explanation: c.explanation,
      sort_order: i,
    }));

    const { error: cError } = await supabase
      .from("choices")
      .insert(choicesData);

    if (cError) {
      return NextResponse.json({ error: cError.message }, { status: 500 });
    }
  }

  // Fetch updated
  const { data: complete } = await supabase
    .from("questions")
    .select("*, choices(*)")
    .eq("id", id)
    .single();

  return NextResponse.json(complete);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("questions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
