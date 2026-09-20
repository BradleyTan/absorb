"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deletePracticeItem, savePracticeItem } from "@/lib/actions";
import type { PracticeItem, PracticeType } from "@/lib/types";

const TYPES: { value: PracticeType; label: string; hint: string }[] = [
  { value: "flashcard", label: "Flashcard", hint: "Open recall — you grade yourself." },
  { value: "mcq", label: "Multiple choice", hint: "The answer must match an option." },
  {
    value: "fill_blank",
    label: "Fill in the blank",
    hint: "Put ____ in the question; the answer is the missing word.",
  },
  { value: "test", label: "Test question", hint: "Counts towards the end-of-journey test." },
];

type Draft = {
  type: PracticeType;
  question: string;
  answer: string;
  options: string;
};

const toDraft = (item?: PracticeItem): Draft => ({
  type: item?.type ?? "mcq",
  question: item?.question ?? "",
  answer: item?.answer ?? "",
  options: (item?.options ?? []).join("\n"),
});

function ItemForm({
  draft,
  setDraft,
  onSave,
  onCancel,
  pending,
  saveLabel,
}: {
  draft: Draft;
  setDraft: (d: Draft) => void;
  onSave: () => void;
  onCancel?: () => void;
  pending: boolean;
  saveLabel: string;
}) {
  const needsOptions = draft.type === "mcq" || draft.type === "test";
  const hint = TYPES.find((t) => t.value === draft.type)?.hint;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setDraft({ ...draft, type: t.value })}
            className={`chip transition-colors ${
              draft.type === t.value
                ? "border-brand/60 bg-brand/15 text-chalk"
                : "hover:border-brand/40"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {hint && <p className="text-xs text-fog">{hint}</p>}

      <textarea
        className="input min-h-[4.5rem] resize-y"
        placeholder="Question"
        value={draft.question}
        onChange={(e) => setDraft({ ...draft, question: e.target.value })}
      />

      {needsOptions && (
        <textarea
          className="input min-h-[6rem] resize-y"
          placeholder={"Options — one per line"}
          value={draft.options}
          onChange={(e) => setDraft({ ...draft, options: e.target.value })}
        />
      )}

      <input
        className="input"
        placeholder={needsOptions ? "Answer (must match one option exactly)" : "Answer"}
        value={draft.answer}
        onChange={(e) => setDraft({ ...draft, answer: e.target.value })}
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSave}
          disabled={pending}
          className="btn btn-primary"
        >
          {saveLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default function PracticeEditor({
  journeyId,
  lessonId,
  items,
}: {
  journeyId: string;
  lessonId: string;
  items: PracticeItem[];
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft());
  const [newDraft, setNewDraft] = useState<Draft>(toDraft());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const persist = (itemId: string | null, d: Draft, after: () => void) => {
    setError(null);
    startTransition(async () => {
      const res = await savePracticeItem(journeyId, lessonId, itemId, {
        type: d.type,
        question: d.question,
        answer: d.answer,
        options: d.options.split("\n"),
      });
      if (!res.ok) return setError(res.error ?? "Could not save that item.");
      after();
      router.refresh();
    });
  };

  const remove = (itemId: string) => {
    setError(null);
    startTransition(async () => {
      const res = await deletePracticeItem(journeyId, itemId);
      if (!res.ok) return setError(res.error ?? "Could not delete that item.");
      router.refresh();
    });
  };

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Practice items</p>
          <p className="text-xs text-fog">
            {items.length} attached to this lesson.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNewDraft(toDraft());
            setAdding((v) => !v);
          }}
          className="btn btn-ghost !px-3 !py-1.5 !text-xs"
        >
          {adding ? "Cancel" : "Add item"}
        </button>
      </div>

      {adding && (
        <div className="mt-4 rounded-xl border border-line bg-black/20 p-4 animate-rise">
          <ItemForm
            draft={newDraft}
            setDraft={setNewDraft}
            pending={pending}
            saveLabel="Add practice item"
            onSave={() =>
              persist(null, newDraft, () => {
                setAdding(false);
                setNewDraft(toDraft());
              })
            }
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      <div className="mt-4 space-y-2.5">
        {items.length === 0 && !adding && (
          <p className="text-sm text-fog">
            No practice here yet — add one so this lesson can be tested.
          </p>
        )}

        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-line bg-white/[0.02] p-4">
            {editingId === item.id ? (
              <ItemForm
                draft={draft}
                setDraft={setDraft}
                pending={pending}
                saveLabel="Save item"
                onSave={() => persist(item.id, draft, () => setEditingId(null))}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <span className="chip">
                    {TYPES.find((t) => t.value === item.type)?.label ?? item.type}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDraft(toDraft(item));
                        setEditingId(item.id);
                      }}
                      className="btn btn-ghost !px-3 !py-1 !text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.id)}
                      disabled={pending}
                      className="btn btn-danger !px-3 !py-1 !text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed">{item.question}</p>
                <p className="mt-1.5 text-xs text-mint">Answer: {item.answer}</p>
                {item.options && item.options.length > 0 && (
                  <p className="mt-1 text-xs text-fog">
                    Options: {item.options.join(" · ")}
                  </p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-rose">{error}</p>}
    </div>
  );
}
