import Link from "next/link";
import { notFound } from "next/navigation";
import PracticeRunner from "@/components/PracticeRunner";
import ResetPracticeButton from "@/components/ResetPracticeButton";
import { getJourney } from "@/lib/queries";
import { toClientItems } from "@/lib/clientItems";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bundle = await getJourney(id);
  if (!bundle) notFound();

  const { journey, lessons, practice, stats } = bundle;
  const drills = practice.filter((p) => p.type !== "test");

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
          Practice session
        </h1>
        <p className="mt-1.5 text-sm text-fog">
          Every practice item in this journey, in order. Your latest answer for each
          one counts towards accuracy.
        </p>
      </header>

      {drills.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-fog">
            This journey has no practice items yet. Add some from a lesson page.
          </p>
          <Link href={`/journey/${journey.id}`} className="btn btn-ghost mt-4">
            Back to journey
          </Link>
        </div>
      ) : (
        <>
          <PracticeRunner
            journeyId={journey.id}
            items={toClientItems(drills, lessons)}
            doneHref={`/journey/${journey.id}`}
          />
          {stats.attempts > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-line pt-5">
              <p className="text-xs text-fog">
                {stats.correct} of {stats.attempts} answered correctly so far.
              </p>
              <ResetPracticeButton journeyId={journey.id} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
