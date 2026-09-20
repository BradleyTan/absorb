"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setChallengeStatus, updateChallenge } from "@/lib/actions";
import type { Challenge, ChallengeStatus } from "@/lib/types";

const STATUS_COPY: Record<ChallengeStatus, { label: string; tone: string }> = {
  not_started: { label: "Not started", tone: "text-fog" },
  in_progress: { label: "In progress", tone: "text-amber" },
  completed: { label: "Completed", tone: "text-mint" },
};

export default function ChallengeCard({
  journeyId,
  challenge,
}: {
  journeyId: string;
  challenge: Challenge;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ChallengeStatus>(
    (challenge.status as ChallengeStatus) ?? "not_started",
  );
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(challenge.title);
  const [description, setDescription] = useState(challenge.description);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const move = (next: ChallengeStatus) => {
    setError(null);
    startTransition(async () => {
      const res = await setChallengeStatus(journeyId, challenge.id, next);
      if (!res.ok) {
        setError(res.error ?? "Could not update the challenge.");
        return;
      }
      setStatus(next);
      router.refresh();
    });
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateChallenge(journeyId, challenge.id, title, description);
      if (!res.ok) {
        setError(res.error ?? "Could not save the challenge.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-line bg-gradient-to-r from-brand/15 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand/20 text-brand-soft">
              <svg viewBox="0 0 24 24" className="h-4 w-4 stroke-current">
                <path
                  d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.2l5.9-.9L12 3z"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </span>
            <div>
              <p className="text-[0.68rem] uppercase tracking-[0.14em] text-fog">
                Apply · real-world challenge
              </p>
              <p className={`text-xs font-semibold ${STATUS_COPY[status].tone}`}>
                {STATUS_COPY[status].label}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="btn btn-ghost !px-3 !py-1.5 !text-xs"
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div className="p-5">
        {editing ? (
          <div className="space-y-3">
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              aria-label="Challenge title"
            />
            <textarea
              className="input min-h-[9rem] resize-y leading-relaxed"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-label="Challenge description"
            />
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="btn btn-primary"
            >
              Save challenge
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-base font-semibold tracking-tight">{challenge.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#c9cfe3]">
              {challenge.description}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              {status === "not_started" && (
                <button
                  type="button"
                  onClick={() => move("in_progress")}
                  disabled={pending}
                  className="btn btn-primary"
                >
                  Start this challenge
                </button>
              )}
              {status === "in_progress" && (
                <>
                  <button
                    type="button"
                    onClick={() => move("completed")}
                    disabled={pending}
                    className="btn btn-primary"
                  >
                    Mark completed
                  </button>
                  <button
                    type="button"
                    onClick={() => move("not_started")}
                    disabled={pending}
                    className="btn btn-ghost"
                  >
                    Reset
                  </button>
                </>
              )}
              {status === "completed" && (
                <button
                  type="button"
                  onClick={() => move("in_progress")}
                  disabled={pending}
                  className="btn btn-ghost"
                >
                  Reopen challenge
                </button>
              )}
            </div>
          </>
        )}

        {error && <p className="mt-3 text-sm text-rose">{error}</p>}
      </div>
    </div>
  );
}
