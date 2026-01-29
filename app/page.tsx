import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Home() {
  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="space-y-4">
          <p className="text-sm text-foreground/60">Markdown MCQ Testbank</p>
          <h1 className="text-4xl font-semibold">Author, preview, and manage markdown MCQs.</h1>
          <p className="max-w-2xl text-base text-foreground/70">
            This prototype uses Next.js, shadcn/ui, Better Auth, and Prisma with Postgres so you
            can build markdown-powered multiple-choice questions with explanations and multiple
            correct answers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Manage MCQs</Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Markdown-first authoring",
              body: "Define questions, options, explanations, and general notes in one markdown block.",
            },
            {
              title: "Import & export",
              body: "Move MCQs between JSON and markdown for future API integrations.",
            },
            {
              title: "Postgres + Prisma",
              body: "Use a local Postgres database with Prisma migrations for persistence.",
            },
          ].map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <h2 className="text-lg font-semibold">{item.title}</h2>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground/70">{item.body}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </main>
  );
}
