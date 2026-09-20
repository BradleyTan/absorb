"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { createJourneyAction, type ActionResult } from "@/lib/actions";

const SUGGESTIONS = [
  "Basics of Negotiation",
  "Building habits that stick",
  "Public speaking",
  "How compound interest works",
  "Reading financial statements",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary min-w-[11rem]" disabled={pending}>
      {pending ? (
        <>
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-spin-slow" aria-hidden="true">
            <circle
              cx="12"
              cy="12"
              r="9"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.3"
              strokeWidth="2.5"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          Building journey…
        </>
      ) : (
        <>
          Generate journey
          <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current" aria-hidden="true">
            <path
              d="M5 12h13m-5-6 6 6-6 6"
              strokeWidth="1.9"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </>
      )}
    </button>
  );
}

export default function TopicForm() {
  const [state, formAction] = useActionState<ActionResult | null, FormData>(
    createJourneyAction,
    null,
  );
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section id="new-topic" className="card p-5 sm:p-7 animate-rise">
      <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
        What do you want to actually understand?
      </h2>
      <p className="mt-1.5 text-sm text-fog">
        Absorb builds a full journey — lessons, graded practice, and a real-world
        challenge you can do this week.
      </p>

      <form action={formAction} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          ref={inputRef}
          name="topic"
          className="input flex-1"
          placeholder="e.g. Basics of Negotiation"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={120}
          required
          aria-label="Topic"
        />
        <SubmitButton />
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs text-fog/70">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setValue(s);
              inputRef.current?.focus();
            }}
            className="chip transition-colors hover:border-brand/50 hover:text-chalk"
          >
            {s}
          </button>
        ))}
      </div>

      {state?.error && (
        <p className="mt-4 rounded-xl border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose animate-pop">
          {state.error}
        </p>
      )}
    </section>
  );
}
