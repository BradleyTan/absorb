"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteJourney, renameJourney, saveLesson } from "@/lib/actions";

export default function JourneyManage({
  journeyId,
  journeyTitle,
}: {
  journeyId: string;
  journeyTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(journeyTitle);
  const [lesson, setLesson] = useState({ title: "", key_concept: "", content: "" });
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const flash = (msg: string) => {
    setMessage(msg);
    setError(null);
    setTimeout(() => setMessage(null), 2500);
  };

  const rename = () => {
    startTransition(async () => {
      const res = await renameJourney(journeyId, title);
      if (!res.ok) return setError(res.error ?? "Could not rename the journey.");
      flash("Journey renamed.");
      router.refresh();
    });
  };

  const addLesson = () => {
    startTransition(async () => {
      const res = await saveLesson(journeyId, null, lesson);
      if (!res.ok) return setError(res.error ?? "Could not add the lesson.");
      setLesson({ title: "", key_concept: "", content: "" });
      flash("Lesson added.");
      router.refresh();
    });
  };

  const remove = () => {
    startTransition(async () => {
      const res = await deleteJourney(journeyId);
      if (res && !res.ok) setError(res.error ?? "Could not delete the journey.");
    });
  };

  return (
    <section className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.03]"
        aria-expanded={open}
      >
        <span>
          <span className="block text-sm font-semibold">Manage this journey</span>
          <span className="block text-xs text-fog">
            Rename it, add your own lesson, or delete the whole thing.
          </span>
        </span>
        <span className={`text-fog transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <div className="space-y-6 border-t border-line p-5 animate-rise">
          <div>
            <label className="mb-1.5 block text-xs uppercase tracking-wider text-fog">
              Journey title
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input flex-1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <button
                type="button"
                onClick={rename}
                disabled={pending || title.trim() === journeyTitle}
                className="btn btn-ghost"
              >
                Save title
              </button>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-sm font-semibold">Add a lesson</p>
            <p className="mt-0.5 text-xs text-fog">
              It goes to the end of the Learn stage and counts towards your progress.
            </p>
            <div className="mt-3 space-y-2.5">
              <input
                className="input"
                placeholder="Lesson title"
                value={lesson.title}
                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
              />
              <input
                className="input"
                placeholder="Key concept (one line)"
                value={lesson.key_concept}
                onChange={(e) => setLesson({ ...lesson, key_concept: e.target.value })}
              />
              <textarea
                className="input min-h-[8rem] resize-y leading-relaxed"
                placeholder="Lesson content — blank lines separate paragraphs."
                value={lesson.content}
                onChange={(e) => setLesson({ ...lesson, content: e.target.value })}
              />
              <button
                type="button"
                onClick={addLesson}
                disabled={pending || !lesson.title.trim() || !lesson.content.trim()}
                className="btn btn-primary"
              >
                Add lesson
              </button>
            </div>
          </div>

          <div className="border-t border-line pt-5">
            <p className="text-sm font-semibold text-rose">Danger zone</p>
            <p className="mt-0.5 text-xs text-fog">
              Deleting removes the journey, its lessons, practice and progress.
            </p>
            {confirmDelete ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="btn btn-danger"
                >
                  {pending ? "Deleting…" : "Yes, delete this journey"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="btn btn-danger mt-3"
              >
                Delete journey
              </button>
            )}
          </div>

          {message && <p className="text-sm text-mint">{message}</p>}
          {error && <p className="text-sm text-rose">{error}</p>}
        </div>
      )}
    </section>
  );
}
