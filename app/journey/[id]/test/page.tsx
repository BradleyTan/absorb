import Link from "next/link";
import { notFound } from "next/navigation";
import PracticeRunner from "@/components/PracticeRunner";
import { getJourney } from "@/lib/queries";
import { toClientItems } from "@/lib/clientItems";

export const dynamic = "force-dynamic";

export default async function TestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getJourney(id);
  if (!bundle) notFound();

  const { journey, lessons, practice, stats } = bundle;
  const testItems = practice.filter((p) => p.type === "test");

  return (
    <div className="space-y-6">
      <header className="animate-fade">
        <Link
          href={`/journey/${journey.id}`}
          className="text-xs text-fog transition-colors hover:text-chalk"
        >
          ← {journey.title}
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          End-of-journey test
        </h1>
        <p className="mt-1.5 text-sm text-fog">
          {testItems.length} question{testItems.length === 1 ? "" : "s"} drawn from
          across the journey.
          {stats.testScorePct !== null && ` Your last score was ${stats.testScorePct}%.`}
        </p>
      </header>

      {stats.completionPct < 100 && testItems.length > 0 && (
        <div className="card border-amber/35 bg-amber/[0.07] p-4 text-sm text-amber">
          You&rsquo;ve read {stats.lessonsDone} of {stats.totalLessons} lessons. You can
          take the test now, but finishing the lessons first will show a truer score.
        </div>
      )}

      {testItems.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-fog">
            This journey has no test questions yet. Add one to any lesson with the type
            &ldquo;test&rdquo;.
          </p>
          <Link href={`/journey/${journey.id}`} className="btn btn-ghost mt-4">
            Back to journey
          </Link>
        </div>
      ) : (
        <PracticeRunner
          journeyId={journey.id}
          items={toClientItems(testItems, lessons)}
          doneHref={`/journey/${journey.id}`}
          doneLabel="Back to journey"
        />
      )}
    </div>
  );
}
