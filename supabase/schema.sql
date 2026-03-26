-- ============================================================
-- MCQ Test Bank - Database Initialization
-- Run this in Supabase SQL Editor to create all required tables
-- ============================================================

-- 0. Enable required extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Questions table
-- ============================================================
create table public.questions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  title           text not null,
  slug            text not null,
  question_body   text not null default '',
  allow_multiple_answers boolean not null default false,
  tags            text[] not null default '{}',
  overall_explanation text,
  raw_markdown    text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint uq_questions_user_slug unique (user_id, slug)
);

create index idx_questions_user_id on public.questions(user_id);
create index idx_questions_tags on public.questions using gin(tags);

-- ============================================================
-- 2. Choices table
-- ============================================================
create table public.choices (
  id              uuid primary key default gen_random_uuid(),
  question_id     uuid not null references public.questions(id) on delete cascade,
  choice_text     text not null,
  is_correct      boolean not null default false,
  explanation     text,
  sort_order      smallint not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_choices_question_id on public.choices(question_id);

-- ============================================================
-- 3. Updated_at trigger
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- ============================================================
-- 4. Row Level Security
-- ============================================================
alter table public.questions enable row level security;
alter table public.choices enable row level security;

-- Questions: users see/modify only their own rows
create policy "Users can select own questions"
  on public.questions for select
  using (auth.uid() = user_id);

create policy "Users can insert own questions"
  on public.questions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own questions"
  on public.questions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own questions"
  on public.questions for delete
  using (auth.uid() = user_id);

-- Choices: access governed by parent question ownership
create policy "Users can select own choices"
  on public.choices for select
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );

create policy "Users can insert own choices"
  on public.choices for insert
  with check (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );

create policy "Users can update own choices"
  on public.choices for update
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );

create policy "Users can delete own choices"
  on public.choices for delete
  using (
    exists (
      select 1 from public.questions q
      where q.id = question_id and q.user_id = auth.uid()
    )
  );
