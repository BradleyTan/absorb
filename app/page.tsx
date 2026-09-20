import Link from "next/link";
import TopicForm from "@/components/TopicForm";
import ProgressRing from "@/components/ProgressRing";
import { listJourneys } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-sm font-semibold tabular-nums text-chalk">{value}</div>
      <div className="text-[0.68rem] uppercase tracking-wider text-fog">{label}</div>
    </div>
  );
}

export default async function Home() {
  const cards = isSupabaseConfigured() ? await listJourneys() : [];

  return (
    <div className="space-y-8">
      <header className="animate-fade">
        <p className="chip">Learn → Practice → Apply</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Stop watching. Start absorbing.
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-fog sm:text-base">
          Pick any topic. Absorb turns it into a guided journey that takes you from
          first exposure to actually using it in your own life.
        </p>
      </header>

      <TopicForm />

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">Your journeys</h2>
          {cards.length > 0 && (
            <Link href="/progress" className="text-sm text-brand-soft hover:underline">
              See overall progress →
            </Link>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="text-sm text-fog">
              No journeys yet. Enter a topic above and Absorb will build your first one.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 stagger sm:grid-cols-2">
            {cards.map(({ journey, topic, stats }) => (
              <Link
                key={journey.id}
                href={`/journey/${journey.id}`}
                className="card card-hover block p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.7rem] uppercase tracking-wider text-fog">
                      {topic?.title ?? "Topic"}
                    </p>
                    <h3 className="mt-1 truncate text-base font-semibold tracking-tight">
                      {journey.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-fog">
                      {topic?.description ?? "A personalised path through this topic."}
                    </p>
                  </div>
                  <ProgressRing
                    value={stats.completionPct}
                    size={64}
                    stroke={7}
                    sublabel="done"
                  />
                </div>

                <div className="mt-5 flex items-center gap-6 border-t border-line pt-4">
                  <Stat
                    label="Lessons"
                    value={`${stats.lessonsDone}/${stats.totalLessons}`}
                  />
                  <Stat
                    label="Accuracy"
                    value={stats.attempts ? `${stats.accuracyPct}%` : "—"}
                  />
                  <Stat label="Understanding" value={`${stats.understandingScore}`} />
                  <span className="ml-auto chip">
                    {stats.challengeStatus === "completed"
                      ? "Applied ✓"
                      : stats.completionPct === 100
                        ? "Ready to apply"
                        : stats.lessonsDone > 0
                          ? "In progress"
                          : "Not started"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
