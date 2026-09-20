"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteLesson, saveLesson } from "@/lib/actions";
import type { Lesson } from "@/lib/types";

export default function LessonEditor({
  journeyId,
  lesson,
}: {
  journeyId: string;
  lesson: Lesson;
}) {
  const router = useRouter();
  const [values, setValues] = useState({
    title: lesson.title,
    key_concept: lesson.key_concept ?? "",
    content: lesson.content,
  });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await saveLesson(journeyId, lesson.id, values);
      if (!res.ok) return setError(res.error ?? "Could not save the lesson.");
      setMessage("Saved.");
      setTimeout(() => setMessage(null), 2500);
      router.refresh();
    });
  };

  const remove = () => {
    setError(null);
    startTransition(async () => {
      const res = await deleteLesson(journeyId, lesson.id);
      if (!res.ok) return setError(res.error ?? "Could not delete the lesson.");
      router.push(`/journey/${journeyId}`);
      router.refresh();
    });
  };

  return (
    <div className="card p-5 sm:p-6">
      <p className="text-sm font-semibold">Lesson content</p>
      <div className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-fog">
            Title
          </label>
          <input
            className="input"
            value={values.title}
            onChange={(e) => setValues({ ...values, title: e.target.value })}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-fog">
            Key concept
          </label>
          <input
            className="input"
            value={values.key_concept}
            onChange={(e) => setValues({ ...values, key_concept: e.target.value })}
            placeholder="The one idea this lesson earns"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-fog">
            Content
          </label>
          <textarea
            className="input min-h-[16rem] resize-y leading-relaxed"
            value={values.content}
            onChange={(e) => setValues({ ...values, content: e.target.value })}
          />
          <p className="mt-1.5 text-xs text-fog">
            Blank lines separate paragraphs.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={save}
          disabled={pending}
          className="btn btn-primary"
        >
          Save lesson
        </button>
        {confirmDelete ? (
          <>
            <button
              type="button"
              onClick={remove}
              disabled={pending}
              className="btn btn-danger"
            >
              Yes, delete lesson
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="btn btn-ghost"
            >
              Cancel
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="btn btn-danger"
          >
            Delete lesson
          </button>
        )}
        {message && <span className="text-sm text-mint">{message}</span>}
        {error && <span className="text-sm text-rose">{error}</span>}
      </div>
    </div>
  );
}
