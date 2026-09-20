# Absorb

People learn passively — videos, scattered flashcards, generic courses — and forget
most of it. Absorb takes any topic and builds a guided journey that carries you from
first exposure to actually using it: **Learn → Practice → Apply**.

No login. The homepage is the working app.

## The core flow

1. **Enter a topic** — "Basics of Negotiation".
2. **Absorb generates the journey** — five lessons, fifteen graded practice items
   (flashcards, multiple choice, fill-in-the-blank, plus end-of-journey test
   questions) and one real-world challenge, all written to the database.
3. **Read a lesson**, mark it understood.
4. **Practise** — answer questions and get instant feedback, graded on the server.
5. **Take the end-of-journey test.**
6. **Do the challenge** — a small, real thing you do this week; mark it started,
   then completed.
7. **Watch your progress move** — lessons read, practice accuracy, understanding
   score, and which concepts are sticking versus slipping.

Everything on every screen persists. Generated content is a starting point, not a
fixture: rename a journey, rewrite a lesson, add or delete practice items, delete
the whole journey.

## Data model

| Table | What it holds |
|---|---|
| `topics` | The subject the learner entered |
| `journeys` | The generated path, with `completion_pct` and `understanding_score` |
| `lessons` | Ordered units: content, key concept |
| `practice_items` | `flashcard` / `mcq` / `fill_blank` / `test`, with answer + options |
| `challenges` | The real-world project, `not_started` → `in_progress` → `completed` |
| `progress` | Dual purpose, keyed on `practice_item_id`: `NULL` = a lesson marker (`is_completed`), otherwise a practice attempt (`practice_score` 100/0) |

Schema lives in `supabase/migrations/`. Never edit `0001_init.sql` — add a new
numbered file.

## How journeys get generated

`lib/generator.ts` is the engine and it needs no AI: curated curricula for topics
it knows, and a template curriculum that produces a complete, coherent journey for
anything else. `lib/ai.ts` is an optional layer — when `ANTHROPIC_API_KEY` is set,
Claude writes the curriculum instead, and any failure falls back silently to the
generator. The core job never depends on the AI being switched on.

Graded answers stay on the server. Practice items reach the browser without their
answer (flashcards excepted — they're self-graded), and `gradePractice` decides
correctness server-side.

## Stack

Next.js 15 (App Router, Server Actions) · React 19 · TypeScript · Tailwind CSS v4 ·
Supabase · deployed on Vercel.

## Running it locally

```bash
npm install
vercel link && vercel env pull .env.local
npm run dev
```

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db` | Report which tables exist and their row counts |
| `npm run db:apply` | Apply `supabase/migrations/*.sql` (needs a Postgres URL) |
| `npm run check:generator` | Verify generated journeys are complete and answerable |

## Deploying

Push to `main`. Vercel builds from GitHub — never `vercel deploy` from local files.
