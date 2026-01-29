"use server";

import { revalidatePath } from "next/cache";

import { parseMcqJson } from "@/lib/mcq";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

async function ensureUniqueSlug(slug: string, id?: string) {
  let candidate = slug;
  let suffix = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.mcq.findFirst({
      where: {
        slug: candidate,
        ...(id ? { id: { not: id } } : {}),
      },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${slug}-${suffix}`;
    suffix += 1;
  }
}

export async function createMcq(formData: FormData) {
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!title || !content) {
    throw new Error("Title and markdown content are required.");
  }

  const baseSlug = slugify(slugInput || title);
  const slug = await ensureUniqueSlug(baseSlug || `mcq-${Date.now()}`);

  await prisma.mcq.create({
    data: {
      title,
      slug,
      content,
    },
  });

  revalidatePath("/dashboard");
}

export async function updateMcq(formData: FormData) {
  const id = String(formData.get("id") || "").trim();
  const title = String(formData.get("title") || "").trim();
  const slugInput = String(formData.get("slug") || "").trim();
  const content = String(formData.get("content") || "").trim();

  if (!id || !title || !content) {
    throw new Error("ID, title, and markdown content are required.");
  }

  const baseSlug = slugify(slugInput || title);
  const slug = await ensureUniqueSlug(baseSlug || `mcq-${Date.now()}`, id);

  await prisma.mcq.update({
    where: { id },
    data: { title, slug, content },
  });

  revalidatePath("/dashboard");
}

export async function deleteMcq(formData: FormData) {
  const id = String(formData.get("id") || "").trim();

  if (!id) {
    throw new Error("ID is required.");
  }

  await prisma.mcq.delete({ where: { id } });
  revalidatePath("/dashboard");
}

export async function importMcqs(rawJson: string) {
  const entries = parseMcqJson(rawJson);

  for (const entry of entries) {
    const baseSlug = slugify(entry.slug || entry.title);
    const slug = await ensureUniqueSlug(baseSlug || `mcq-${Date.now()}`);

    await prisma.mcq.create({
      data: {
        title: entry.title,
        slug,
        content: entry.content,
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function exportMcqs() {
  const mcqs = await prisma.mcq.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, slug: true, content: true },
  });

  return JSON.stringify(mcqs, null, 2);
}
