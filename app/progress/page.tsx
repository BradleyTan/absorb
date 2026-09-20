import Link from "next/link";
import ProgressRing from "@/components/ProgressRing";
import { listJourneys, overallStats } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

function Tile({
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

export default async function ProgressPage() {
  const cards = isSupabaseConfigured() ? await listJourneys() : [];
  const all = overallStats(cards);

  return (
    <div className="space-y-8">
      <header className="animate-fade">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Your progress
        </h1>
        <p className="mt-1.5 text-sm text-fog">
          Lessons read, practice accuracy, and what&rsquo;s sticking across every
          journey.
        </p>
      </header>

      {cards.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-sm text-fog">
            Nothing to measure yet — start a topic and your progress shows up here.
          </p>
          <Link href="/" className="btn btn-primary mt-4">
            Start a journey
          </Link>
        </div>
      ) : (
        <>
          <section className="card flex flex-wrap items-center gap-6 p-5 animate-rise">
            <ProgressRing
              value={all.understanding}
              size={104}
              label="Understanding"
              sublabel="understood"
            />
            <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Tile
                value={`${all.lessonsDone}/${all.lessons}`}
                label="Lessons read"
              />
              <Tile
                value={all.attempts ? `${all.accuracyPct}%` : "—"}
                label="Practice accuracy"
                hint={
                  all.attempts ? `${all.correct} of ${all.attempts} correct` : undefined
                }
              />
              <Tile
                value={`${all.journeysDone}/${all.journeys}`}
                label="Journeys finished"
              />
              <Tile value={`${all.challengesDone}`} label="Challenges applied" />
            </div>
          </section>

          {(all.strengths.length > 0 || all.weaknesses.length > 0) && (
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <p className="text-sm font-semibold text-mint">Strengths</p>
                <p className="mt-1 text-xs text-fog">
                  Concepts you answer correctly most of the time.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {all.strengths.length === 0 ? (
                    <span className="text-xs text-fog">
                      Answer some practice to build this up.
                    </span>
                  ) : (
                    all.strengths.map((s) => (
                      <span key={s} className="chip border-mint/35 bg-mint/10 text-mint">
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-5">
                <p className="text-sm font-semibold text-amber">Needs another pass</p>
                <p className="mt-1 text-xs text-fog">
                  Concepts where your answers are still slipping.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {all.weaknesses.length === 0 ? (
                    <span className="text-xs text-fog">Nothing flagged — nice.</span>
                  ) : (
                    all.weaknesses.map((w) => (
                      <span
                        key={w}
                        className="chip border-amber/35 bg-amber/10 text-amber"
                      >
                        {w}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">By journey</h2>
            <div className="grid gap-3 stagger">
              {cards.map(({ journey, topic, stats }) => (
                <Link
                  key={journey.id}
                  href={`/journey/${journey.id}`}
                  className="card card-hover flex flex-wrap items-center gap-5 p-4"
                >
                  <ProgressRing
                    value={stats.completionPct}
                    size={56}
                    stroke={6}
                    sublabel="read"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.68rem] uppercase tracking-wider text-fog">
                      {topic?.title ?? "Topic"}
                    </p>
                    <p className="truncate font-medium">{journey.title}</p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div>
                      <p className="font-semibold tabular-nums">
                        {stats.lessonsDone}/{stats.totalLessons}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-fog">
                        Lessons
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold tabular-nums">
                        {stats.attempts ? `${stats.accuracyPct}%` : "—"}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-fog">
                        Accuracy
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold tabular-nums">
                        {stats.understandingScore}
                      </p>
                      <p className="text-[0.65rem] uppercase tracking-wider text-fog">
                        Understanding
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
