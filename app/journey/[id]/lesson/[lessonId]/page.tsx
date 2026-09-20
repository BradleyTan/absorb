import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LessonCompleteToggle from "@/components/LessonCompleteToggle";
import PracticeRunner from "@/components/PracticeRunner";
import { getJourney, practiceByLesson } from "@/lib/queries";
import { completedLessonIds } from "@/lib/progress";
import { toClientItems } from "@/lib/clientItems";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}): Promise<Metadata> {
  const { id, lessonId } = await params;
  const bundle = await getJourney(id);
  const lesson = bundle?.lessons.find((l) => l.id === lessonId);
  if (!lesson) return { title: "Lesson not found — Absorb" };
  return {
    title: `${lesson.title} — Absorb`,
    description: lesson.key_concept ?? undefined,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const bundle = await getJourney(id);
  if (!bundle) notFound();

  const { journey, lessons, practice, progress } = bundle;
  const index = lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();

  const lesson = lessons[index];
  const prev = index > 0 ? lessons[index - 1] : null;
  const next = index < lessons.length - 1 ? lessons[index + 1] : null;
  const done = completedLessonIds(progress);
  const items = practiceByLesson(lessons, practice).get(lesson.id) ?? [];
  const drills = items.filter((i) => i.type !== "test");

  const paragraphs = lesson.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div className="space-y-8">
      <header className="animate-fade">
        <Link
          href={`/journey/${journey.id}`}
          className="text-xs text-fog transition-colors hover:text-chalk"
        >
          ← {journey.title}
        </Link>
        <p className="mt-3 text-[0.7rem] uppercase tracking-[0.14em] text-fog">
          Lesson {index + 1} of {lessons.length}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {lesson.title}
          </h1>
          <Link
            href={`/journey/${journey.id}/lesson/${lesson.id}/edit`}
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
          >
            Edit lesson
          </Link>
        </div>
      </header>

      {lesson.key_concept && (
        <div className="card border-brand/30 bg-brand/[0.07] p-4 animate-rise">
          <p className="text-[0.68rem] uppercase tracking-[0.14em] text-brand-soft">
            Key concept
          </p>
          <p className="mt-1 text-sm font-medium leading-relaxed">{lesson.key_concept}</p>
        </div>
      )}

      <article className="card prose-lesson p-5 sm:p-7 animate-rise">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </article>

      <div className="flex flex-wrap items-center gap-3">
        <LessonCompleteToggle
          journeyId={journey.id}
          lessonId={lesson.id}
          completed={done.has(lesson.id)}
        />
        {next ? (
          <Link
            href={`/journey/${journey.id}/lesson/${next.id}`}
            className="btn btn-ghost"
          >
            Next lesson →
          </Link>
        ) : (
          <Link href={`/journey/${journey.id}/test`} className="btn btn-ghost">
            Take the end-of-journey test →
          </Link>
        )}
      </div>

      {drills.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">
              Practise this lesson
            </h2>
            <p className="text-sm text-fog">
              {drills.length} question{drills.length === 1 ? "" : "s"} — answer and get
              feedback straight away.
            </p>
          </div>
          <PracticeRunner
            journeyId={journey.id}
            items={toClientItems(drills)}
            doneHref={`/journey/${journey.id}`}
            doneLabel="Back to journey"
          />
        </section>
      )}

      <nav className="flex items-center justify-between border-t border-line pt-5 text-sm">
        {prev ? (
          <Link
            href={`/journey/${journey.id}/lesson/${prev.id}`}
            className="text-fog transition-colors hover:text-chalk"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/journey/${journey.id}/lesson/${next.id}`}
            className="text-right text-fog transition-colors hover:text-chalk"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
