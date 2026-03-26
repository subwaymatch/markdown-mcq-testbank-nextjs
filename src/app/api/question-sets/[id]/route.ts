import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { questionSetSaveSchema } from "@/lib/validations/question-set";
import { generateSlug } from "@/lib/mcq/slug";

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
    .from("question_sets")
    .select("*, question_set_items(*, questions(*, choices(*)))")
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
    .from("question_sets")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = questionSetSaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // Handle slug uniqueness
  const baseSlug = generateSlug(parsed.data.title);
  let slug = baseSlug;
  let suffix = 1;
  while (true) {
    const { data: conflict } = await supabase
      .from("question_sets")
      .select("id")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .neq("id", id)
      .maybeSingle();

    if (!conflict) break;
    suffix++;
    slug = `${baseSlug}-${suffix}`;
  }

  // Update question set
  const { error: qsError } = await supabase
    .from("question_sets")
    .update({
      title: parsed.data.title,
      slug,
      description: parsed.data.description || null,
    })
    .eq("id", id);

  if (qsError) {
    return NextResponse.json({ error: qsError.message }, { status: 500 });
  }

  // Replace items
  await supabase.from("question_set_items").delete().eq("question_set_id", id);

  const items = parsed.data.question_ids.map((qId: string, i: number) => ({
    question_set_id: id,
    question_id: qId,
    sort_order: i,
  }));

  const { error: itemsError } = await supabase
    .from("question_set_items")
    .insert(items);

  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const { data: complete } = await supabase
    .from("question_sets")
    .select("*, question_set_items(*, questions(id, title, slug, tags))")
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
    .from("question_sets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
