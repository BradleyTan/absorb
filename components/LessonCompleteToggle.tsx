"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setLessonComplete } from "@/lib/actions";

export default function LessonCompleteToggle({
  journeyId,
  lessonId,
  completed,
}: {
  journeyId: string;
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [isDone, setIsDone] = useState(completed);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !isDone;
    setError(null);
    startTransition(async () => {
      const res = await setLessonComplete(journeyId, lessonId, next);
      if (!res.ok) {
        setError(res.error ?? "Could not save that.");
        return;
      }
      setIsDone(next);
      router.refresh();
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={isDone ? "btn btn-ghost" : "btn btn-primary"}
      >
        {isDone ? (
          <>
            <span className="text-mint">✓</span> Understood — undo
          </>
        ) : (
          "Mark as understood"
        )}
      </button>
      {error && <p className="mt-2 text-sm text-rose">{error}</p>}
    </div>
  );
}
