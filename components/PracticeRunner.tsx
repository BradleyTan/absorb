"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { gradePractice } from "@/lib/actions";
import type { PracticeType } from "@/lib/types";

export type ClientPracticeItem = {
  id: string;
  type: PracticeType;
  question: string;
  options: string[] | null;
  /** Only sent for flashcards — graded items keep their answer on the server. */
  answer?: string | null;
  lessonTitle?: string | null;
};

type Verdict = {
  correct: boolean;
  answer: string;
  keyConcept: string | null;
};

const TYPE_LABEL: Record<PracticeType, string> = {
  flashcard: "Flashcard",
  mcq: "Multiple choice",
  fill_blank: "Fill in the blank",
  test: "Test question",
};

export default function PracticeRunner({
  journeyId,
  items,
  doneHref,
  doneLabel = "Back to journey",
  compact = false,
}: {
  journeyId: string;
  items: ClientPracticeItem[];
  doneHref: string;
  doneLabel?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [typed, setTyped] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<boolean[]>([]);
  const [pending, startTransition] = useTransition();

  if (items.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-fog">
        No practice items here yet.
      </div>
    );
  }

  const done = index >= items.length;
  const item = items[index];
  const score = results.filter(Boolean).length;

  const reset = () => {
    setIndex(0);
    setResults([]);
    setVerdict(null);
    setRevealed(false);
    setSelected(null);
    setTyped("");
    setError(null);
  };

  const submit = (submitted: string) => {
    if (pending || verdict) return;
    setError(null);
    startTransition(async () => {
      const res = await gradePractice(journeyId, item.id, submitted);
      if (!res.ok) {
        setError(res.error ?? "Could not save that answer.");
        return;
      }
      setVerdict({ correct: res.correct, answer: res.answer, keyConcept: res.keyConcept });
      setResults((r) => [...r, res.correct]);
      router.refresh();
    });
  };

  const next = () => {
    setIndex((i) => i + 1);
    setVerdict(null);
    setRevealed(false);
    setSelected(null);
    setTyped("");
    setError(null);
  };

  if (done) {
    const pct = Math.round((score / items.length) * 100);
    return (
      <div className="card p-7 text-center animate-pop">
        <p className="text-[0.7rem] uppercase tracking-[0.14em] text-fog">
          Session complete
        </p>
        <p className="mt-3 text-4xl font-semibold tabular-nums">
          {score}
          <span className="text-fog">/{items.length}</span>
        </p>
        <p className="mt-2 text-sm text-fog">
          {pct >= 80
            ? "Strong recall — this one's sticking."
            : pct >= 50
              ? "Getting there. Re-read the lesson, then run it again."
              : "Worth another pass — go back over the lesson first."}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn btn-ghost">
            Practise again
          </button>
          <Link href={doneHref} className="btn btn-primary">
            {doneLabel}
          </Link>
        </div>
      </div>
    );
  }

  const isChoice = item.type === "mcq" || item.type === "test";

  return (
    <div className={compact ? "" : "animate-rise"}>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand to-mint transition-[width] duration-500"
            style={{ width: `${(index / items.length) * 100}%` }}
          />
        </div>
        <span className="shrink-0 text-xs tabular-nums text-fog">
          {index + 1} / {items.length}
        </span>
      </div>

      <div key={item.id} className="card p-5 sm:p-6 animate-pop">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip">{TYPE_LABEL[item.type]}</span>
          {item.lessonTitle && (
            <span className="truncate text-xs text-fog">{item.lessonTitle}</span>
          )}
        </div>

        <p className="mt-4 text-lg font-medium leading-relaxed">{item.question}</p>

        {/* ── Flashcard ─────────────────────────────────────── */}
        {item.type === "flashcard" && (
          <div className="mt-5">
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="btn btn-ghost"
              >
                Reveal answer
              </button>
            ) : (
              <div className="animate-pop">
                <div className="rounded-xl border border-line bg-black/25 p-4 text-sm leading-relaxed text-chalk">
                  {item.answer}
                </div>
                {!verdict && (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => submit("knew_it")}
                      className="btn btn-primary"
                    >
                      I knew it
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => submit("still_learning")}
                      className="btn btn-ghost"
                    >
                      Still learning
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Multiple choice / test ────────────────────────── */}
        {isChoice && (
          <div className="mt-5 grid gap-2.5">
            {(item.options ?? []).map((opt) => {
              const chosen = selected === opt;
              const isAnswer = verdict?.answer === opt;
              let tone = "border-line bg-white/[0.03] hover:border-brand/50";
              if (verdict) {
                if (isAnswer) tone = "border-mint/60 bg-mint/10";
                else if (chosen) tone = "border-rose/60 bg-rose/10";
                else tone = "border-line bg-white/[0.02] opacity-60";
              }
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={pending || Boolean(verdict)}
                  onClick={() => {
                    setSelected(opt);
                    submit(opt);
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-all disabled:cursor-default ${tone}`}
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-[0.6rem] text-fog">
                    {verdict && isAnswer ? "✓" : verdict && chosen ? "✕" : ""}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* ── Fill in the blank ─────────────────────────────── */}
        {item.type === "fill_blank" && (
          <form
            className="mt-5 flex flex-col gap-3 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              if (typed.trim()) submit(typed);
            }}
          >
            <input
              className="input flex-1"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type the missing word"
              disabled={pending || Boolean(verdict)}
              aria-label="Your answer"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={pending || Boolean(verdict) || !typed.trim()}
            >
              Check
            </button>
          </form>
        )}

        {/* ── Feedback ──────────────────────────────────────── */}
        {verdict && (
          <div
            className={`mt-5 rounded-xl border p-4 ${
              verdict.correct
                ? "border-mint/40 bg-mint/10 animate-pop"
                : "border-rose/40 bg-rose/10 animate-shake"
            }`}
          >
            <p
              className={`text-sm font-semibold ${
                verdict.correct ? "text-mint" : "text-rose"
              }`}
            >
              {verdict.correct
                ? item.type === "flashcard"
                  ? "Marked as known"
                  : "Correct"
                : item.type === "flashcard"
                  ? "Marked for review"
                  : "Not quite"}
            </p>
            {item.type !== "flashcard" && (
              <p className="mt-1.5 text-sm leading-relaxed text-chalk/90">
                Answer: <span className="font-medium">{verdict.answer}</span>
              </p>
            )}
            {verdict.keyConcept && (
              <p className="mt-1.5 text-xs leading-relaxed text-fog">
                Key concept: {verdict.keyConcept}
              </p>
            )}
            <button type="button" onClick={next} className="btn btn-ghost mt-4">
              {index + 1 === items.length ? "See results" : "Next question"}
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
