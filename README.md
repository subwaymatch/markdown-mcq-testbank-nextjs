# Markdown MCQ Testbank

A Next.js prototype for authoring markdown-based multiple-choice questions (MCQs) with explanations, multiple correct responses, and import/export via JSON.

## Tech stack

- Next.js (App Router)
- shadcn/ui + Tailwind
- Better Auth (email/password)
- Prisma + Postgres

## Local development

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Start Postgres locally (Prisma local dev guide):

```bash
docker compose up -d
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

4. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and visit `/dashboard` to manage MCQs.

## Markdown MCQ format

Use a single markdown block:

```markdown
# Question text

- [x] Correct option :: Explanation shown after answer
- [ ] Incorrect option :: Explanation shown after answer

---
General explanation shown after submission.
```

## JSON import/export

The dashboard lets you import/export MCQs with this JSON schema:

```json
[
  {
    "title": "MCQ title",
    "slug": "optional-slug",
    "content": "markdown content"
  }
]
```
