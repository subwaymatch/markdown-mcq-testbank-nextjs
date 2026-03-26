# MCQ Test Bank

A Next.js app for authoring and managing Multiple Choice Questions (MCQs) using a single Markdown editor. Write the entire question — title, tags, choices, explanations — in one text box and see a live preview beside it.

## Features

- **Single Markdown editor** — author the whole question in one box with a live preview
- **KaTeX math** — inline (`$...$`) and display (`$$...$$`) LaTeX
- **Per-choice explanations** — add a blockquote below any choice
- **Overall explanation** — any text after the choices block
- **Multi-answer support** — mark multiple choices `[o]`; the question automatically becomes multi-answer
- **Tags & slug** — organize questions with tags; slugs are auto-generated from the title
- **JSON export** — export individual questions or a bulk selection
- **Dark mode** — system-aware light/dark theme toggle
- **REST-ready API** — structured data stored in Postgres via Supabase, with full CRUD routes

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router, TypeScript)
- [Supabase](https://supabase.com/) (Postgres + Auth)
- [Shadcn UI](https://ui.shadcn.com/) + [Tailwind CSS v4](https://tailwindcss.com/)
- [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm + remark-math + rehype-katex + rehype-highlight
- [gray-matter](https://github.com/jonschlinkert/gray-matter) (YAML frontmatter parsing)
- [Geist Sans](https://vercel.com/font) (font)

## MCQ Markdown Syntax

Each question is written as a single Markdown document with YAML frontmatter.

```markdown
---
title: Photosynthesis Basics
tags: [biology, plants]
---

Which organelle is primarily responsible for photosynthesis in plant cells?

- Mitochondria
  > Mitochondria handle cellular respiration, not photosynthesis.
- [o] Chloroplast
  > Correct! Chloroplasts contain chlorophyll and are the site of photosynthesis.
- Nucleus
- Ribosome

Photosynthesis occurs in chloroplasts, where light energy is converted into
chemical energy using chlorophyll.
```

### Syntax Rules

| Element | Syntax |
|---|---|
| Title | `title:` in YAML frontmatter (required) |
| Tags | `tags: [tag1, tag2]` in frontmatter (optional) |
| Question body | Everything before the first `- ` choice line |
| Incorrect choice | `- Choice text` |
| Correct choice | `- [o] Choice text` |
| Per-choice explanation | `  > Explanation text` (indented blockquote under the choice) |
| Multi-line choice | Indent continuation lines by 2+ spaces |
| Overall explanation | Any text after the choices block (no special marker needed) |

### Notes

- Mark multiple choices `[o]` to make it a **multi-answer** question (checkbox style in preview)
- Use `*` or `1.` for lists **within** the question body; `- ` is reserved for choices
- Math works anywhere: `$x^2$` inline, `$$\int_0^\infty$$` display
- The slug is auto-generated from the title and is unique per user

### Example with Math

```markdown
---
title: Derivative of x squared
tags: [calculus, derivatives]
---

What is $\frac{d}{dx}[x^2]$?

- $x$
- [o] $2x$
  > Applying the power rule: bring down the exponent and reduce it by 1.
- $x^2$
- $2$

The power rule states that $\frac{d}{dx}[x^n] = nx^{n-1}$.
```

### Multi-Answer Example

```markdown
---
title: CSS Flexbox Properties
tags: [css, flexbox]
---

Which of the following are valid `justify-content` values? Select all that apply.

- [o] flex-start
- [o] center
- column
  > `column` is a `flex-direction` value, not `justify-content`.
- [o] space-between
- inline-flex
  > `inline-flex` is a `display` value.
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project (free tier is fine)

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd markdown-mcq-testbank-nextjs
npm install
```

### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in your Supabase project credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase dashboard under **Project Settings → API**.

### 3. Initialize the database

In your Supabase dashboard, go to **SQL Editor** and run the contents of [`supabase/schema.sql`](./supabase/schema.sql).

This creates:
- `questions` table with RLS policies
- `choices` table with RLS policies
- `updated_at` trigger

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Project Structure

```
src/
  app/
    (auth)/            — Login and register pages
    (dashboard)/       — Dashboard and question editor pages
    api/questions/     — REST API routes (GET, POST, PUT, DELETE)
  components/
    auth/              — LoginForm, RegisterForm
    layout/            — Header, ThemeToggle
    questions/         — McqEditor, McqPreview, MarkdownRenderer, QuestionTable
    providers/         — ThemeProvider
    ui/                — Shadcn UI components
  lib/
    mcq/               — parser.ts, serializer.ts, validator.ts, export.ts, slug.ts
    supabase/          — client.ts, server.ts, middleware.ts
    validations/       — Zod schema for API input
  types/
    mcq.ts             — TypeScript interfaces
  middleware.ts        — Auth guard (redirects unauthenticated users to /login)
supabase/
  schema.sql           — Database initialization SQL
```

## API Routes

The app exposes REST endpoints suitable for future external API consumers.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/questions` | List all questions (with choices) |
| `POST` | `/api/questions` | Create a question |
| `GET` | `/api/questions/:id` | Get a single question |
| `PUT` | `/api/questions/:id` | Update a question |
| `DELETE` | `/api/questions/:id` | Delete a question |

All routes require authentication (session cookie). Request body for POST/PUT:

```json
{ "raw_markdown": "---\ntitle: ...\n---\n..." }
```

## JSON Export Format

```json
{
  "version": "1.0",
  "exported_at": "2026-03-26T00:00:00.000Z",
  "question_count": 1,
  "questions": [
    {
      "id": "uuid",
      "title": "Photosynthesis Basics",
      "slug": "photosynthesis-basics",
      "question_body": "Which organelle...",
      "allow_multiple_answers": false,
      "tags": ["biology", "plants"],
      "overall_explanation": "Photosynthesis occurs in chloroplasts...",
      "choices": [
        { "choice_text": "Mitochondria", "is_correct": false, "explanation": "...", "sort_order": 0 },
        { "choice_text": "Chloroplast",  "is_correct": true,  "explanation": "...", "sort_order": 1 }
      ],
      "created_at": "2026-03-26T00:00:00.000Z",
      "updated_at": "2026-03-26T00:00:00.000Z"
    }
  ]
}
```
