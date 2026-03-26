import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { questionSetSaveSchema } from "@/lib/validations/question-set";
import { generateSlug } from "@/lib/mcq/slug";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("question_sets")
    .select("*, question_set_items(*, questions(id, title, slug, tags))")
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
  const parsed = questionSetSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Generate unique slug
  const baseSlug = generateSlug(parsed.data.title);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("question_sets")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .maybeSingle();

    if (!existing) break;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  // Insert question set
  const { data: questionSet, error: qsError } = await supabase
    .from("question_sets")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
    })
    .select()
    .single();

  if (qsError) {
    return NextResponse.json({ error: qsError.message }, { status: 500 });
  }

  // Insert items
  const items = parsed.data.question_ids.map((qId: string, i: number) => ({
    question_set_id: questionSet.id,
    question_id: qId,
    sort_order: i,
  }));

  const { error: itemsError } = await supabase
    .from("question_set_items")
    .insert(items);

  if (itemsError) {
    await supabase.from("question_sets").delete().eq("id", questionSet.id);
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  return NextResponse.json(questionSet, { status: 201 });
}
