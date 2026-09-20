"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card p-10 text-center animate-rise">
      <p className="text-[0.7rem] uppercase tracking-[0.14em] text-rose">
        Something broke
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Absorb couldn&rsquo;t load that
      </h1>
      <p className="mt-2 text-sm text-fog">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
        <Link href="/" className="btn btn-ghost">
          Back to your journeys
        </Link>
      </div>
    </div>
  );
}
