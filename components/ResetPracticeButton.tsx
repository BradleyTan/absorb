"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { resetPractice } from "@/lib/actions";

export default function ResetPracticeButton({ journeyId }: { journeyId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const run = () => {
    setError(null);
    startTransition(async () => {
      const res = await resetPractice(journeyId);
      if (!res.ok) {
        setError(res.error ?? "Could not clear your practice history.");
        return;
      }
      setConfirming(false);
      router.refresh();
    });
  };

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="btn btn-ghost !px-3 !py-1.5 !text-xs"
      >
        Clear practice history
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-rose">{error}</span>}
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="btn btn-danger !px-3 !py-1.5 !text-xs"
      >
        {pending ? "Clearing…" : "Yes, clear it"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="btn btn-ghost !px-3 !py-1.5 !text-xs"
      >
        Cancel
      </button>
    </div>
  );
}
