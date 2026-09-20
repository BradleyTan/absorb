import Link from "next/link";
import { notFound } from "next/navigation";
import LessonEditor from "@/components/LessonEditor";
import PracticeEditor from "@/components/PracticeEditor";
import { getJourney, practiceByLesson } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function EditLessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id, lessonId } = await params;
  const bundle = await getJourney(id);
  if (!bundle) notFound();

  const { journey, lessons, practice } = bundle;
  const lesson = lessons.find((l) => l.id === lessonId);
  if (!lesson) notFound();

  const items = practiceByLesson(lessons, practice).get(lesson.id) ?? [];

  return (
    <div className="space-y-6">
      <header className="animate-fade">
        <Link
          href={`/journey/${journey.id}/lesson/${lesson.id}`}
          className="text-xs text-fog transition-colors hover:text-chalk"
        >
          ← {lesson.title}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          Edit lesson
        </h1>
        <p className="mt-1.5 text-sm text-fog">
          Change the lesson itself, or the questions that test it. Everything here is
          yours to rewrite — including the examples Absorb generated.
        </p>
      </header>

      <LessonEditor journeyId={journey.id} lesson={lesson} />
      <PracticeEditor journeyId={journey.id} lessonId={lesson.id} items={items} />
    </div>
  );
}
