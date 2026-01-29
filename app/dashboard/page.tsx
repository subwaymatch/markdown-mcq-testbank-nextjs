import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { parseMcqMarkdown } from "@/lib/mcq";
import { prisma } from "@/lib/prisma";

import { createMcq, deleteMcq, updateMcq } from "./actions";
import ImportExportPanel from "./ImportExportPanel";

const sampleMarkdown = `# Sample question
What does HTTP stand for?

- [x] Hypertext Transfer Protocol :: This is the core web protocol.
- [ ] Hyperlink Transfer Process :: Not a real standard.
- [ ] High Transfer Text Package :: Made up.

---
HTTP is the foundation of data communication on the web.`;

export default async function DashboardPage() {
  const mcqs = await prisma.mcq.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-foreground/60">Markdown MCQ Testbank</p>
            <h1 className="text-3xl font-semibold">Dashboard</h1>
            <p className="text-sm text-foreground/70">
              Create, edit, and manage markdown-based multiple-choice questions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/">Back home</Link>
            </Button>
          </div>
        </header>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Create a new MCQ</h2>
            <p className="text-sm text-foreground/70">
              Use markdown to define the question, options, and explanations.
            </p>
          </CardHeader>
          <CardContent>
            <form action={createMcq} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" placeholder="Enter a title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" placeholder="optional-slug" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Markdown content</Label>
                <Textarea
                  id="content"
                  name="content"
                  placeholder={sampleMarkdown}
                  className="min-h-[200px]"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <Button type="submit">Save MCQ</Button>
                <Badge variant="outline">Supports multi-answer options</Badge>
              </div>
            </form>
          </CardContent>
        </Card>

        <ImportExportPanel />

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Existing MCQs</h2>
            <Badge variant="outline">{mcqs.length} total</Badge>
          </div>
          <Separator />
          <div className="grid gap-6">
            {mcqs.map((mcq) => {
              const parsed = parseMcqMarkdown(mcq.content);
              return (
                <Card key={mcq.id}>
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-semibold">{mcq.title}</h3>
                        <p className="text-sm text-foreground/60">/{mcq.slug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{parsed.options.length} options</Badge>
                        <Badge>
                          {parsed.options.filter((option) => option.correct).length} correct
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-foreground/70">{parsed.question || "No question found."}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {parsed.options.map((option, index) => (
                        <div key={`${mcq.id}-option-${index}`} className="rounded-lg border border-foreground/10 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium">{option.text}</p>
                            <Badge variant={option.correct ? "default" : "outline"}>
                              {option.correct ? "Correct" : "Incorrect"}
                            </Badge>
                          </div>
                          {option.explanation ? (
                            <p className="mt-2 text-sm text-foreground/70">{option.explanation}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                    {parsed.generalExplanation ? (
                      <div className="rounded-lg border border-foreground/10 bg-foreground/5 p-3 text-sm">
                        <p className="font-medium">General explanation</p>
                        <p className="text-foreground/70">{parsed.generalExplanation}</p>
                      </div>
                    ) : null}
                    <form action={updateMcq} className="grid gap-4">
                      <input type="hidden" name="id" value={mcq.id} />
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor={`title-${mcq.id}`}>Title</Label>
                          <Input id={`title-${mcq.id}`} name="title" defaultValue={mcq.title} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`slug-${mcq.id}`}>Slug</Label>
                          <Input id={`slug-${mcq.id}`} name="slug" defaultValue={mcq.slug} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`content-${mcq.id}`}>Markdown content</Label>
                        <Textarea
                          id={`content-${mcq.id}`}
                          name="content"
                          defaultValue={mcq.content}
                          className="min-h-[180px]"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button type="submit">Update</Button>
                      </div>
                    </form>
                    <form action={deleteMcq}>
                      <input type="hidden" name="id" value={mcq.id} />
                      <Button type="submit" variant="outline">
                        Delete
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
