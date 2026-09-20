import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProgressRing from "@/components/ProgressRing";
import ChallengeCard from "@/components/ChallengeCard";
import JourneyManage from "@/components/JourneyManage";
import { getJourney, practiceByLesson } from "@/lib/queries";
import { completedLessonIds } from "@/lib/progress";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const bundle = await getJourney(id);
  if (!bundle) return { title: "Journey not found — Absorb" };
  return {
    title: `${bundle.journey.title} — Absorb`,
    description: bundle.topic?.description ?? undefined,
  };
}

function StageHeader({
  step,
  title,
  blurb,
}: {
  step: string;
  title: string;
  blurb: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-line bg-white/5 text-xs font-semibold text-brand-soft">
        {step}
      </span>
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-fog">{blurb}</p>
      </div>
    </div>
  );
}

function Metric({
  value,
  label,
  hint,
}: {
  value: string;
  label: string;
  hint?: string;
}) {
  return (
    <div className="card p-4">
      <p className="text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-0.5 text-[0.68rem] uppercase tracking-wider text-fog">{label}</p>
      {hint && <p className="mt-1 text-xs text-fog/80">{hint}</p>}
    </div>
  );
}

export default async function JourneyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getJourney(id);
  if (!bundle) notFound();

  const { journey, topic, lessons, practice, challenge, progress, stats } = bundle;
  const done = completedLessonIds(progress);
  const byLesson = practiceByLesson(lessons, practice);
  const testItems = practice.filter((p) => p.type === "test");
  const drillItems = practice.filter((p) => p.type !== "test");
  const nextLesson = lessons.find((l) => !done.has(l.id)) ?? lessons[0];

  return (
    <div className="space-y-8">
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="animate-fade">
        <Link href="/" className="text-xs text-fog transition-colors hover:text-chalk">
          ← All journeys
        </Link>
        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.14em] text-fog">
          {topic?.title ?? "Topic"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          {journey.title}
        </h1>
        {topic?.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog">
            {topic.description}
          </p>
        )}
      </header>

      {/* ── Scoreboard ─────────────────────────────────────── */}
      <section className="card flex flex-wrap items-center gap-6 p-5 animate-rise">
        <ProgressRing
          value={stats.understandingScore}
          size={96}
          label="Understanding"
          sublabel="understood"
        />
        <div className="grid flex-1 gap-3 sm:grid-cols-3">
          <Metric
            value={`${stats.lessonsDone}/${stats.totalLessons}`}
            label="Lessons read"
            hint={`${stats.completionPct}% of the journey`}
          />
          <Metric
            value={stats.attempts ? `${stats.accuracyPct}%` : "—"}
            label="Practice accuracy"
            hint={
              stats.attempts
                ? `${stats.correct} of ${stats.attempts} correct`
                : "No answers yet"
            }
          />
          <Metric
            value={
              stats.challengeStatus === "completed"
                ? "Applied"
                : stats.challengeStatus === "in_progress"
                  ? "Started"
                  : "Waiting"
            }
            label="Real-world challenge"
            hint={challenge?.title ?? "—"}
          />
        </div>
      </section>

      {(stats.strengths.length > 0 || stats.weaknesses.length > 0) && (
        <section className="flex flex-wrap gap-2">
          {stats.strengths.map((s) => (
            <span
              key={`s-${s}`}
              className="chip border-mint/35 bg-mint/10 text-mint"
              title="Strength"
            >
              ✓ {s}
            </span>
          ))}
          {stats.weaknesses.map((w) => (
            <span
              key={`w-${w}`}
              className="chip border-amber/35 bg-amber/10 text-amber"
              title="Needs work"
            >
              ↻ {w}
            </span>
          ))}
        </section>
      )}

      {/* ── 1 · Learn ──────────────────────────────────────── */}
      <section className="space-y-4">
        <StageHeader
          step="1"
          title="Learn"
          blurb="Bite-sized lessons. Read one, then mark it understood."
        />

        <div className="grid gap-3 stagger">
          {lessons.map((lesson, i) => {
            const isDone = done.has(lesson.id);
            const count = byLesson.get(lesson.id)?.length ?? 0;
            return (
              <Link
                key={lesson.id}
                href={`/journey/${journey.id}/lesson/${lesson.id}`}
                className="card card-hover flex items-center gap-4 p-4"
              >
                <span
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors ${
                    isDone
                      ? "border-mint/50 bg-mint/15 text-mint"
                      : "border-line bg-white/5 text-fog"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{lesson.title}</p>
                  {lesson.key_concept && (
                    <p className="truncate text-xs text-fog">{lesson.key_concept}</p>
                  )}
                </div>
                <span className="hidden shrink-0 text-xs text-fog sm:block">
                  {count} practice
                </span>
                <span className="shrink-0 text-fog">→</span>
              </Link>
            );
          })}
          {lessons.length === 0 && (
            <div className="card p-6 text-center text-sm text-fog">
              This journey has no lessons yet.
            </div>
          )}
        </div>

        {nextLesson && (
          <Link
            href={`/journey/${journey.id}/lesson/${nextLesson.id}`}
            className="btn btn-primary"
          >
            {stats.lessonsDone === 0
              ? "Start the first lesson"
              : stats.lessonsDone === stats.totalLessons
                ? "Re-read a lesson"
                : "Continue where you left off"}
          </Link>
        )}
      </section>

      {/* ── 2 · Practice ───────────────────────────────────── */}
      <section className="space-y-4">
        <StageHeader
          step="2"
          title="Practice"
          blurb="Flashcards, multiple choice and fill-in-the-blank, with instant feedback."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-sm font-semibold">Practice session</p>
            <p className="mt-1 text-xs leading-relaxed text-fog">
              {drillItems.length} items across every lesson in this journey.
            </p>
            <Link
              href={`/journey/${journey.id}/practice`}
              className="btn btn-primary mt-4"
              aria-disabled={drillItems.length === 0}
            >
              {stats.attempts > 0 ? "Practise again" : "Start practising"}
            </Link>
          </div>

          <div className="card p-5">
            <p className="text-sm font-semibold">End-of-journey test</p>
            <p className="mt-1 text-xs leading-relaxed text-fog">
              {testItems.length > 0
                ? `${testItems.length} questions. ${
                    stats.testScorePct !== null
                      ? `Last score: ${stats.testScorePct}%.`
                      : "Not taken yet."
                  }`
                : "No test questions in this journey yet."}
            </p>
            <Link href={`/journey/${journey.id}/test`} className="btn btn-ghost mt-4">
              {stats.testTaken ? "Retake the test" : "Take the test"}
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3 · Apply ──────────────────────────────────────── */}
      <section className="space-y-4">
        <StageHeader
          step="3"
          title="Apply"
          blurb="One real-world challenge, scoped to your daily life."
        />
        {challenge ? (
          <ChallengeCard journeyId={journey.id} challenge={challenge} />
        ) : (
          <div className="card p-6 text-center text-sm text-fog">
            This journey has no challenge yet.
          </div>
        )}
      </section>

      <JourneyManage journeyId={journey.id} journeyTitle={journey.title} />
    </div>
  );
}
